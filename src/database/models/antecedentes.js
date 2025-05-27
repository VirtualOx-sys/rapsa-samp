const mongoose = require("mongoose");

const antecedenteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    cod: { type: String, required: true },
    fecha: { 
        type: Date, 
        default: () => {
            return new Date().toLocaleString("es-AR", {timeZone: "America/Argentina/Buenos_Aires"})
        }
    },
    descripcion: { type: String, required: true },
    policia: { type: String, required: true },
    eliminado: {
        type: Boolean,
        default: false
    },
    eliminadoPor: String,
    fechaEliminacion: Date
});

module.exports = mongoose.model("antecedentes", antecedenteSchema);
