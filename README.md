# RAPSA Dashboard

![RAPSA Logo](./src/views/assets/img/logo.png)

## Descripción
RAPSA Dashboard es un sistema de gestión diseñado para administrar antecedentes y roles dentro de un servidor de Discord. Este proyecto combina tecnologías modernas como **Node.js**, **Express**, **MongoDB** y **Discord.js** para ofrecer una solución completa y eficiente.

## Características principales
- **Gestión de usuarios:**
  - Registro y eliminación de antecedentes.
  - Visualización de perfiles de miembros.
- **Integración con Discord:**
  - Sincronización de roles y estados de usuarios.
  - Notificaciones automáticas al servidor.
- **Interfaz web interactiva:**
  - Panel de administración con vistas dinámicas.
  - Diseño responsivo con **Bootstrap** y **Bulma**.
- **Seguridad:**
  - Autenticación con **OAuth2** de Discord.
  - Gestión de sesiones segura con **express-session** y **MongoDB**.

## Estructura del proyecto
El proyecto está organizado de la siguiente manera:

```
RAPSA Dashboard/
├── config.js          # Configuración principal del bot y la base de datos
├── index.js           # Punto de entrada principal del bot
├── LICENSE            # Licencia del proyecto
├── package.json       # Dependencias y scripts del proyecto
├── logs/              # Archivos de registro
├── src/               # Código fuente principal
│   ├── server.js      # Configuración del servidor Express
│   ├── database/      # Conexión y modelos de MongoDB
│   ├── commands/      # Comandos personalizados del bot
│   ├── utils/         # Utilidades y funciones auxiliares
│   └── views/         # Plantillas EJS para la interfaz web
```

## Requisitos
- **Node.js** v21.x
- **MongoDB**
- **Discord Bot Token**

## Instalación
1. Clona este repositorio:
   ```bash
   git clone https://github.com/VirtualOx-sys/rapsa-samp.git
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura el archivo `config.js` con tu token de bot, URL de MongoDB y otros detalles.
4. Inicia el proyecto:
   ```bash
   npm start
   ```

## Uso
- Accede al panel web en `http://localhost:3000`.
- Administra roles, antecedentes y perfiles directamente desde la interfaz.
- El bot sincronizará automáticamente los cambios con el servidor de Discord.

## Tecnologías utilizadas
- **Backend:** Node.js, Express, MongoDB
- **Frontend:** EJS, Bootstrap, Bulma
- **Integración:** Discord.js, Passport.js

## Contribuciones
Actualmente, el sistema no está recibiendo actualizaciones activas debido a que se ha fusionado con un nuevo sistema denominado **SIGEST**. Este nuevo sistema amplía significativamente las funcionalidades ofrecidas, integrando características adicionales que abarcan una gestión más completa y eficiente.

## Licencia
Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](./LICENSE) para más detalles.

---

¡Gracias por usar RAPSA Dashboard! Este proyecto fue desarrollado con esfuerzo y dedicación. 
