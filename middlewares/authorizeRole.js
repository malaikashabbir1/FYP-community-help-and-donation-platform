
// This is a role-checker middleware.
//____________________________________________________________________CLOSURE 
// Allowed role is coming from the router file of admin , volunteer and donorr.
module.exports = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).send('Access Denied');
        }
        next();
    };
};


//It’s a “role checker” that stops users without permission from accessing a route.

