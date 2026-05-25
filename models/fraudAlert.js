const mongoose = require("mongoose");

const fraudAlertSchema = new mongoose.Schema({

    // =========================
    // USER WHO TRIGGERED ALERT
    // =========================

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },


    // =========================
    // RELATED CAMPAIGN (optional but useful)
    // =========================

    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campaign",
        default: null,
        index: true
    },


    // =========================
    // FRAUD TYPE / CATEGORY
    // =========================

    type: {
        type: String,
        required: true,
        enum: [
            "donation_spike",
            "rapid_donations",
            "excessive_applications",
            "behavior_anomaly",
            "other"
        ]
    },

    alertKey: {
        type: String,
        index: true
    },


    // =========================
    // HUMAN READABLE MESSAGE
    // =========================

    message: {
        type: String,
        required: true
    },

    


    // =========================
    // FRAUD SEVERITY SCORE (AI STYLE)
    // 0 = low risk, 100 = high risk
    // =========================

    severity: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    },

    source: {
        type: String,
        enum: ["realtime", "batch"],
        default: "realtime"
    },

    // =========================
    // DETECTED AT TIME
    // =========================

    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }

});

module.exports =
    mongoose.model(
        "FraudAlert",
        fraudAlertSchema
    );