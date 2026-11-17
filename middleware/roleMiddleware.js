// middleware/roleMiddleware.js
const checkRole = (role) => {
    return (req, res, next) => {
        // Assumes authMiddleware has already set req.user
        if (req.user && req.user.role === role) {
            next(); // User has permission
        } else {
            res.status(403).send('Forbidden: You do not have permission.');
        }
    };
};


module.exports = (role) => (req, res, next) => {
    if (req.user && req.user.role === role)
        return next();
    return res.status(403).render('403', { title: 'Forbidden' });
};