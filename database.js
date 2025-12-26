const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Database tablosunu oluştur
async function initDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS guilds (
                guild_id VARCHAR(20) PRIMARY KEY,
                ticket_count INTEGER DEFAULT 0,
                log_channel_id VARCHAR(20),
                category_id VARCHAR(20),
                embed_title TEXT DEFAULT '🎫 Destek Talebi Oluştur',
                embed_description TEXT DEFAULT 'Destek ekibimizle iletişime geçmek için aşağıdaki butona tıklayın.',
                embed_color TEXT DEFAULT '#0099ff',
                embed_image_url TEXT,
                button_text TEXT DEFAULT '🎫 Ticket Aç',
                button_color TEXT DEFAULT 'Primary',
                button_emoji TEXT DEFAULT '🎫',
                welcome_message TEXT DEFAULT 'Merhaba {user}, destek ekibimiz en kısa sürede size yardımcı olacak!',
                close_message TEXT DEFAULT 'Ticket kapatılıyor... Desteğimiz için teşekkürler!',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Eski tablolara yeni sütunları ekle
        await client.query(`
            ALTER TABLE guilds 
            ADD COLUMN IF NOT EXISTS embed_image_url TEXT,
            ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT 'Primary',
            ADD COLUMN IF NOT EXISTS button_emoji TEXT DEFAULT '🎫'
        `);
        
        console.log('✅ Database tablosu hazır!');
    } catch (error) {
        console.error('❌ Database hatası:', error);
    } finally {
        client.release();
    }
}

// Ticket sayısını artır
async function incrementTicketCount(guildId) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `INSERT INTO guilds (guild_id, ticket_count) 
             VALUES ($1, 1) 
             ON CONFLICT (guild_id) 
             DO UPDATE SET ticket_count = guilds.ticket_count + 1 
             RETURNING ticket_count`,
            [guildId]
        );
        return result.rows[0].ticket_count;
    } finally {
        client.release();
    }
}

// Sunucu ayarlarını kaydet
async function saveGuildSettings(guildId, logChannelId, categoryId) {
    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO guilds (guild_id, log_channel_id, category_id) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (guild_id) 
             DO UPDATE SET log_channel_id = $2, category_id = $3`,
            [guildId, logChannelId, categoryId]
        );
    } finally {
        client.release();
    }
}

// Sunucu ayarlarını getir
async function getGuildSettings(guildId) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT * FROM guilds WHERE guild_id = $1',
            [guildId]
        );
        return result.rows[0] || null;
    } finally {
        client.release();
    }
}

// Sunucu embed ayarlarını kaydet
async function saveEmbedSettings(guildId, settings) {
    const client = await pool.connect();
    try {
        await client.query(`
            UPDATE guilds 
            SET embed_title = $1,
                embed_description = $2,
                embed_color = $3,
                embed_image_url = $4,
                button_text = $5,
                button_color = $6,
                button_emoji = $7,
                welcome_message = $8,
                close_message = $9
            WHERE guild_id = $10
        `, [
            settings.embed_title,
            settings.embed_description,
            settings.embed_color,
            settings.embed_image_url,
            settings.button_text,
            settings.button_color,
            settings.button_emoji,
            settings.welcome_message,
            settings.close_message,
            guildId
        ]);
    } finally {
        client.release();
    }
}

module.exports = {
    initDatabase,
    incrementTicketCount,
    saveGuildSettings,
    getGuildSettings,
    saveEmbedSettings
};