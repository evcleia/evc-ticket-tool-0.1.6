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
        const logChannel = interaction.options.getChannel('log-kanal');
        const category = interaction.options.getChannel('kategori');
        
        // Ayarları database'e kaydet
        await saveGuildSettings(
            interaction.guild.id,
            logChannel.id,
            category.id
        );
        
        await interaction.reply({
            content: `✅ Ticket sistemi kuruldu!\n📋 Log Kanalı: ${logChannel}\n📁 Kategori: ${category}`,
            ephemeral: true
        });
    }
};