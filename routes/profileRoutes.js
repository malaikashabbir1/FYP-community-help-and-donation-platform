const express = require('express');
const router = express.Router();

const authenticateToken = require('../middlewares/authenticateToken');
const profileController = require('../controllers/profileController');

router.get('/', authenticateToken, profileController.getProfile);
router.get('/edit', authenticateToken, profileController.getEditProfile);
router.post('/edit', authenticateToken, profileController.updateProfile);

module.exports = router;