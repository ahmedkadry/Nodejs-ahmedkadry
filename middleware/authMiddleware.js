const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const setCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000
    });
};

module.exports = (req, res, next) => {
    if (req.user) return next();
    req.session.error = 'Please login to continue';
    return res.redirect('/login');
};

exports.getRegister = (req, res) => {
    if (req.user) return res.redirect(req.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
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
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).render('auth/register', {
                title: 'Register',
                errors: [{ msg: 'Email already registered' }],
                old: req.body
            });
        }
        const user = await User.create({ name, email, password });
        const token = signToken(user._id);
        setCookie(res, token);
        req.session.success = `Welcome, ${user.name}!`;
        return res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    } catch (err) {
        console.error(err);
        return res.status(500).render('auth/register', {
            title: 'Register',
            errors: [{ msg: 'Server error. Please try again.' }],
            old: req.body
        });
    }
};

exports.getLogin = (req, res) => {
    if (req.user) return res.redirect(req.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
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
        const token = signToken(user._id);
        setCookie(res, token);
        req.session.success = `Welcome back, ${user.name}!`;
        return res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    } catch (err) {
        console.error(err);
        return res.status(500).render('auth/login', {
            title: 'Login',
            errors: [{ msg: 'Server error. Please try again.' }],
            old: req.body
        });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    req.session.destroy(() => res.redirect('/login'));
};