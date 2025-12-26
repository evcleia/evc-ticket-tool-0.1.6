const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { saveGuildSettings } = require('../database');

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
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    const logChannel = interaction.options.getChannel('log-kanal');
    const category = interaction.options.getChannel('kategori');
    
    // Ayarları database'e kaydet
    await saveGuildSettings(
        interaction.guild.id,
        logChannel.id,
        category.id
    );
    
    // Ticket paneli embed'i oluştur
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎫 Destek Talebi Oluştur')
        .setDescription('Destek ekibimizle iletişime geçmek için aşağıdaki butona tıklayın.')
        .setFooter({ text: 'Ticket sistemi aktif' })
        .setTimestamp();
    
    // Buton oluştur
    const button = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('🎫 Ticket Aç')
        .setStyle(ButtonStyle.Primary);
    
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
}
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
        
        // Buton oluştur
        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel(settings?.button_text || '🎫 Ticket Aç')
            .setStyle(ButtonStyle.Primary);
        
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