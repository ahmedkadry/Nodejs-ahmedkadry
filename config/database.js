const dns = require('dns');
const mongoose = require('mongoose');

// ✅ Fix SRV lookup issues on Vercel / serverless environments
// Forces Node to use public DNS servers that reliably resolve mongodb+srv:// records
//dns.setServers(['1.1.1.1', '8.8.8.8']);

// ✅ Cache the connection across serverless invocations
// Prevents "connection storm" — Vercel reuses the same function instance
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    // 1. Already connected → reuse
    if (cached.conn) {
        return cached.conn;
    }

    // 2. Connection in progress → wait for it
    if (!cached.promise) {
        const opts = {
            // Serverless-friendly options
            bufferCommands: false,       // Fail fast instead of hanging if not connected
            maxPoolSize: 5,              // Small pool — each Vercel function gets its own
            serverSelectionTimeoutMS: 10000, // 10s timeout (Atlas cold starts can be slow)
            socketTimeoutMS: 45000,      // Close idle sockets after 45s
        };

        console.log('🔄 Connecting to MongoDB...');

        cached.promise = mongoose
            // .connect(process.env.MONGO_URI , opts)
            .connect('mongodb+srv://ahmedkadry4work_db_user:dFe4uLvXff4ZPRh@cluster0.ah8fhkr.mongodb.net', opts)
            .then((mongooseInstance) => {
                console.log('✅ MongoDB connected');
                return mongooseInstance;
            })
            .catch((err) => {
                // Reset promise so the next request retries instead of hanging forever
                cached.promise = null;

                // Friendly diagnostics for the most common Atlas failures
                const msg = err.message || '';
                if (msg.includes('IP') || msg.includes('whitelist')) {
                    console.error('❌ MongoDB: Your IP is not whitelisted in Atlas.');
                    console.error('   → Go to Atlas → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)');
                } else if (msg.includes('authentication') || msg.includes('bad auth')) {
                    console.error('❌ MongoDB: Authentication failed. Check DB username/password in MONGO_URI.');
                } else if (msg.includes('ENOTFOUND') || msg.includes('querySrv')) {
                    console.error('❌ MongoDB: DNS SRV lookup failed. Verify MONGO_URI hostname or check Atlas cluster status.');
                } else if (msg.includes('timeout') || msg.includes('timed out')) {
                    console.error('❌ MongoDB: Connection timed out. Atlas cluster may be paused or unreachable.');
                } else {
                    console.error('❌ MongoDB error:', msg);
                }

                throw err;
            });
    }

    // 3. Await the in-flight promise and cache the result
    cached.conn = await cached.promise;
    return cached.conn;
}

module.exports = connectDB;