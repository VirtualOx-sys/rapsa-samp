const escapeHtml = (text) => {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const sanitizeInput = (text) => {
    if (!text) return '';
    return text
        .trim()
        .replace(/[<>]/g, '') // Remover < >
        .replace(/[{}]/g, '') // Remover { }
        .replace(/[[\]]/g, '') // Remover [ ]
        .replace(/;/g, '') // Remover ;
        .slice(0, 1000); // Limitar longitud
};

const sanitizeObject = (obj) => {
    const clean = {};
    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            clean[key] = sanitizeInput(obj[key]);
        } else {
            clean[key] = obj[key];
        }
    }
    return clean;
};

module.exports = { escapeHtml, sanitizeInput, sanitizeObject };
