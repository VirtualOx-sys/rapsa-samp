const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    _id: String,
    expires: Date,
    session: Object
});

module.exports = mongoose.model('Session', SessionSchema);
