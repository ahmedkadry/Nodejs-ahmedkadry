const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, (req, res) => {
    res.render('user/dashboard', { title: 'Dashboard' });
});

module.exports = router;