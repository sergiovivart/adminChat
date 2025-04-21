const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

// Servimos archivos estáticos
app.use('/client', express.static(path.join(__dirname, 'public/client')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

let adminSocket = null;
let clients = {};

io.on('connection', (socket) => {
    console.log(`Conectado: ${socket.id}`);

    socket.on('register', (role) => {
        if (role === 'admin') {
            adminSocket = socket;
            console.log('Administrador conectado');
        } else if (role === 'client') {
            clients[socket.id] = socket;
            console.log('Cliente conectado:', socket.id);
            if (adminSocket) {
                adminSocket.emit('client-connected', socket.id);
            }
        }
    });

    socket.on('message-from-client', ({ toAdmin, message }) => {
        if (adminSocket) {
            adminSocket.emit('message-from-client', {
                clientId: socket.id,
                message
            });
        }
    });

    socket.on('message-from-admin', ({ toClientId, message }) => {
        const clientSocket = clients[toClientId];
        if (clientSocket) {
            clientSocket.emit('message-from-admin', {
                message
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Desconectado:', socket.id);
        if (clients[socket.id]) {
            delete clients[socket.id];
            if (adminSocket) {
                adminSocket.emit('client-disconnected', socket.id);
            }
        } else if (socket === adminSocket) {
            adminSocket = null;
            console.log('Administrador desconectado');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
