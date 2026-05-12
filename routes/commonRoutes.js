const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');

router.get('/coming-soon/:page', verifyToken, (req, res) => {
  const page = req.params.page;

  const title = page
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  res.render('common/coming-soon', { user: req.user, title });
});


module.exports = router;
