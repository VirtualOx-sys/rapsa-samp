module.exports = {
    bot: {
        token: "", // Token del bot de Discord para autenticación
        prefix: "", // Prefijo para los comandos del bot
        owners: [""], // IDs de los propietarios del bot
        mongourl: "" // URL de conexión a la base de datos MongoDB
    },

    website: {
        callback: "/callback", // Ruta de callback para la autenticación OAuth2
        secret: "", // Secreto del cliente para OAuth2
        clientID: "" // ID del cliente de la aplicación Discord
    },

    server: {
        id: "", // ID del servidor de Discord donde opera el bot
        roles: {
            policia: "", // ID del rol de policía en el servidor
            directiva: "", // ID del rol de directiva en el servidor
        },
        
        channels: {
            logs: "", // ID del canal de logs
            antecedentes: "", // ID del canal para gestionar antecedentes
            eliminados: "" // ID del canal para antecedentes eliminados
        }
    }
}
