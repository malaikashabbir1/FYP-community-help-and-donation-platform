const Donation = require("../models/donation");
const Application = require("../models/application");
const FraudAlert = require("../models/fraudAlert");

const detectFraud = async (
    userId,
    campaignId,
    amount
) => {

    const flags = [];

    console.log("Fraud check started");

    // ===================================
    // Last 30 days donation history
    // same donor, all campaigns
    // ===================================

    const previousDonations =
        await Donation.find({
            donor: userId,
            createdAt: {
                $gte: new Date(
                    Date.now() -
                    30 * 24 * 60 * 60 * 1000
                )
            }
        })
        .sort({ createdAt: 1 })
        .select("amount createdAt");

    console.log(
        "Previous donations:",
        previousDonations.length
    );

    // ===================================
    // High donation anomaly
    // ===================================

    if (previousDonations.length >= 2) {

        const history =
            previousDonations.slice(0, -1);

        const latest =
            previousDonations[
                previousDonations.length - 1
            ];

        const avg =
            history.reduce(
                (sum, d) =>
                    sum + d.amount,
                0
            ) / history.length;
            
        console.log("=== FRAUD DEBUG ===");
        console.log("User:", userId);
        console.log("History:", history.map(d => d.amount));    
        console.log("Average:", avg);
        console.log("Threshold:", avg * 3);
        console.log("Latest:", amount);
        console.log("Fraud Triggered:", amount > avg * 3);
        console.log("===================");

        if (
            latest.amount >
            avg * 3
        ) {
            flags.push(
                "High donation anomaly"
            );
        }
    }

    // ===================================
    // Rapid donations
    // keep separate
    // ===================================

    const timeWindow =
        new Date(
            Date.now() -
            30 * 1000
        );

    const recentDonations =
        await Donation.find({
            donor: userId,
            campaign: campaignId,
            createdAt: {
                $gte: timeWindow
            }
        });

    console.log(
        "Recent donations:",
        recentDonations.length
    );

    if (
        recentDonations.length >= 3
    ) {
        flags.push(
            "Rapid donations detected"
        );
    }

    // ===================================
    // Excessive applications
    // ===================================

    const applications =
        await Application.find({
            user: userId
        });

    if (
        applications.length > 10
    ) {
        flags.push(
            "Excessive applications"
        );
    }

    console.log("Flags:", flags);

    return {
        isFraud:
            flags.length > 0,
        flags
    };
};


const runBatchFraudScan = async () => {
    try {
       

        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 hours

        const donations = await Donation.find({
            createdAt: { $gte: cutoff }
        });
        const userMap = {};

        // Group by user
        donations.forEach(d => {
            const userId = d.donor.toString();
            if (!userMap[userId]) userMap[userId] = [];
            userMap[userId].push(d);
        });

        for (const userId in userMap) {

            const userDonations = userMap[userId];
            let score = 0;
            let reasons = [];

            // ======================
            // Rule 1: Multiple donations
            // ======================
            if (userDonations.length >= 3) {
                score += 25;
                reasons.push("Multiple donations detected");
            }

            // ======================
            // Rule 2: Average check
            // ======================
            const total = userDonations.reduce(
                (sum, d) => sum + d.amount,
                0
            );

            const avg = total / userDonations.length;
            const latest = userDonations[userDonations.length - 1];

            if (latest.amount > avg * 3) {
                score += 35;
                reasons.push("Donation much higher than average");
            }

            // ======================
            // Rule 3: Rapid donations
            // ======================
            const sorted = [...userDonations].sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );

            for (let i = 1; i < sorted.length; i++) {
                const diff =
                    (new Date(sorted[i].createdAt) -
                        new Date(sorted[i - 1].createdAt)) / 1000;

                if (diff < 10) {
                    score += 40;
                    reasons.push("Rapid donations detected");
                    break;
                }
            }

            // ======================
            // Severity mapping
            // ======================
            let severityLevel = "low";
            if (score >= 70) severityLevel = "high";
            else if (score >= 40) severityLevel = "medium";

            // ======================
            // DUPLICATE PREVENTION (IMPORTANT FIX)
            // ======================
            const existingAlert = await FraudAlert.findOne({
                user: userId,
                type: "behavior_anomaly"
            });

            // ======================
            // Save Fraud Alert ONLY if not exists
            // ======================
            if (score >= 40 && !existingAlert) {

                await FraudAlert.create({
                    user: userId,
                    type: "behavior_anomaly",
                    message: reasons.join(", "),
                    severity: score, // 0–100 score
                    source: "batch",
                    createdAt: new Date()
                });
            }
        }

    } catch (err) {
        console.error("SCAN ERROR:", err);
    }
};


module.exports = {
    detectFraud,
    runBatchFraudScan
};