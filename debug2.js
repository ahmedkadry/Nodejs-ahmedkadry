const show = (label, val) => {
    console.log(`${label}: typeof = ${typeof val}`);
    if (typeof val === 'function') {
        console.log(val.toString().split('\n').slice(0, 3).join('\n'));
    } else {
        console.log('   ⚠️ NOT A FUNCTION:', JSON.stringify(val));
    }
    console.log('---');
};

const authMw = require('./middleware/authMiddleware');
show('authMiddleware', authMw);

const roleMw = require('./middleware/roleMiddleware');
show('roleMiddleware', roleMw);

const adminCheck = roleMw('admin');
show('roleMiddleware("admin")', adminCheck);

try {
    require('./routes/userRoutes');
    console.log('✅ userRoutes loaded');
} catch (err) {
    console.log('❌ userRoutes:', err.message);
    console.log(err.stack.split('\n').slice(0, 5).join('\n'));
}

try {
    require('./routes/adminRoutes');
    console.log('✅ adminRoutes loaded');
} catch (err) {
    console.log('❌ adminRoutes:', err.message);
    console.log(err.stack.split('\n').slice(0, 5).join('\n'));
}