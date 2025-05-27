// Importaciones esenciales
const { Client, GatewayIntentBits } = require("discord.js");

// Configuración del cliente de Discord
const client = (global.Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,         // Para info del servidor
        GatewayIntentBits.GuildMembers,   // Para info de miembros
        GatewayIntentBits.GuildPresences  // Para estados de usuarios
    ]
}));

// Configuración global
const config = require("./config.js");
global.config = config;

// Inicializar servicios principales
require("./src/server.js")(client);       // Servidor web (Express)
require("./src/database/connect.js")(client); // Base de datos (MongoDB)

// Estado del bot al iniciar
client.on('ready', async () => {
    console.log("(!) Bot " + client.user.tag + " conectado con éxito a discord");
    client.user.setPresence({ 
        activities: [{ 
            type: 'WATCHING', 
            name: 'RAPSA' 
        }], 
        status: "online" 
    });
});

// Agregar evento para cuando un miembro deja el servidor
client.on('guildMemberRemove', async (member) => {
    if (member.guild.id === config.server.id) {
        // Emitir evento para cerrar sesión
        global.io.emit('checkMembership', member.id);
    }
});

// Conectar bot a Discord
client.login(config.bot.token);

// Sistema de logs para errores
const fs = require("fs");
const errorLogStream = fs.createWriteStream('./logs/error.log', { flags: 'a' });
process.stderr.write = (message) => {
    errorLogStream.write(message);
};