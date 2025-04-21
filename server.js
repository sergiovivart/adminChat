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

    // con esto registramos los sockets de admin y cliente
    socket.on('register', (role) => {
        if (role === 'admin') { // registramos el admin
            adminSocket = socket;
            console.log('Administrador conectado');
        } else if (role === 'client') { // registramos el cliente
            clients[socket.id] = socket;
            console.log('Cliente conectado:', socket.id);
            if (adminSocket) {
                adminSocket.emit('client-connected', socket.id);
            }
        }
    });

    //  Manejamos los mensajes que envien los cleintes
    socket.on('message-from-client', ({ toAdmin, message }) => {
        if (adminSocket && toAdmin) {
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
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
