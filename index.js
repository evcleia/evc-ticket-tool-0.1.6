// require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { initDatabase, incrementTicketCount, getGuildSettings, saveGuildSettings } = require('./database');
const ticketDataPath = path.join(__dirname, 'ticketData.json');
let ticketData = JSON.parse(fs.readFileSync(ticketDataPath, 'utf8'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// Komutları yükle
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
    console.log(`✅ Bot hazır! ${client.user.tag} olarak giriş yapıldı`);
    
    // Database'i başlat
    await initDatabase();
    
    // Komutları HER SUNUCUYA kaydet (anında çalışır!)
    const commands = client.commands.map(cmd => cmd.data.toJSON());
    
    for (const guild of client.guilds.cache.values()) {
        await guild.commands.set(commands);
        console.log(`✅ Komutlar ${guild.name} sunucusuna kaydedildi!`);
    }
    
    // Web sunucuyu başlat
    require('./server.js');
});

// Slash komutlarını dinle
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Komut çalıştırılırken hata oluştu!', ephemeral: true });
        }
    }
    
    // Buton tıklamalarını dinle
    if (interaction.isButton()) {
        if (interaction.customId === 'create_ticket') {
            await createTicket(interaction);
        } else if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Ticket kapatılıyor...', ephemeral: true });
            await closeTicket(interaction.channel, interaction.user);
        } else if (interaction.customId === 'add_user') {
            await addUser(interaction);
        } else if (interaction.customId === 'remove_user') {
            await removeUser(interaction);
        }
    }
});

// Ticket oluşturma fonksiyonu
async function createTicket(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;
    
// Sunucu ayarlarını al
const settings = await getGuildSettings(guild.id);

if (!settings || !settings.category_id) {
    return interaction.reply({
        content: '❌ Ticket sistemi kurulmamış! Yöneticiden `/setup` komutunu çalıştırmasını isteyin.',
        ephemeral: true
    });
}

let category = guild.channels.cache.get(settings.category_id);

if (!category) {
    return interaction.reply({
        content: '❌ Kategori bulunamadı! Yönetici `/setup` komutunu tekrar çalıştırmalı.',
        ephemeral: true
    });
}    
    if (!category) {
        category = await guild.channels.create({
            name: '🎫 Tickets',
            type: ChannelType.GuildCategory
        });
        console.log(`✅ Ticket kategorisi oluşturuldu: ${category.id}`);
        console.log(`⚠️ Bu ID'yi .env dosyasına ekle: TICKET_CATEGORY_ID=${category.id}`);
    }
    
    // Ticket kanalı oluştur
// Database'den ticket sayısını al ve artır
const ticketCount = await incrementTicketCount(guild.id);
const ticketNumber = String(ticketCount).padStart(4, '0');

    const ticketChannel = await guild.channels.create({
        name: `ticket-${ticketNumber}`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: member.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            }
        ]
    });
    
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎫 Ticket Oluşturuldu')
        .setDescription(`Merhaba ${member}, destek ekibimiz en kısa sürede size yardımcı olacak!`)
        .setTimestamp();
    
    const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('🔒 Ticket\'ı Kapat')
        .setStyle(ButtonStyle.Danger);

    const addUserButton = new ButtonBuilder()
        .setCustomId('add_user')
        .setLabel('➕ Kullanıcı Ekle')
        .setStyle(ButtonStyle.Success);

    const removeUserButton = new ButtonBuilder()
        .setCustomId('remove_user')
        .setLabel('➖ Kullanıcı Çıkar')
        .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder().addComponents(closeButton, addUserButton, removeUserButton);
    
    await ticketChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `Ticket'ınız oluşturuldu: ${ticketChannel}`, ephemeral: true });
}

// Ticket kapatma fonksiyonu
async function closeTicket(channel, closedBy) {
    console.log('🔴 closeTicket çağrıldı!', channel.name, closedBy.tag);
    
    if (!channel.name.startsWith('ticket-')) {
        console.error('❌ Bu bir ticket kanalı değil!');
        return;
    }
    
    console.log('✅ Ticket kontrolü geçti, transcript oluşturuluyor...');
    
    // Transcript oluştur
    await createTranscript(channel, closedBy);
    
    console.log('✅ Transcript oluşturuldu, kanal siliniyor...');

    setTimeout(async () => {
        await channel.delete();
        console.log('✅ Kanal silindi!');
    }, 3000);
}

// Transcript oluşturma fonksiyonu
async function createTranscript(channel, closedBy) {
    const transcriptsDir = path.join(__dirname, 'transcripts');
    if (!fs.existsSync(transcriptsDir)) {
        fs.mkdirSync(transcriptsDir, { recursive: true });
    }
    
    try {
        // Tüm mesajları çek
        const messages = await channel.messages.fetch({ limit: 100 });
        const sortedMessages = Array.from(messages.values()).reverse();
        
        // HTML oluştur
        let html = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Transcript - ${channel.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #36393f;
            color: #dcddde;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #2f3136;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .header {
            border-bottom: 2px solid #202225;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #fff;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header p {
            color: #b9bbbe;
            font-size: 14px;
        }
        .message {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #202225;
        }
        .message:hover {
            background: #32353b;
        }
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 15px;
            flex-shrink: 0;
        }
        .message-content {
            flex: 1;
        }
        .message-header {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }
        .username {
            color: #fff;
            font-weight: 600;
            margin-right: 10px;
        }
        .timestamp {
            color: #72767d;
            font-size: 12px;
        }
        .message-text {
            color: #dcddde;
            line-height: 1.5;
            word-wrap: break-word;
        }
        .embed {
            background: #2f3136;
            border-left: 4px solid #5865f2;
            padding: 15px;
            margin-top: 10px;
            border-radius: 4px;
        }
        .embed-title {
            color: #fff;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .embed-description {
            color: #dcddde;
            font-size: 14px;
        }
        .attachment {
            margin-top: 10px;
            color: #00b0f4;
            text-decoration: none;
        }
        .attachment:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 ${channel.name}</h1>
            <p>Ticket ID: ${channel.id}</p>
            <p>Oluşturulma: ${channel.createdAt.toLocaleString('tr-TR')}</p>
            <p>Kapatılma: ${new Date().toLocaleString('tr-TR')}</p>
            <p>Toplam Mesaj: ${sortedMessages.length}</p>
        </div>
        <div class="messages">
`;

        // Mesajları ekle
        for (const msg of sortedMessages) {
            const avatarURL = msg.author.displayAvatarURL({ format: 'png', size: 128 });
            const timestamp = msg.createdAt.toLocaleString('tr-TR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            html += `
            <div class="message">
                <img src="${avatarURL}" alt="${msg.author.username}" class="avatar">
                <div class="message-content">
                    <div class="message-header">
                        <span class="username">${msg.author.username}</span>
                        <span class="timestamp">${timestamp}</span>
                    </div>
                    <div class="message-text">${msg.content || '<i>İçerik yok</i>'}</div>
`;
            
            // Embed'leri ekle
            if (msg.embeds.length > 0) {
                for (const embed of msg.embeds) {
                    html += `
                    <div class="embed">
                        ${embed.title ? `<div class="embed-title">${embed.title}</div>` : ''}
                        ${embed.description ? `<div class="embed-description">${embed.description}</div>` : ''}
                    </div>
`;
                }
            }
            
            // Ekleri ekle
            if (msg.attachments.size > 0) {
                for (const attachment of msg.attachments.values()) {
                    html += `<a href="${attachment.url}" target="_blank" class="attachment">📎 ${attachment.name}</a><br>`;
                }
            }
            
            html += `
                </div>
            </div>
`;
        }
        
        html += `
        </div>
    </div>
</body>
</html>
`;
        
        // HTML dosyasını kaydet
        const fileName = `transcript-${channel.name}-${Date.now()}.html`;
        const filePath = path.join(transcriptsDir, fileName);
        fs.writeFileSync(filePath, html);
        
// Sunucu ayarlarını al
const settings = await getGuildSettings(channel.guild.id);

if (!settings || !settings.log_channel_id) {
    console.error('❌ Log kanalı ayarlanmamış!');
    return;
}

const logChannel = channel.guild.channels.cache.get(settings.log_channel_id);
        if (logChannel) {
            // Railway URL'ini al
            const serverURL = process.env.RAILWAY_URL || 'https://evc-bot-pbu.up.railway.app';
            const transcriptURL = `${serverURL}/transcripts/${fileName}`;

            const updatedEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔒 Ticket Kapatıldı')
                .addFields(
                    { name: '📋 Ticket', value: channel.name, inline: true },
                    { name: '👤 Kapatan', value: `<@${closedBy?.id || 'Bilinmiyor'}>`, inline: true },
                    { name: '📅 Tarih', value: new Date().toLocaleString('tr-TR'), inline: false },
                    { name: '🔗 Transcript Linki', value: `[Buraya tıkla](${transcriptURL})`, inline: false }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [updatedEmbed] });
        } else {
            console.error('❌ Log kanalı bulunamadı!');
        }
    } catch (error) {
        console.error('Transcript oluşturulurken hata:', error);
    }
}

// Kullanıcı ekleme fonksiyonu
async function addUser(interaction) {
    // Yetki kontrolü
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({ content: '❌ Bu komutu kullanmak için **Kanalları Yönet** yetkisine sahip olmalısın!', ephemeral: true });
    }
    
    const channel = interaction.channel;
    
    if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({ content: '❌ Bu komut sadece ticket kanallarında kullanılabilir!', ephemeral: true });
    }
    
    // Kullanıcı seçimi için mesaj
    await interaction.reply({ content: '👤 Eklemek istediğin kullanıcıyı **@etiketle** ve enter\'a bas:', ephemeral: true });
    
    // Mesaj bekle
    const filter = m => m.author.id === interaction.user.id;
    const collector = channel.createMessageCollector({ filter, time: 30000, max: 1 });
    
    collector.on('collect', async message => {
        const mentionedUser = message.mentions.users.first();
        
        if (!mentionedUser) {
            return message.reply('❌ Lütfen geçerli bir kullanıcı etiketle!');
        }
        
        // Kullanıcıyı kanala ekle
        await channel.permissionOverwrites.create(mentionedUser.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });
        
        await message.reply(`✅ ${mentionedUser} ticket'a eklendi!`);
        await message.delete();
    });
    
    collector.on('end', collected => {
        if (collected.size === 0) {
            interaction.followUp({ content: '⏱️ Zaman aşımı! İşlem iptal edildi.', ephemeral: true });
        }
    });
}

// Kullanıcı çıkarma fonksiyonu
async function removeUser(interaction) {
    // Yetki kontrolü
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({ content: '❌ Bu komutu kullanmak için **Kanalları Yönet** yetkisine sahip olmalısın!', ephemeral: true });
    }
    
    const channel = interaction.channel;
    
    if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({ content: '❌ Bu komut sadece ticket kanallarında kullanılabilir!', ephemeral: true });
    }
    
    // Kullanıcı seçimi için mesaj
    await interaction.reply({ content: '👤 Çıkarmak istediğin kullanıcıyı **@etiketle** ve enter\'a bas:', ephemeral: true });
    
    // Mesaj bekle
    const filter = m => m.author.id === interaction.user.id;
    const collector = channel.createMessageCollector({ filter, time: 30000, max: 1 });
    
    collector.on('collect', async message => {
        const mentionedUser = message.mentions.users.first();
        
        if (!mentionedUser) {
            return message.reply('❌ Lütfen geçerli bir kullanıcı etiketle!');
        }
        
        // Ticket sahibini çıkarmasın
        const ticketOwnerName = channel.name.replace('ticket-', '');
        if (mentionedUser.username.toLowerCase() === ticketOwnerName.toLowerCase()) {
            return message.reply('❌ Ticket sahibini çıkaramazsın!');
        }
        
        // Kullanıcıyı kanaldan çıkar
        await channel.permissionOverwrites.delete(mentionedUser.id);
        
        await message.reply(`✅ ${mentionedUser} ticket'tan çıkarıldı!`);
        await message.delete();
    });
    
    collector.on('end', collected => {
        if (collected.size === 0) {
            interaction.followUp({ content: '⏱️ Zaman aşımı! İşlem iptal edildi.', ephemeral: true });
        }
    });
}

// Bot yeni sunucuya eklendiğinde komutları kaydet
client.on('guildCreate', async guild => {
    console.log(`🎉 Yeni sunucuya eklendim: ${guild.name}`);
    const commands = client.commands.map(cmd => cmd.data.toJSON());
    await guild.commands.set(commands);
    console.log(`✅ Komutlar ${guild.name} sunucusuna kaydedildi!`);
});


console.log('TOKEN:', process.env.TOKEN ? 'Var' : 'YOK!');
client.login(process.env.TOKEN);