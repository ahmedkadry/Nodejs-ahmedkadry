require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'Admin';
    if (!email || !password) {
        console.log('Usage: node scripts/createAdmin.js <email> <password> [name]');
        process.exit(1);
    }
    const user = await User.create({ name, email, password, role: 'admin' });
    console.log('✅ Admin created:', user.email);
    process.exit(0);
})();