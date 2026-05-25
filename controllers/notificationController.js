const Notification = require("../models/notification");


// =====================================================
// 📌 GET NOTIFICATIONS PAGE (EJS RENDER)
// =====================================================
exports.getUserNotificationsPage = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.render("common/notifications", {
      notifications,
    });

  } catch (err) {
    console.error("Error fetching notifications page:", err);
    res.status(500).send("Server Error");
  }
};


// =====================================================
// 📌 MARK SINGLE NOTIFICATION AS READ
// (Used via frontend JS fetch / click)
// =====================================================
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id, // extra safety
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ success: false });
  }
};


// =====================================================
// 📌 MARK ALL NOTIFICATIONS AS READ
// =====================================================
// notificationController.js
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id },
      { isRead: true }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};


exports.getNotificationsData = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};