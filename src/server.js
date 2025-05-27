const path = require("path");
const port = process.env.PORT || 3000;
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const Strategy = require("passport-discord").Strategy;
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const { EmbedBuilder } = require('discord.js');
const config = require("../config.js");
const app = express();
const MongoStore = require('connect-mongo');
const antecedentesSchema = require("./database/models/antecedentes.js");
const socketIo = require('socket.io');
const profileSchema = require("./database/models/profile.js");
const { escapeHtml, sanitizeInput, sanitizeObject } = require('./utils/sanitize');

app.use((req, res, next) => {
    res.setHeader("Referrer-Policy", "strict-origin");
    next();
});

module.exports = async (client) => {
    const templateDir = path.resolve(`${process.cwd()}${path.sep}src/views`);
    app.use("/css", express.static(path.resolve(`${templateDir}${path.sep}assets/css`)));
    app.use("/js", express.static(path.resolve(`${templateDir}${path.sep}assets/js`)));
    app.use("/img", express.static(path.resolve(`${templateDir}${path.sep}assets/img`)));

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    passport.use(new Strategy({
        clientID: config.website.clientID,
        clientSecret: config.website.secret,
        callbackURL: config.website.callback,
        scope: ["identify"],
        proxy: true
    }, (accessToken, refreshToken, profile, done) => {
        process.nextTick(() => done(null, profile));
    }));

    app.use(session({
        store: MongoStore.create({
            mongoUrl: config.bot.mongourl,
            collectionName: 'sessions',
            ttl: 604800,
            autoRemove: 'native',
            touchAfter: 24 * 3600,
            crypto: {
                secret: 'x[Pf[g)p*t%:Y+@6i{L!J+!LhMHJQ0&Z'
            }
        }),
        name: 'rapsa.sid',
        secret: "x[Pf[g)p*t%:Y+@6i{L!J+!LhMHJQ0&Z",
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            maxAge: 604800000, // 7 días en milisegundos
            secure: false,
            httpOnly: true,
            sameSite: 'lax'
        }
    }));

    app.set('trust proxy', 1);
    app.use(passport.initialize());
    app.use(passport.session());
    app.engine("html", ejs.renderFile);
    app.set("view engine", "html");
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    const checkAuth = (req, res, next) => {
        if (!req.isAuthenticated()) {
            req.session.backURL = req.url;
            return res.redirect("/login");
        }
        const member = client.guilds.cache.get(config.server.id)?.members.cache.get(req.user.id);
        if (!member || !member.roles.cache.has(config.server.roles.policia)) {
            req.logout();
            return res.redirect("/login?error=true&message=No tienes permiso para acceder.");
        }
        next();
    };

    const checkDirectivaAuth = (req, res, next) => {
        if (!req.isAuthenticated()) {
            req.session.backURL = req.url;
            return res.redirect("/login");
        }
        const member = client.guilds.cache.get(config.server.id)?.members.cache.get(req.user.id);
        if (!member || !member.roles.cache.has(config.server.roles.directiva)) {
            return res.redirect("/antecedentes/listar?error=true&message=No tienes permiso para realizar esta acción.");
        }
        next();
    };

    const renderTemplate = (res, req, template, data = {}) => {
        const member = client.guilds.cache.get(config.server.id)?.members.cache.get(req.user?.id);
        const baseData = {
            user: req.isAuthenticated() ? req.user : null,
            member: member,  
            path: req.path,
            bot: client,
            config: config,
            isDirectiva: member?.roles.cache.has(config.server.roles.directiva) || false
        };
        res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
    };

    const sendEmbed = (channelId, embedData) => {
        const channel = client.channels.cache.get(channelId);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor(embedData.color)
                .setTitle(embedData.title)
                .setTimestamp();
            if (embedData.description) embed.setDescription(embedData.description);
            if (embedData.fields) embed.addFields(embedData.fields);
            channel.send({ embeds: [embed] });
        }
    };

    const formatFechaArgentina = (fecha) => {
        return fecha.toLocaleString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
            dateStyle: "short",
            timeStyle: "medium"
        });
    };

    app.get("/login", (req, res, next) => {
        if (req.isAuthenticated()) return res.redirect("/");
        next();
    }, passport.authenticate("discord"));

    app.get("/callback", (req, res, next) => {
        passport.authenticate("discord", async (err, user) => {
            if (err) {
                return res.redirect("/?error=true");
            }
            if (!user) {
                return res.redirect("/?error=true");
            }
            req.logIn(user, async (err) => {
                if (err) {
                    return res.redirect("/?error=true");
                }
                const member = client.guilds.cache.get(config.server.id)?.members.cache.get(user.id);
                if (!member) {
                    return res.redirect("/?error=true");
                }
                if (!member.roles.cache.has(config.server.roles.policia)) {
                    return res.redirect("/?error=true");
                }
                const displayName = member.nickname || member.user.username;
                sendEmbed(config.server.channels.logs, {
                    color: 0x4287f5,
                    title: '👤 Inicio de Sesión',
                    description: `**Usuario:** ${displayName}\n**ID:** ${user.id}\n**Discord:** ${user.username}`
                });
                return res.redirect("/antecedentes/listar");
            });
        })(req, res, next);
    });

    app.get("/logout", (req, res, next) => {
        if (req.session) {
            req.session.destroy();
        }
        res.clearCookie('rapsa.sid');
        res.redirect('/');
    });

    app.use(async (req, res, next) => {
        if (req.path.includes('/logout') || 
            req.path.includes('/login') ||  
            req.path.includes('/callback') ||
            !req.isAuthenticated()) {
            return next();
        }
        const member = client.guilds.cache.get(config.server.id)?.members.cache.get(req.user.id);
        if (!member || !member.roles.cache.has(config.server.roles.policia)) {
            if (req.session) {
                req.session.destroy();
            }
            res.clearCookie('rapsa.sid');
            return res.redirect("/?error=true");
        }
        next();
    });

    app.get("/", (req, res) => {
        renderTemplate(res, req, "index.ejs", {
            error: req.query.error === 'true'
        });
    });

    app.get("/antecedentes/registrar", checkAuth, (req, res) => {
        renderTemplate(res, req, "antecedentes/registrar.ejs", {});
    });

    app.post("/antecedentes/registrar", checkAuth, async (req, res) => {
        try {
            const cleanData = sanitizeObject({
                nombre: req.body.nombre,
                cod: req.body.cod,
                descripcion: req.body.descripcion
            });

            if (!cleanData.nombre || !cleanData.cod || !cleanData.descripcion) {
                return res.redirect("/antecedentes/registrar?error=true&message=Datos inválidos");
            }

            const member = client.guilds.cache.get(config.server.id).members.cache.get(req.user.id);
            const policia = member.nickname || member.user.username;
            const fecha = new Date();

            const antecedente = await antecedentesSchema.create({
                ...cleanData,
                policia,
                fecha,
                eliminado: false
            });

            sendEmbed(config.server.channels.antecedentes, {
                color: 0x28a745,
                title: '📝 Nuevo Antecedente Registrado',
                fields: [
                    { name: 'Infractor', value: cleanData.nombre, inline: true },
                    { name: 'Código', value: cleanData.cod, inline: true },
                    { name: 'Oficial', value: policia, inline: true },
                    { name: 'Descripción', value: cleanData.descripcion },
                    { name: 'Fecha y Hora', value: formatFechaArgentina(fecha) }
                ]
            });
            res.redirect("/antecedentes/listar?success=true&message=Antecedente registrado con éxito.");
        } catch (error) {
            console.error("Error al registrar antecedente:", error);
            return res.redirect("/antecedentes/registrar?error=true&message=Error al procesar los datos");
        }
    });

    app.get("/antecedentes/listar", checkAuth, async (req, res) => {
        try {
            const antecedentes = await antecedentesSchema.find({ eliminado: false });
            const member = client.guilds.cache.get(config.server.id).members.cache.get(req.user.id);
            const totalAntecedentes = await antecedentesSchema.countDocuments({ 
                policia: member.nickname || member.user.username,
                eliminado: false
            });
            renderTemplate(res, req, "antecedentes/listar.ejs", { antecedentes, totalAntecedentes });
        } catch (error) {
            console.error("Error al listar antecedentes:", error);
            renderTemplate(res, req, "antecedentes/listar.ejs", { 
                antecedentes: [], 
                totalAntecedentes: 0,
                error: "Error al cargar antecedentes"
            });
        }
    });

    app.get("/antecedentes/eliminados", checkDirectivaAuth, async (req, res) => {
        const eliminados = await antecedentesSchema.find({ eliminado: true });
        renderTemplate(res, req, "antecedentes/eliminados.ejs", { eliminados });
    });

    app.get("/antecedentes/eliminar/:id", checkDirectivaAuth, async (req, res) => {
        const antecedente = await antecedentesSchema.findById(req.params.id);
        const member = client.guilds.cache.get(config.server.id).members.cache.get(req.user.id);
        const eliminadoPor = member.nickname || member.user.username;
        const fechaEliminacion = new Date();
        await antecedentesSchema.findByIdAndUpdate(req.params.id, {
            eliminado: true,
            eliminadoPor: eliminadoPor,
            fechaEliminacion
        });
        sendEmbed(config.server.channels.eliminados, {
            color: 0xdc3545,
            title: '🗑️ Antecedente Eliminado',
            fields: [
                { name: 'Infractor', value: antecedente.nombre, inline: true },
                { name: 'Código', value: antecedente.cod, inline: true },
                { name: 'Oficial Original', value: antecedente.policia, inline: true },
                { name: 'Descripción Original', value: antecedente.descripcion },
                { name: 'Fecha Registro', value: formatFechaArgentina(antecedente.fecha) },
                { name: 'Eliminado Por', value: eliminadoPor, inline: true },
                { name: 'Fecha Eliminación', value: formatFechaArgentina(fechaEliminacion) }
            ]
        });
        res.redirect("/antecedentes/listar");
    });

    app.get("/api/antecedentes/buscar", checkAuth, async (req, res) => {
        try {
            const cleanQuery = sanitizeObject({
                cod: req.query.cod,
                nombre: req.query.nombre,
                policia: req.query.policia
            });

            let query = { eliminado: false };
            if (cleanQuery.cod) query.cod = new RegExp(escapeHtml(cleanQuery.cod), 'i');
            if (cleanQuery.nombre) query.nombre = new RegExp(escapeHtml(cleanQuery.nombre), 'i');
            if (cleanQuery.policia) query.policia = new RegExp(escapeHtml(cleanQuery.policia), 'i');

            const results = await antecedentesSchema.find(query);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: "Error al buscar antecedentes" });
        }
    });

    app.get("/antecedentes/buscar", checkAuth, (req, res) => {
        renderTemplate(res, req, "antecedentes/buscar.ejs");
    });

    app.get("/profile/:id", checkAuth, async (req, res) => {
        try {
            const profileId = req.params.id;
            const member = client.guilds.cache.get(config.server.id)?.members.cache.get(profileId);
            
            // Verificar que el usuario existe y es oficial
            if (!member || !member.roles.cache.has(config.server.roles.policia)) {
                return res.redirect("/antecedentes/listar?error=true&message=Usuario no encontrado o no es oficial");
            }

            const profile = member.user;
            const userProfile = await profileSchema.findOne({ userID: profileId }) || 
                               await profileSchema.create({ userID: profileId });
            
            const antecedentes = await antecedentesSchema.find({ 
                policia: member.nickname || member.user.username,
                eliminado: false 
            }).sort({ fecha: -1 }); // Ordenar por fecha, más recientes primero

            const totalAntecedentes = await antecedentesSchema.countDocuments({ 
                policia: member.nickname || member.user.username,
                eliminado: false
            });

            renderTemplate(res, req, "profile.ejs", {
                profile,
                member,
                userProfile,
                antecedentes,
                totalAntecedentes,
                isOwnProfile: req.user.id === profileId
            });
        } catch (error) {
            console.error("Error al cargar perfil:", error);
            res.redirect("/antecedentes/listar?error=true&message=Error al cargar el perfil");
        }
    });

    // Simplificar la edición del perfil
    app.post("/profile/edit", checkAuth, async (req, res) => {
        try {
            const cleanBiography = sanitizeInput(req.body.biography);
            
            await profileSchema.findOneAndUpdate(
                { userID: req.user.id },
                { biography: cleanBiography },
                { upsert: true }
            );

            res.redirect("/profile/" + req.user.id);
        } catch (error) {
            console.error("Error al editar perfil:", error);
            res.redirect("/profile/" + req.user.id + "?error=true&message=Error al guardar cambios");
        }
    });

    // Agregar ruta para listar policías
    app.get("/miembros", checkAuth, async (req, res) => {
        try {
            const guild = client.guilds.cache.get(config.server.id);
            const members = guild.members.cache
                .filter(member => member.roles.cache.has(config.server.roles.policia));

            const policias = await Promise.all(members.map(async member => {
                const totalAntecedentes = await antecedentesSchema.countDocuments({
                    policia: member.nickname || member.user.username,
                    eliminado: false
                });

                return {
                    id: member.id,
                    username: member.user.username,
                    displayName: member.nickname || member.user.username,
                    avatar: member.user.avatar,
                    isDirectiva: member.roles.cache.has(config.server.roles.directiva),
                    totalAntecedentes
                };
            }));

            // Ordenar según el parámetro sort
            const sort = req.query.sort;
            if (sort === 'name') {
                policias.sort((a, b) => a.displayName.localeCompare(b.displayName));
            } else if (sort === 'antecedentes') {
                policias.sort((a, b) => b.totalAntecedentes - a.totalAntecedentes);
            }

            renderTemplate(res, req, "miembros.ejs", { policias });
        } catch (error) {
            console.error("Error al listar policías:", error);
            res.redirect("/antecedentes/listar?error=true&message=Error al cargar la lista de oficiales");
        }
    });

    const server = app.listen(port, () => {
        console.log(`(!) Servidor escuchando en https://panel.rapsa.es:${port}`);
    });

    const io = socketIo(server);
    global.io = io;
};