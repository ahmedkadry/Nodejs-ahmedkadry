require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // ✅ FIXED LINE
const methodOverride = require('method-override');
const path = require('path');

const connectDB = require('./config/db');
const attachUser = require('./middleware/attachUser');

const app = express();

// server.js — MUST be the first lines
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google DNS

connectDB();

// ✅ Call it once at startup — Vercel awaits this before handling requests

connectDB().catch((err) => {
    console.error('Failed to connect to MongoDB on startup:', err.message);
    // Don't exit — Vercel will still serve 404s, but logs show the real error
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

// In your server.js, BEFORE your session middleware:
app.set('trust proxy', 1); // Crucial for Vercel

// ✅ Sessions now work
/*
app.use(
    session({
        secret: 'your_super_secret_session_key_change_this',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: 'mongodb+srv://ahmedkadry4work_db_user:dFe4uLvXff4ZPRh@cluster0.ah8fhkr.mongodb.net' }),
        cookie: { maxAge: 1000 * 60 * 60 }
    })
);
*/
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        //  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
        store: MongoStore.create({ mongoUrl: 'mongodb+srv://ahmedkadry4work_db_user:BPsRC6Ytqgm0l7oA@cluster0.dsnnsao.mongodb.net' }),
        proxy: true, // Trust the Vercel proxy
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Vercel uses HTTPS
            sameSite: 'none', // Often required for cross-site cookies on Vercel[reference:5]
            maxAge: 1000 * 60 * 60 * 24 * 7, // e.g., 7 days
        },
    })
);



// Flash + user
app.use(attachUser);
app.use((req, res, next) => {
    res.locals.success = req.session.success;
    res.locals.error = req.session.error;
    delete req.session.success;
    delete req.session.error;
    res.locals.currentUser = req.user || null;
    next();
});

app.use('/', require('./routes/authRoutes'));
app.use('/user', require('./routes/userRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => res.render('home', { title: 'Home' }));

app.use((req, res) => res.status(404).render('404', { title: 'Not Found' }));


// Add this temporary route in server.js
app.get('/api/ping-atlas', async (req, res) => {
    const net = require('net');
    const { MongoClient } = require('mongodb');

    // We'll use the standard URI format to extract the host for a direct TCP check
    const uri = process.env.MONGO_URI;
    const host = uri.includes('mongodb+srv') ? 'cluster0.xxxxx.mongodb.net' : uri.split('//')[1].split('/')[0].split(',')[0].split(':')[0];
    const port = 27017;

    // 1. Test raw TCP connectivity
    const testConnection = () => new Promise((resolve) => {
        const client = net.createConnection({ host, port, timeout: 5000 }, () => {
            client.end();
            resolve({ tcp: '✅ TCP connection successful' });
        });
        client.on('timeout', () => { client.destroy(); resolve({ tcp: '❌ TCP connection timed out' }); });
        client.on('error', (err) => resolve({ tcp: `❌ TCP error: ${err.message}` }));
    });

    // 2. Test the full MongoDB driver connection
    const testMongoConnection = async () => {
        const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        try {
            await client.connect();
            await client.db().command({ ping: 1 });
            return { driver: '✅ Driver connection successful' };
        } catch (err) {
            return { driver: `❌ Driver error: ${err.message}` };
        } finally {
            await client.close();
        }
    };

    const tcpResult = await testConnection();
    const driverResult = await testMongoConnection();
    res.json({ ...tcpResult, ...driverResult, host, port });
});

const PORT = 3000;
app.listen(PORT, () =>
    //   console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log('AllahAkber database connected and wabsite started')
);