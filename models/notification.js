const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  message: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["info", "success", "warning", "error"],
    default: "info",
  },

  isRead: {
    type: Boolean,
    default: false,
  },

  link: {
    type: String, // optional (e.g. /campaign/123)
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);