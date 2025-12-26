const express = require('express');
const router = express.Router();

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
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 20px;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .header {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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
                }
                .logout-btn {
                    background: #f44336;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    text-decoration: none;
                }
                .guilds-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 20px;
                }
                .guild-card {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    text-align: center;
                    transition: transform 0.2s;
                }
                .guild-card:hover {
                    transform: translateY(-5px);
                }
                .guild-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    margin-bottom: 15px;
                }
                .guild-name {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                .manage-btn {
                    background: #5865f2;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="user-info">
                        <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" class="avatar">
                        <div>
                            <h2>${user.username}</h2>
                            <p style="color: #666;">Hoş geldin!</p>
                        </div>
                    </div>
                    <a href="/auth/logout" class="logout-btn">Çıkış Yap</a>
                </div>
                
                <h1 style="color: white; margin-bottom: 20px;">🎫 Sunucularını Yönet</h1>
                
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
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 20px;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                h1 { margin-bottom: 20px; color: #333; }
                .back-btn {
                    background: #666;
                    color: white;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 5px;
                    display: inline-block;
                    margin-bottom: 20px;
                }
                .section {
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #f5f5f5;
                    border-radius: 8px;
                }
                .section h2 { margin-bottom: 15px; color: #5865f2; }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 600;
                }
                input, textarea {
                    width: 100%;
                    padding: 10px;
                    margin-bottom: 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-family: inherit;
                }
                textarea { min-height: 100px; resize: vertical; }
                .save-btn {
                    background: #43a047;
                    color: white;
                    padding: 12px 30px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                }
                .save-btn:hover { background: #388e3c; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/dashboard" class="back-btn">← Geri Dön</a>
                <h1>🎫 ${guild.name} - Ticket Bot Ayarları</h1>
                
                <form method="POST" action="/dashboard/${guildId}/save">
                    <div class="section">
                        <h2>📝 Ticket Açma Paneli</h2>
                        <label>Embed Başlığı:</label>
                        <input type="text" name="embed_title" value="🎫 Destek Talebi Oluştur" required>
                        
                        <label>Embed Açıklaması:</label>
                        <textarea name="embed_description" required>Destek ekibimizle iletişime geçmek için aşağıdaki butona tıklayın.</textarea>
                        
                        <label>Embed Rengi (Hex):</label>
                        <input type="color" name="embed_color" value="#0099ff">
                        
                        <label>Buton Yazısı:</label>
                        <input type="text" name="button_text" value="🎫 Ticket Aç" required>
                    </div>
                    
                    <div class="section">
                        <h2>👋 Karşılama Mesajı</h2>
                        <label>Ticket Açıldığında Gönderilecek Mesaj:</label>
                        <textarea name="welcome_message" required>Merhaba {user}, destek ekibimiz en kısa sürede size yardımcı olacak!</textarea>
                        <small style="color: #666;">{user} yerine kullanıcı mention'ı gelecek</small>
                    </div>
                    
                    <div class="section">
                        <h2>🔒 Kapanış Mesajı</h2>
                        <label>Ticket Kapatıldığında Gösterilecek Mesaj:</label>
                        <textarea name="close_message" required>Ticket kapatılıyor... Desteğimiz için teşekkürler!</textarea>
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
    
    // TODO: PostgreSQL'e kaydet
    console.log('Ayarlar kaydediliyor:', guildId, settings);
    
    res.redirect(`/dashboard/${guildId}?success=true`);
});

module.exports = router;