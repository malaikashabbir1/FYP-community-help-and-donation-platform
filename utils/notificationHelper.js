const Notification = require("../models/notification");

// 🔔 Core DB function (NO business logic here)
const createNotification = async (
  userId,
  type = "info",
  message = "",
  link = ""
) => {
  try {
    if (!userId || !message) return;

    await Notification.create({
      user: userId,
      message,
      type,
      link,
      read: false,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Notification Error:", err.message);
  }
};

module.exports = createNotification;