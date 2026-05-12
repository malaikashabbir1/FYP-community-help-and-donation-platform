const express = require('express');
const router = express.Router();

const authenticateToken = require('../middlewares/authenticateToken');
const profileController = require('../controllers/profileController');

router.get('/', authenticateToken, profileController.getProfile);
router.get('/edit', authenticateToken, profileController.getEditProfile);
router.post('/edit', authenticateToken, profileController.updateProfile);

// PASSWORD 
router.get('/change-password', authenticateToken, profileController.getChangePassword);
router.post('/change-password', authenticateToken, profileController.updatePassword);

module.exports = router;