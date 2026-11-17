// middleware/attachUser.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    res.locals.currentUser = null;
    const token = req.cookies.token;
    if (!token) return next();
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        req.user = user;
        res.locals.currentUser = user;
    } catch (err) {
        res.clearCookie('token');
    }
    next();
};