const mongoose = require('mongoose');
const config = require('../../config.js');

module.exports = async (client) => {
    try {
        await mongoose.connect(config.bot.mongourl);
        console.log('(!) Conectado a la base de datos MongoDB');
    } catch (err) {
        console.error('(x) Error al conectar a MongoDB:', err);
    }
};