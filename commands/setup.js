const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveGuildSettings, getGuildSettings } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Ticket sistemini kur')
        .addChannelOption(option =>
            option.setName('log-kanal')
                .setDescription('Ticket loglarının gönderileceği kanal')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('kategori')
                .setDescription('Ticketların oluşturulacağı kategori')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const logChannel = interaction.options.getChannel('log-kanal');
        const category = interaction.options.getChannel('kategori');
        
        // Ayarları database'e kaydet
        await saveGuildSettings(
            interaction.guild.id,
            logChannel.id,
            category.id
        );
        
        // Sunucu ayarlarını al (embed mesajları için)
        const settings = await getGuildSettings(interaction.guild.id);
        
        // Ticket paneli embed'i oluştur (dashboard'dan gelen ayarları kullan)
        const embed = new EmbedBuilder()
            .setColor(settings?.embed_color || '#0099ff')
            .setTitle(settings?.embed_title || '🎫 Destek Talebi Oluştur')
            .setDescription(settings?.embed_description || 'Destek ekibimizle iletişime geçmek için aşağıdaki butona tıklayın.')
            .setFooter({ text: 'Ticket sistemi aktif' })
            .setTimestamp();
        
        // Embed görseli varsa ekle
        if (settings?.embed_image_url) {
            embed.setImage(settings.embed_image_url);
        }
        
        // Buton rengi map
        const buttonStyleMap = {
            'Primary': ButtonStyle.Primary,
            'Success': ButtonStyle.Success,
            'Danger': ButtonStyle.Danger,
            'Secondary': ButtonStyle.Secondary
        };
        
        const buttonStyle = buttonStyleMap[settings?.button_color] || ButtonStyle.Primary;
        const buttonEmoji = settings?.button_emoji || '🎫';
        const buttonText = settings?.button_text || 'Ticket Aç';
        
        // Buton oluştur
        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel(`${buttonEmoji} ${buttonText}`)
            .setStyle(buttonStyle);
        
        const row = new ActionRowBuilder().addComponents(button);
        
        // Önce kullanıcıya cevap ver
        await interaction.reply({
            content: `✅ Ticket sistemi kuruldu!\n📋 Log Kanalı: ${logChannel}\n📁 Kategori: ${category}`,
            ephemeral: true
        });
        
        // Sonra ticket panelini kanala gönder
        await interaction.channel.send({ 
            embeds: [embed], 
            components: [row] 
        });
    }
};