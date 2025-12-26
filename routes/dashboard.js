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
        (guild.permissions & 0x20) === 0x20 // MANAGE_GUILD yetkisi var mı
    );
    
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard - Ticket Bot</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', sans-serif;
                    background: #0d1117;
                    color: #c9d1d9;
                    min-height: 100vh;
                    padding: 20px;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .header {
                    background: #161b22;
                    padding: 20px;
                    border-radius: 10px;
                    border: 1px solid #30363d;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: 2px solid #5865f2;
                }
                .logout-btn {
                    background: #da3633;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .logout-btn:hover {
                    background: #c62828;
                }
                .guilds-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 20px;
                }
                .guild-card {
                    background: #161b22;
                    border: 1px solid #30363d;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    transition: all 0.3s;
                }
                .guild-card:hover {
                    transform: translateY(-5px);
                    border-color: #5865f2;
                    box-shadow: 0 8px 16px rgba(88, 101, 242, 0.3);
                }
                .guild-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    margin-bottom: 15px;
                    border: 2px solid #30363d;
                }
                .guild-name {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 10px;
                    color: #c9d1d9;
                }
                .manage-btn {
                    background: #5865f2;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    transition: all 0.2s;
                }
                .manage-btn:hover {
                    background: #4752c4;
                }
                h1 {
                    color: #58a6ff;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="user-info">
                        <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" class="avatar">
                        <div>
                            <h2 style="color: #c9d1d9;">${user.username}</h2>
                            <p style="color: #8b949e;">Hoş geldin!</p>
                        </div>
                    </div>
                    <a href="/auth/logout" class="logout-btn">Çıkış Yap</a>
                </div>
                
                <h1>🎫 Sunucularını Yönet</h1>
                
                <div class="guilds-grid">
                    ${guilds.map(guild => `
                        <div class="guild-card">
                            <img src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png" 
                                 class="guild-icon" 
                                 onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                            <div class="guild-name">${guild.name}</div>
                            <a href="/dashboard/${guild.id}" class="manage-btn">Yönet</a>
                        </div>
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
    
    // Kullanıcının bu sunucuda yetkisi var mı kontrol et
    const guild = user.guilds.find(g => g.id === guildId);
    if (!guild || (guild.permissions & 0x20) !== 0x20) {
        return res.status(403).send('Bu sunucuyu yönetme yetkiniz yok!');
    }
    
    // Database'den mevcut ayarları al
    const settings = await getGuildSettings(guildId);
    
    // Başarı mesajı kontrolü
    const success = req.query.success === 'true';
    
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>${guild.name} - Ayarlar</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', sans-serif;
                    background: #0d1117;
                    color: #c9d1d9;
                    min-height: 100vh;
                    padding: 20px;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: #161b22;
                    border: 1px solid #30363d;
                    padding: 30px;
                    border-radius: 10px;
                }
                h1 { 
                    margin-bottom: 20px; 
                    color: #58a6ff; 
                }
                .back-btn {
                    background: #30363d;
                    color: #c9d1d9;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 6px;
                    display: inline-block;
                    margin-bottom: 20px;
                    transition: all 0.2s;
                }
                .back-btn:hover {
                    background: #484f58;
                }
                .success-alert {
                    background: #238636;
                    color: white;
                    padding: 15px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    display: ${success ? 'block' : 'none'};
                }
                .section {
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #0d1117;
                    border: 1px solid #30363d;
                    border-radius: 8px;
                }
                .section h2 { 
                    margin-bottom: 15px; 
                    color: #5865f2; 
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 600;
                    color: #c9d1d9;
                }
                input, textarea {
                    width: 100%;
                    padding: 10px;
                    margin-bottom: 15px;
                    background: #0d1117;
                    border: 1px solid #30363d;
                    border-radius: 6px;
                    font-family: inherit;
                    color: #c9d1d9;
                }
                input:focus, textarea:focus {
                    outline: none;
                    border-color: #5865f2;
                }
                textarea { 
                    min-height: 100px; 
                    resize: vertical; 
                }
                .save-btn {
                    background: #238636;
                    color: white;
                    padding: 12px 30px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.2s;
                }
                .save-btn:hover { 
                    background: #2ea043; 
                }
                small {
                    color: #8b949e;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/dashboard" class="back-btn">← Geri Dön</a>
                <h1>🎫 ${guild.name} - Ticket Bot Ayarları</h1>
                
                <div class="success-alert">
                    ✅ Ayarlar başarıyla kaydedildi!
                </div>
                
                <form method="POST" action="/dashboard/${guildId}/save">
                    <div class="section">
                        <h2>📝 Ticket Açma Paneli</h2>
                        <label>Embed Başlığı:</label>
                        <input type="text" name="embed_title" value="${settings?.embed_title || '🎫 Destek Talebi Oluştur'}" required>
                        
                        <label>Embed Açıklaması:</label>
                        <textarea name="embed_description" required>${settings?.embed_description || 'Destek ekibimizle iletişime geçmek için aşağıdaki butona tıklayın.'}</textarea>
                        
                        <label>Embed Rengi (Hex):</label>
                        <input type="color" name="embed_color" value="${settings?.embed_color || '#0099ff'}">
                        
                        <label>Buton Yazısı:</label>
                        <input type="text" name="button_text" value="${settings?.button_text || '🎫 Ticket Aç'}" required>
                    </div>
                    
                    <div class="section">
                        <h2>👋 Karşılama Mesajı</h2>
                        <label>Ticket Açıldığında Gönderilecek Mesaj:</label>
                        <textarea name="welcome_message" required>${settings?.welcome_message || 'Merhaba {user}, destek ekibimiz en kısa sürede size yardımcı olacak!'}</textarea>
                        <small>{user} yerine kullanıcı mention'ı gelecek</small>
                    </div>
                    
                    <div class="section">
                        <h2>🔒 Kapanış Mesajı</h2>
                        <label>Ticket Kapatıldığında Gösterilecek Mesaj:</label>
                        <textarea name="close_message" required>${settings?.close_message || 'Ticket kapatılıyor... Desteğimiz için teşekkürler!'}</textarea>
                    </div>
                    
                    <button type="submit" class="save-btn">💾 Kaydet</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Ayarları kaydet
router.post('/:guildId/save', isAuthenticated, async (req, res) => {
    const guildId = req.params.guildId;
    const settings = req.body;
    
    console.log('🔵 Ayarlar kaydediliyor:', guildId, settings); // BU SATIRI EKLE
    
    try {
        // PostgreSQL'e kaydet
        await saveEmbedSettings(guildId, settings);
        console.log('✅ Ayarlar başarıyla kaydedildi!'); // BU SATIRI EKLE
    } catch (error) {
        console.error('❌ Ayarlar kaydedilemedi:', error); // BU SATIRI EKLE
    }
    
    res.redirect(`/dashboard/${guildId}?success=true`);
});

module.exports = router;