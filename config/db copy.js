const dns = require('dns');
const mongoose = require('mongoose');

// ✅ Fix SRV lookup issues on Vercel / serverless environments
// Forces Node to use public DNS servers that reliably resolve mongodb+srv:// records
try {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    dns.setServers(['8.8.8.8', '8.8.4.4'])
    console.log('✅ DNS servers set');
} catch (err) {
    console.warn('⚠️ Could not set DNS servers:', err.message);
}


const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://ahmedkadry4work_db_user:1FFc1hlPgZqjF5zU@cluster0.ah8fhkr.mongodb.net');
        console.log('✅ MongoDB connected');
        console.log(' Allah Akber ----  database connected successfully');
    } catch (err) {
        console.error('❌ MongoDB error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;