// Confirms user is logged in using JWT stored in cookies

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.redirect('/auth/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ensure MongoDB-style consistency using _id everywhere
        req.user = {
            _id: decoded._id || decoded.userId, // supports both formats safely
            role: decoded.role,
            name: decoded.name || ''
        };

        next();
    } catch (err) {
        console.error('JWT verification failed:', err.message);
        return res.redirect('/auth/login');
    }
};