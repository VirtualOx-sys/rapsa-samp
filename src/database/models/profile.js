const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userID: { type: String, required: true, unique: true },
    biography: { type: String, default: 'Sin biografía' }
});

module.exports = mongoose.model('Profile', profileSchema);