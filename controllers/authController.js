const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const setAuthCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000 // 1 hour
    });
};

// ---------- REGISTER ----------
exports.getRegister = (req, res) => {
    if (req.user) return res.redirect(dashboardFor(req.user));
    res.render('auth/register', { title: 'Register', errors: [], old: {} });
};

exports.postRegister = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('auth/register', {
            title: 'Register',
            errors: errors.array(),
            old: req.body
        });
    }

    const { name, email, password } = req.body;

    try {
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).render('auth/register', {
                title: 'Register',
                errors: [{ msg: 'Email already registered' }],
                old: req.body
            });
        }

        const user = await User.create({ name, email, password });
        setAuthCookie(res, signToken(user._id));
        req.session.success = `Welcome, ${user.name}! Your account is ready.`;
        return res.redirect(dashboardFor(user));
    } catch (err) {
        console.error(err);
        return res.status(500).render('auth/register', {
            title: 'Register',
            errors: [{ msg: 'Server error. Please try again.' }],
            old: req.body
        });
    }
};

// ---------- LOGIN ----------
exports.getLogin = (req, res) => {
    if (req.user) return res.redirect(dashboardFor(req.user));
    res.render('auth/login', { title: 'Login', errors: [], old: {} });
};

exports.postLogin = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('auth/login', {
            title: 'Login',
            errors: errors.array(),
            old: req.body
        });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).render('auth/login', {
                title: 'Login',
                errors: [{ msg: 'Invalid email or password' }],
                old: req.body
            });
        }

        setAuthCookie(res, signToken(user._id));
        req.session.success = `Welcome back, ${user.name}!`;
        return res.redirect(dashboardFor(user));
    } catch (err) {
        console.error(err);
        return res.status(500).render('auth/login', {
            title: 'Login',
            errors: [{ msg: 'Server error. Please try again.' }],
            old: req.body
        });
    }
};

// ---------- LOGOUT ----------
exports.logout = (req, res) => {
    res.clearCookie('token');
    req.session.destroy(() => res.redirect('/login'));
};

// ---------- Helper ----------
function dashboardFor(user) {
    return user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
}