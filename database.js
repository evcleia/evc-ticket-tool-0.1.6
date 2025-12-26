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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
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

module.exports = {
    initDatabase,
    incrementTicketCount,
    saveGuildSettings,
    getGuildSettings
};