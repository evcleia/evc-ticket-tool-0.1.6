const express = require('express');
const router = express.Router();
const { getGuildSettings, saveEmbedSettings } = require('../database');

// Middleware: Kullanıcı giriş yapmış mı kontrol et
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/login');
}

// Dashboard ana sayfa
router.get('/', isAuthenticated, async (req, res) => {
    const user = req.user;
    
    // Kullanıcının sunucularını al
    const guilds = user.guilds.filter(guild => 
        (guild.permissions & 0x20) === 0x20
    );
    
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard - Ticket Bot</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }
                
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
                    color: #e4e4e7;
                    min-height: 100vh;
                    padding: 20px;
                }
                
                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                    animation: fadeIn 0.5s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .header {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    padding: 25px 30px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                
                .avatar {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    border: 3px solid #5865f2;
                    box-shadow: 0 0 20px rgba(88, 101, 242, 0.5);
                    transition: transform 0.3s ease;
                }
                
                .avatar:hover {
                    transform: scale(1.1) rotate(5deg);
                }
                
                .user-details h2 {
                    font-size: 24px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .user-details p {
                    color: #a1a1aa;
                    font-size: 14px;
                    margin-top: 5px;
                }
                
                .logout-btn {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    padding: 12px 28px;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
                }
                
                .logout-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(245, 87, 108, 0.6);
                }
                
                .page-title {
                    font-size: 48px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 30px;
                    text-align: center;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }
                
                .stat-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    padding: 25px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    text-align: center;
                }
                
                .stat-number {
                    font-size: 36px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .stat-label {
                    color: #a1a1aa;
                    font-size: 14px;
                    margin-top: 8px;
                    font-weight: 500;
                }
                
                .guilds-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 25px;
                }
                
                .guild-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 30px;
                    border-radius: 20px;
                    text-align: center;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    overflow: hidden;
                }
                
                .guild-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    transform: scaleX(0);
                    transition: transform 0.3s ease;
                }
                
                .guild-card:hover::before {
                    transform: scaleX(1);
                }
                
                .guild-card:hover {
                    transform: translateY(-10px);
                    border-color: rgba(102, 126, 234, 0.5);
                    box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
                }
                
                .guild-icon {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    margin-bottom: 20px;
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.3s ease;
                }
                
                .guild-card:hover .guild-icon {
                    transform: scale(1.1);
                    border-color: #5865f2;
                    box-shadow: 0 0 30px rgba(88, 101, 242, 0.6);
                }
                
                .guild-name {
                    font-size: 20px;
                    font-weight: 700;
                    margin-bottom: 15px;
                    color: #e4e4e7;
                }
                
                .manage-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 30px;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }
                
                .manage-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
                }
                
                @media (max-width: 768px) {
                    .page-title { font-size: 32px; }
                    .guilds-grid { grid-template-columns: 1fr; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="user-info">
                        <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" class="avatar">
                        <div class="user-details">
                            <h2>${user.username}</h2>
                            <p>👋 Hoş geldin!</p>
                        </div>
                    </div>
                    <a href="/auth/logout" class="logout-btn">Çıkış Yap</a>
                </div>
                
                <h1 class="page-title">🎫 Sunucu Yönetimi</h1>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${guilds.length}</div>
                        <div class="stat-label">Toplam Sunucu</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">∞</div>
                        <div class="stat-label">Açık Ticket</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">🚀</div>
                        <div class="stat-label">Aktif Bot</div>
                    </div>
                </div>
                
                <div class="guilds-grid">
                    ${guilds.map(guild => `
                        <div class="guild-card">
                            <img src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png" 
                                 class="guild-icon" 
                                 onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                            <div class="guild-name">${guild.name}</div>
                            <a href="/dashboard/${guild.id}" class="manage-btn">⚙️ Yönet</a>
                        </div>
                    `).join('')}
                </div>
            </div>
        </body>
        </html>
    `);
});

// Sunucu ayarları sayfası (önceki halini koruyorum, ister onu da enhance edelim?)

module.exports = router;