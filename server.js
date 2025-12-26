require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session ayarları
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 gün
    }
}));

// Passport başlat
app.use(passport.initialize());
app.use(passport.session());

// Discord OAuth2 Strategy
passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    // Kullanıcı bilgilerini session'a kaydet
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Transcripts klasörünü oluştur
const transcriptsDir = path.join(__dirname, 'transcripts');
if (!fs.existsSync(transcriptsDir)) {
    fs.mkdirSync(transcriptsDir);
}

// Static dosyaları servis et
app.use('/transcripts', express.static(transcriptsDir));

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

// Ana sayfa
app.get('/', (req, res) => {
    const isLoggedIn = req.isAuthenticated();
    const user = req.user;
    
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ticket Bot Dashboard</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #101733ff 0%, #615626ff 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                }
                .container {
                    text-align: center;
                    background: rgba(255,255,255,0.1);
                    padding: 60px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                }
                h1 {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                p {
                    font-size: 20px;
                    margin-bottom: 40px;
                    opacity: 0.9;
                }
                .btn {
                    background: #0d113bff;
                    color: white;
                    padding: 15px 40px;
                    text-decoration: none;
                    border-radius: 10px;
                    font-size: 18px;
                    display: inline-block;
                    transition: all 0.3s;
                }
                .btn:hover {
                    background: #171b46ff;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                }
                .user-info {
                    margin-top: 30px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    justify-content: center;
                }
                .avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: 3px solid white;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>evc Dashboard Girişi</h1>
                <p>Roleplay içeriği ve community yönetim paneli</p>
                
                ${isLoggedIn ? `
                    <div class="user-info">
                        <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" class="avatar">
                        <span>Hoş geldin, ${user.username}!</span>
                    </div>
                    <br>
                    <a href="/dashboard" class="btn">Dashboard'a Git</a>
                    <br><br>
                    <a href="/auth/logout" class="btn" style="background: #f44336;">Çıkış Yap</a>
                ` : `
                    <a href="/auth/login" class="btn">Discord ile Giriş Yap</a>
                `}
            </div>
        </body>
        </html>
    `);
});

// Transcript listesi
app.get('/list', (req, res) => {
    const files = fs.readdirSync(transcriptsDir);
    const links = files.map(file => `<a href="/transcripts/${file}">${file}</a>`).join('<br>');
    res.send(`
        <h1>📄 Transcript Listesi</h1>
        <style>body{font-family:sans-serif;padding:20px;}</style>
        ${links || 'Henüz transcript yok.'}
    `);
});

app.listen(PORT, () => {
    console.log(`🌐 Web sunucu çalışıyor: http://localhost:${PORT}`);
});