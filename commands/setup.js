const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Ticket sistemini kurar')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#500018')
            .setTitle('Deneme Butonu')
            .setDescription('Denemeler');
        
        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Ticket')
            .setStyle(ButtonStyle.Primary);
        
        const row = new ActionRowBuilder().addComponents(button);
        
        await interaction.reply({ content: 'Ticket sistemi kuruldu', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    }
};