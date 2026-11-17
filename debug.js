const check = (label, path) => {
    try {
        const mod = require(path);
        const type = typeof mod;
        console.log(`✅ ${label}: ${type}`, type === 'object' ? Object.keys(mod) : '');
    } catch (err) {
        console.log(`❌ ${label}: ${err.message}`);
    }
};

check('attachUser', './middleware/attachUser');
check('authMiddleware', './middleware/authMiddleware');
check('roleMiddleware', './middleware/roleMiddleware');
check('authController', './controllers/authController');
check('authRoutes', './routes/authRoutes');
check('userRoutes', './routes/userRoutes');
check('adminRoutes', './routes/adminRoutes');