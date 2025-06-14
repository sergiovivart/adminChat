const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

// Credenciales de administrador
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Variable para almacenar el estado de autenticación
let isAuthenticated = false;

// Servimos archivos estáticos
app.use('/client', express.static(path.join(__dirname, 'public/client')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Middleware para parsear JSON
app.use(express.json());

// Ruta de login
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

// Endpoint para autenticación
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        isAuthenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({
            success: false,
            message: 'Usuario o contraseña incorrectos'
        });
    }
});

// Endpoint para verificar autenticación
app.get('/admin/check-auth', (req, res) => {
    if (isAuthenticated) {
        res.json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// Ruta para cerrar sesión
app.get('/admin/logout', (req, res) => {
    isAuthenticated = false;
    res.redirect('/admin/login');
});

app.get('/', function (req, res) {
    return res.redirect('/client');
});

let adminSocket = null;
let clients = {};

io.on('connection', (socket) => {
    console.log(`Conectado: ${socket.id}`);

    // con esto registramos los sockets de admin y cliente
    socket.on('register', (role) => {
        if (role === 'admin') { // registramos el admin
            adminSocket = socket;
            console.log('Administrador conectado');
            // Notificar a todos los clientes que el admin está conectado
            Object.values(clients).forEach(client => {
                client.emit('admin-status-change', { connected: true });
            });
        } else if (role === 'client') { // registramos el cliente
            clients[socket.id] = socket;
            console.log('Cliente conectado:', socket.id);
            // Notificar al nuevo cliente si el admin está conectado
            if (adminSocket) {
                socket.emit('admin-status-change', { connected: true });
                adminSocket.emit('client-connected', socket.id);
            }
        }
    });

    //  Manejamos los mensajes que envien los cleintes
    socket.on('message-from-client', ({ toAdmin, message }) => {
        if (adminSocket) {
            adminSocket.emit('message-from-client', {
                clientId: socket.id,
                message
            });
        }
    });

    // Manejamos los mensajes que envie el admin
    socket.on('message-from-admin', ({ toClientId, message }) => {
        const clientSocket = clients[toClientId];
        if (clientSocket) {
            clientSocket.emit('message-from-admin', {
                message
            });
        }
    });

    // en caso de desconcexion
    socket.on('disconnect', () => {
        console.log('Desconectado:', socket.id);
        if (clients[socket.id]) {
            delete clients[socket.id];  // quitamos el socket de la lista
            if (adminSocket) {
                adminSocket.emit('client-disconnected', socket.id);
            }
        } else if (socket === adminSocket) { // quitamos el admin socket
            adminSocket = null;
            console.log('Administrador desconectado');
            // Notificar a todos los clientes que el admin está desconectado
            Object.values(clients).forEach(client => {
                client.emit('admin-status-change', { connected: false });
            });
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
