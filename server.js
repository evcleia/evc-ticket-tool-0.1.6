const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Transcripts klasörünü oluştur
const transcriptsDir = path.join(__dirname, 'transcripts');
if (!fs.existsSync(transcriptsDir)) {
    fs.mkdirSync(transcriptsDir);
}

// Static dosyaları servis et
app.use('/transcripts', express.static(transcriptsDir));

// Ana sayfa
app.get('/', (req, res) => {
    res.send(`
        <h1>🎫 Ticket Bot Transcript Server</h1>
        <p>Bot çalışıyor ve transcript'ler hazır!</p>
    `);
});

// Transcript listesi
app.get('/list', (req, res) => {
    const files = fs.readdirSync(transcriptsDir);
    const links = files.map(file => `<a href="/transcripts/${file}">${file}</a>`).join('<br>');
    res.send(`<h1>📄 Transcript Listesi</h1>${links || 'Henüz transcript yok.'}`);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web sunucu PORT ${PORT} üzerinde çalışıyor`);
});