// routes/adminRoutes.js
/*
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Only logged-in users with 'admin' role can access these
router.get('/dashboard', authMiddleware, checkRole('admin'), adminController.getDashboard);
router.get('/users', authMiddleware, checkRole('admin'), adminController.getUsers);
*/


const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const User = require('../models/User');

router.get('/dashboard', authMiddleware, checkRole('admin'), (req, res) => {
    res.render('admin/dashboard', { title: 'Admin Dashboard' });
});

router.get('/users', authMiddleware, checkRole('admin'), async (req, res) => {
    const users = await User.find().select('-password');
    res.render('admin/users', { title: 'Manage Users', users });
});

module.exports = router;