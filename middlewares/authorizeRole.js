
// This is a role-checker middleware.

module.exports = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).send('Access Denied');
        }
        next();
    };
};
