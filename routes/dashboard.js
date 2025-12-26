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
            <title>Dashboard - evc Bot</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0d1117 100%);
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
                    background: rgba(10, 14, 39, 0.7);
                    backdrop-filter: blur(20px);
                    padding: 25px 30px;
                    border-radius: 20px;
                    border: 1px solid rgba(212, 175, 55, 0.2);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
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
                    border: 3px solid #d4af37;
                    box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
                    transition: transform 0.3s ease;
                }
                .header-actions {
    display: flex;
    gap: 15px;
}

.tos-btn {
    background: rgba(10, 14, 39, 0.6);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #d4af37;
    padding: 12px 28px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    display: inline-block;
}

.tos-btn:hover {
    background: rgba(10, 14, 39, 0.8);
    transform: translateY(-2px);
}
    ////BURASI ^^^^
                .avatar:hover {
                    transform: scale(1.1) rotate(5deg);
                }
                
                .user-details h2 {
                    font-size: 24px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #d4af37 0%, #f4e5a1 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .user-details p {
                    color: #a1a1aa;
                    font-size: 14px;
                    margin-top: 5px;
                }
                
                .logout-btn {
                    background: linear-gradient(135deg, #8b0000 0%, #dc143c 100%);
                    color: white;
                    padding: 12px 28px;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(139, 0, 0, 0.4);
                }
                
                .logout-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(139, 0, 0, 0.6);
                }
                
                .page-title {
                    font-size: 48px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #1e3a8a 0%, #d4af37 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }
                
                .stat-card {
                    background: rgba(10, 14, 39, 0.6);
                    backdrop-filter: blur(10px);
                    padding: 25px;
                    border-radius: 16px;
                    border: 1px solid rgba(212, 175, 55, 0.2);
                    text-align: center;
                    transition: all 0.3s ease;
                }
                
                .stat-card:hover {
                    transform: translateY(-5px);
                    border-color: rgba(212, 175, 55, 0.5);
                }
                
                .stat-number {
                    font-size: 36px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #d4af37 0%, #f4e5a1 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
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
                    background: rgba(10, 14, 39, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(212, 175, 55, 0.15);
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
                    background: linear-gradient(90deg, #1e3a8a 0%, #d4af37 100%);
                    transform: scaleX(0);
                    transition: transform 0.3s ease;
                }
                
                .guild-card:hover::before {
                    transform: scaleX(1);
                }
                
                .guild-card:hover {
                    transform: translateY(-10px);
                    border-color: rgba(212, 175, 55, 0.5);
                    box-shadow: 0 20px 40px rgba(30, 58, 138, 0.4);
                }
                
                .guild-icon {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    margin-bottom: 20px;
                    border: 3px solid rgba(212, 175, 55, 0.3);
                    transition: all 0.3s ease;
                }
                
                .guild-card:hover .guild-icon {
                    transform: scale(1.1);
                    border-color: #d4af37;
                    box-shadow: 0 0 30px rgba(212, 175, 55, 0.6);
                }
                
                .guild-name {
                    font-size: 20px;
                    font-weight: 700;
                    margin-bottom: 15px;
                    color: #e4e4e7;
                }
                
                .manage-btn {
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                    color: white;
                    padding: 12px 30px;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(30, 58, 138, 0.4);
                    border: 1px solid rgba(212, 175, 55, 0.2);
                }
                
                .manage-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
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
                    <div class="header-actions">
                      <a href="/auth/logout" class="logout-btn">Çıkış Yap</a>
                    </div>                </div>
                
                <h1 class="page-title">🎫 Sunucu Yönetimi</h1>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${guilds.length}</div>
                        <div class="stat-label">Toplam Sunucu</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">∞</div>
                        <div class="stat-label">Aktif Ticket</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">🚀</div>
                        <div class="stat-label">Bot Durumu</div>
                    </div>
                </div>
                
                <div class="guilds-grid">
                    ${guilds.map(guild => `
                        <div class="guild-card">
                            <img src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png" 
                                 class="guild-icon" 
                                 onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                            <div class="guild-name">${guild.name}</div>
<div style="display: flex; flex-direction: column; gap: 10px;">
    <a href="/dashboard/${guild.id}" class="manage-btn">⚙️ Ayarlar</a>
<a href="/dashboard/1361806782120333514/transcripts" class="manage-btn" style="background: linear-gradient(135deg, #6b5200 0%, #d7b300 100%);">📄 Transcript Arşivi</a></div>                        </div>
                    `).join('')}
                </div>
            </div>
        </body>
        </html>
    `);
});

// Sunucu ayarları sayfası
router.get('/:guildId', isAuthenticated, async (req, res) => {
    const guildId = req.params.guildId;
    const user = req.user;
    
    const guild = user.guilds.find(g => g.id === guildId);
    if (!guild || (guild.permissions & 0x20) !== 0x20) {
        return res.status(403).send('Bu sunucuyu yönetme yetkiniz yok!');
    }
    
    const settings = await getGuildSettings(guildId);
    const success = req.query.success === 'true';
    
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>${guild.name} - Ayarlar</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0d1117 100%);
                    color: #e4e4e7;
                    min-height: 100vh;
                    padding: 20px;
                }
                
                .container {
                    max-width: 900px;
                    margin: 0 auto;
                    animation: fadeIn 0.5s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .back-btn {
                    background: rgba(10, 14, 39, 0.6);
                    color: #d4af37;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 12px;
                    display: inline-block;
                    margin-bottom: 30px;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(212, 175, 55, 0.3);
                }
                
                .back-btn:hover {
                    background: rgba(10, 14, 39, 0.8);
                    transform: translateX(-5px);
                }
                
                h1 {
                    font-size: 36px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #1e3a8a 0%, #d4af37 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 30px;
                }
                
                .success-alert {
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                    color: white;
                    padding: 18px 24px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                    display: ${success ? 'flex' : 'none'};
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    box-shadow: 0 4px 15px rgba(30, 58, 138, 0.4);
                    animation: slideIn 0.3s ease;
                    border: 1px solid rgba(212, 175, 55, 0.3);
                }
                
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .section {
                    background: rgba(10, 14, 39, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(212, 175, 55, 0.2);
                    padding: 30px;
                    border-radius: 20px;
                    margin-bottom: 25px;
                    transition: all 0.3s ease;
                }
                
                .section:hover {
                    border-color: rgba(212, 175, 55, 0.4);
                    box-shadow: 0 8px 25px rgba(30, 58, 138, 0.3);
                }
                
                .section h2 {
                    font-size: 22px;
                    font-weight: 700;
                    color: #d4af37;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #e4e4e7;
                    font-size: 14px;
                }
                
                input, textarea {
                    width: 100%;
                    padding: 14px;
                    margin-bottom: 18px;
                    background: rgba(10, 14, 39, 0.8);
                    border: 1px solid rgba(212, 175, 55, 0.2);
                    border-radius: 10px;
                    font-family: inherit;
                    color: #e4e4e7;
                    font-size: 15px;
                    transition: all 0.3s ease;
                }
                
                input:focus, textarea:focus {
                    outline: none;
                    border-color: #d4af37;
                    background: rgba(10, 14, 39, 0.9);
                    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
                }
                
                textarea {
                    min-height: 120px;
                    resize: vertical;
                }
                
                input[type="color"] {
                    height: 50px;
                    cursor: pointer;
                }
                
                .save-btn {
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                    color: white;
                    padding: 16px 40px;
                    border: 1px solid rgba(212, 175, 55, 0.3);
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 700;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(30, 58, 138, 0.4);
                    width: 100%;
                }
                
                .save-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
                }
                
                small {
                    color: #a1a1aa;
                    font-size: 13px;
                    display: block;
                    margin-top: -10px;
                    margin-bottom: 15px;
                }
                
                .preview-box {
                    background: rgba(10, 14, 39, 0.5);
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(212, 175, 55, 0.2);
                    margin-top: 15px;
                }
                
                .preview-label {
                    color: #a1a1aa;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 10px;
                }
                
                @media (max-width: 768px) {
                    h1 { font-size: 28px; }
                    .section { padding: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/dashboard" class="back-btn">← Geri Dön</a>
                <h1>🎫 ${guild.name}</h1>
                
                <div class="success-alert">
                    <span style="font-size: 24px;">✅</span>
                    Ayarlar başarıyla kaydedildi!
                </div>
                
                <form method="POST" action="/dashboard/${guildId}/save">
                    <div class="section">
                        <h2>📝 Ticket Açma Paneli</h2>
                        
                        <label>Embed Başlığı:</label>
                        <input type="text" name="embed_title" value="${settings?.embed_title || '🎫 Destek Talebi Oluştur'}" required>
                        
                        <label>Embed Açıklaması:</label>
                        <textarea name="embed_description" required>${settings?.embed_description || 'Destek ekibimizle iletişime geçmek için aşağıdaki butona tıklayın.'}</textarea>
                        
                        <label>Embed Rengi:</label>
                        <input type="color" name="embed_color" value="${settings?.embed_color || '#0099ff'}">
                        
                        <label>Embed Görseli (URL - Opsiyonel):</label>
                        <input type="url" name="embed_image_url" value="${settings?.embed_image_url || ''}" placeholder="https://example.com/image.png">
                        <small>💡 Embed içinde görünecek resim linki</small>
                        
                        <label>Buton Emoji:</label>
                        <input type="text" name="button_emoji" value="${settings?.button_emoji || '🎫'}" maxlength="2" placeholder="🎫">
                        <small>💡 Butonun başında görünecek emoji</small>
                        
                        <label>Buton Yazısı:</label>
                        <input type="text" name="button_text" value="${settings?.button_text || 'Ticket Aç'}" required>
                        
                        <label>Buton Rengi:</label>
                        <select name="button_color" style="
                            width: 100%;
                            padding: 14px;
                            margin-bottom: 18px;
                            background: rgba(10, 14, 39, 0.8);
                            border: 1px solid rgba(212, 175, 55, 0.2);
                            border-radius: 10px;
                            font-family: inherit;
                            color: #e4e4e7;
                            font-size: 15px;
                            cursor: pointer;
                        ">
                            <option value="Primary" ${(settings?.button_color || 'Primary') === 'Primary' ? 'selected' : ''}>🔵 Mavi (Primary)</option>
                            <option value="Success" ${settings?.button_color === 'Success' ? 'selected' : ''}>🟢 Yeşil (Success)</option>
                            <option value="Danger" ${settings?.button_color === 'Danger' ? 'selected' : ''}>🔴 Kırmızı (Danger)</option>
                            <option value="Secondary" ${settings?.button_color === 'Secondary' ? 'selected' : ''}>⚫ Gri (Secondary)</option>
                        </select>
                    </div>
                    
                    <div class="section">
                        <h2>👋 Karşılama Mesajı</h2>
                        <label>Ticket Açıldığında Gönderilecek Mesaj:</label>
                        <textarea name="welcome_message" required>${settings?.welcome_message || 'Merhaba {user}, destek ekibimiz en kısa sürede size yardımcı olacak!'}</textarea>
                        <small>💡 {user} yerine kullanıcı mention'ı gelecek</small>
                    </div>
                    
                    <div class="section">
                        <h2>🔒 Kapanış Mesajı</h2>
                        <label>Ticket Kapatıldığında Gösterilecek Mesaj:</label>
                        <textarea name="close_message" required>${settings?.close_message || 'Ticket kapatılıyor... Desteğimiz için teşekkürler!'}</textarea>
                    </div>
                    
                    <button type="submit" class="save-btn">💾 Değişiklikleri Kaydet</button>
                </form>
                
                <div style="margin-top: 30px; text-align: center;">
                    <a href="/dashboard/${guildId}/transcripts" style="
                        background: rgba(10, 14, 39, 0.6);
                        color: #d4af37;
                        padding: 14px 30px;
                        text-decoration: none;
                        border-radius: 12px;
                        display: inline-block;
                        border: 1px solid rgba(212, 175, 55, 0.3);
                        font-weight: 600;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(10, 14, 39, 0.8)'" onmouseout="this.style.background='rgba(10, 14, 39, 0.6)'">
                        📄 Transcript Arşivi
                    </a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Transcript arşivi sayfası
router.get('/:guildId/transcripts', isAuthenticated, async (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const guildId = req.params.guildId;
    const user = req.user;
    
    const guild = user.guilds.find(g => g.id === guildId);
    if (!guild || (guild.permissions & 0x20) !== 0x20) {
        return res.status(403).send('Bu sunucuyu yönetme yetkiniz yok!');
    }
    
    // Transcripts klasörünü oku
    const transcriptsDir = path.join(__dirname, '..', 'transcripts');
    let transcripts = [];
    
    if (fs.existsSync(transcriptsDir)) {
        const files = fs.readdirSync(transcriptsDir);
        transcripts = files
            .filter(file => file.endsWith('.html'))
            .map(file => {
                const stats = fs.statSync(path.join(transcriptsDir, file));
                return {
                    name: file,
                    date: stats.mtime,
                    size: (stats.size / 1024).toFixed(2) + ' KB'
                };
            })
            .sort((a, b) => b.date - a.date);
    }
    
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>${guild.name} - Transcript Arşivi</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0d1117 100%);
                    color: #e4e4e7;
                    min-height: 100vh;
                    padding: 20px;
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    animation: fadeIn 0.5s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .back-btn {
                    background: rgba(10, 14, 39, 0.6);
                    color: #d4af37;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 12px;
                    display: inline-block;
                    margin-bottom: 30px;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(212, 175, 55, 0.3);
                }
                
                .back-btn:hover {
                    background: rgba(10, 14, 39, 0.8);
                    transform: translateX(-5px);
                }
                
                h1 {
                    font-size: 36px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #1e3a8a 0%, #d4af37 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 10px;
                }
                
                .subtitle {
                    color: #a1a1aa;
                    margin-bottom: 30px;
                }
                
                .stats {
                    background: rgba(10, 14, 39, 0.6);
                    backdrop-filter: blur(10px);
                    padding: 20px;
                    border-radius: 16px;
                    border: 1px solid rgba(212, 175, 55, 0.2);
                    margin-bottom: 30px;
                    display: flex;
                    gap: 40px;
                    flex-wrap: wrap;
                }
                
                .stat-item {
                    text-align: center;
                }
                
                .stat-number {
                    font-size: 32px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #d4af37 0%, #f4e5a1 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .stat-label {
                    color: #a1a1aa;
                    font-size: 14px;
                    margin-top: 5px;
                }
                
                .transcript-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 20px;
                }
                
                .transcript-card {
                    background: rgba(10, 14, 39, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(212, 175, 55, 0.15);
                    padding: 25px;
                    border-radius: 16px;
                    transition: all 0.3s ease;
                }
                
                .transcript-card:hover {
                    transform: translateY(-5px);
                    border-color: rgba(212, 175, 55, 0.4);
                    box-shadow: 0 8px 25px rgba(30, 58, 138, 0.3);
                }
                
                .transcript-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }
                
                .transcript-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: #e4e4e7;
                    margin-bottom: 10px;
                    word-break: break-word;
                }
                
                .transcript-meta {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 15px;
                    font-size: 13px;
                    color: #a1a1aa;
                }
                
                .download-btn {
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                    color: white;
                    padding: 10px 20px;
                    border: 1px solid rgba(212, 175, 55, 0.2);
                    border-radius: 8px;
                    text-decoration: none;
                    display: inline-block;
                    font-weight: 600;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }
                
                .download-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #a1a1aa;
                }
                
                .empty-state-icon {
                    font-size: 72px;
                    margin-bottom: 20px;
                    opacity: 0.5;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/dashboard/" class="back-btn">← Dashboard</a>
                
                <h1>📄 Transcript Arşivi</h1>
                <p class="subtitle">${guild.name}</p>
                
                <div class="stats">
                    <div class="stat-item">
                        <div class="stat-number">${transcripts.length}</div>
                        <div class="stat-label">Toplam Transcript</div>
                    </div>
                </div>
                
                ${transcripts.length > 0 ? `
                    <div class="transcript-grid">
                        ${transcripts.map(t => `
                            <div class="transcript-card">
                                <div class="transcript-icon">📋</div>
                                <div class="transcript-name">${t.name}</div>
                                <div class="transcript-meta">
                                    <span>📅 ${t.date.toLocaleDateString('tr-TR')}</span>
                                    <span>💾 ${t.size}</span>
                                </div>
                                <a href="/transcripts/${t.name}" target="_blank" class="download-btn">
                                    🔍 Görüntüle
                                </a>
                                <a href="/transcripts/${t.name}" download class="download-btn" style="margin-left: 10px;">
                                    ⬇️ İndir
                                </a>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <h2>Henüz transcript yok</h2>
                        <p>Ticket'lar kapandığında burada görünecek</p>
                    </div>
                `}
            </div>
        </body>
        </html>
    `);
});

// Ayarları kaydet
router.post('/:guildId/save', isAuthenticated, async (req, res) => {
    const guildId = req.params.guildId;
    const settings = req.body;
    
    console.log('🔵 Ayarlar kaydediliyor:', guildId, settings);
    
    try {
        await saveEmbedSettings(guildId, settings);
        console.log('✅ Ayarlar başarıyla kaydedildi!');
    } catch (error) {
        console.error('❌ Ayarlar kaydedilemedi:', error);
    }
    
    res.redirect(`/dashboard/${guildId}?success=true`);
});


module.exports = router;