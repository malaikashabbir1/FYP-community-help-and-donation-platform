const User = require("../models/user");
const createNotification = require("./notificationHelper");

// 🔔 Notify Admin (single admin system)
const notifyAdmin = async (message, link = "", type = "info") => {
  try {

    const admin = await User.findOne({
      role: "admin",
      email: "malaikashabbir20@gmail.com"
    });

    if (!admin) {
      console.log("Admin not found");
      return;
    }

    await createNotification(
      admin._id,
      type,
      message,
      link
    );

  } catch (err) {
    console.error("notifyAdmin Error:", err.message);
  }
};

// 🔔 Notify Single User
const notifyUser = async (userId, message, link = "", type = "info") => {
  try {
    if (!userId) return;

    await createNotification(userId, type, message, link);
  } catch (err) {
    console.error("notifyUser Error:", err.message);
  }
};

// 🔔 Notify Multiple Users
const notifyMany = async (userIds = [], message, link = "", type = "info") => {
  try {
    if (!userIds.length) return;

    const tasks = userIds.map((id) =>
      createNotification(id, type, message, link)
    );

    await Promise.all(tasks);
  } catch (err) {
    console.error("notifyMany Error:", err.message);
  }
};

module.exports = {
  notifyAdmin,
  notifyUser,
  notifyMany,
};