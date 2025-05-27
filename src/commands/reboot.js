const { EmbedBuilder } = require('discord.js');
const fetch = require("node-fetch");

exports.run = async (client, message, args) => {
    if(!global.config.bot.owners.includes(message.author.id)) {
        return message.reply({ 
            content: 'No tienes permiso para usar este comando.',
            ephemeral: true 
        });
    }

    const rebootEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🔄 Reiniciando Sistema')
        .setDescription('El bot se está reiniciando...')
        .setTimestamp();

    await message.channel.send({ embeds: [rebootEmbed] });
    console.log(`BOT: Reiniciando por solicitud de ${message.author.tag}`);
    process.exit(1);
};

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: []
};
exports.help = {
	name: 'reboot',
	description: 'Reinicia el bot.',
	usage: 'reboot'
};