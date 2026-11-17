const mongoose = require('mongoose');

// ⚠️ IMPORTANT: Do NOT call dns.setServers() here.
// It must run at the very top of server.js — BEFORE any other require —
// or the MongoDB driver may perform its SRV lookup before DNS is configured.
// See server.js:
//   const dns = require('dns');
//   dns.setServers(['8.8.8.8', '8.8.4.4']);
//   require('dotenv').config();
//   ... everything else

// ✅ Reuse connection across serverless invocations (Vercel)
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Classify a connection error into a human-readable diagnostic.
 */
function diagnose(err) {
    const msg = (err && err.message) || '';

    if (msg.includes('querySrv') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
        return (
            '❌ DNS SRV lookup failed. Node cannot resolve your mongodb+srv:// host.\n' +
            '   Fixes to try:\n' +
            '   1) Ensure dns.setServers([\'8.8.8.8\', \'8.8.4.4\']) runs FIRST in server.js\n' +
            '   2) Switch to the non-SRV mongodb:// connection string from Atlas → Connect → Drivers\n' +
            '   3) Disable VPN / try a different network'
        );
    }

    if (msg.includes('IP') || msg.includes('whitelist')) {
        return (
            '❌ Your IP is not whitelisted in Atlas.\n' +
            '   → Atlas → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)\n' +
            '   → Confirm status shows "Active" (not "Pending")'
        );
    }

    if (msg.includes('authentication') || msg.includes('bad auth')) {
        return (
            '❌ Authentication failed. Check the username/password in MONGO_URI.\n' +
            '   → Atlas → Database Access → verify user exists and password matches\n' +
            '   → URL-encode special chars in the password (e.g. @ → %40)'
        );
    }

    if (msg.includes('timeout') || msg.includes('timed out')) {
        return (
            '❌ Connection timed out.\n' +
            '   → Atlas cluster may be paused — open Atlas and resume it\n' +
            '   → Check your network / firewall'
        );
    }

    if (msg.includes('MONGO_URI') || msg.includes('undefined')) {
        return (
            '❌ MONGO_URI is not defined.\n' +
            '   → Local: ensure .env exists at project root with MONGO_URI=...\n' +
            '   → Vercel: add MONGO_URI in Settings → Environment Variables → Production'
        );
    }

    return `❌ MongoDB error: ${msg}`;
}

async function connectDB() {
    // 1. Already connected → reuse
    if (cached.conn) {
        return cached.conn;
    }

    // 2. Connection already in flight → await it (avoids duplicate connects)
    if (!cached.promise) {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        const opts = {
            // Serverless-friendly: never buffer queries silently
            bufferCommands: false,

            // Fail fast — do not sit for 10s on a dead network
            serverSelectionTimeoutMS: 5000,

            // Keep pool small — each Vercel instance opens its own pool
            maxPoolSize: 5,

            // Close idle sockets so frozen functions don't leak connections
            socketTimeoutMS: 45000,
        };

        console.log('🔄 Connecting to MongoDB...');

        cached.promise = mongoose
            .connect('mongodb+srv://ahmedkadry4work_db_user:BPsRC6Ytqgm0l7oA@cluster0.dsnnsao.mongodb.net', opts)
            .then((mongooseInstance) => {
                console.log('✅ MongoDB connected');

                // Log disconnection events so Vercel logs show what happened
                mongooseInstance.connection.on('disconnected', () => {
                    console.warn('⚠️ MongoDB disconnected — resetting cache');
                    cached.conn = null;
                    cached.promise = null;
                });

                mongooseInstance.connection.on('error', (err) => {
                    console.error('💥 MongoDB connection error:', err.message);
                });

                return mongooseInstance;
            })
            .catch((err) => {
                // Reset so the next request retries instead of hanging forever
                cached.promise = null;
                cached.conn = null;

                console.error(diagnose(err));
                throw err;
            });
    }

    // 3. Await in-flight promise and cache result
    cached.conn = await cached.promise;
    return cached.conn;
}

module.exports = connectDB;