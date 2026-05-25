const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const authenticateToken = require("../middlewares/authenticateToken");


// =====================================================
// 📌 NOTIFICATIONS PAGE (EJS)
// =====================================================
router.get(
  "/",
  authenticateToken,
  notificationController.getUserNotificationsPage
);

// =====================================================
// 📌 MARK ALL NOTIFICATIONS AS READ
// =====================================================
router.patch(
  "/read-all",
  authenticateToken,
  notificationController.markAllAsRead
);


// =====================================================
// 📌 MARK SINGLE NOTIFICATION AS READ
// =====================================================
router.patch(
  "/:id/read",
  authenticateToken,
  notificationController.markAsRead
);


router.get("/data", authenticateToken, notificationController.getNotificationsData);

module.exports = router;