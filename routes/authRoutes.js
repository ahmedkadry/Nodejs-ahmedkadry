const router = require('express').Router();
const { body } = require('express-validator');
//const auth = require('../controllers/authController');
const auth = require('../controllers/authController');

router.get('/register', auth.getRegister);

router.post('/register', [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) throw new Error('Passwords do not match');
        return true;
    })
], auth.postRegister);

router.get('/login', auth.getLogin);


router.post('/login', [
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
], auth.postLogin);

router.post('/logout', auth.logout);
router.get('/logout', auth.logout);

module.exports = router;