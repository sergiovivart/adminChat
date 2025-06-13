// Verificar si el usuario está autenticado
async function checkAuth() {
    try {
        const response = await fetch('/admin/check-auth');
        if (!response.ok) {
            window.location.href = '/admin/login';
        }
    } catch (error) {
        window.location.href = '/admin/login';
    }
}

// Verificar autenticación al cargar la página
checkAuth();

const socket = io();
let currentClientId = null;

// Objeto para almacenar los mensajes de cada cliente
const clientMessages = {};

// Emitimos el registro del administrador
socket.emit('register', 'admin');

// Cuando un cliente se conecta
socket.on('client-connected', (clientId) => {
    const clientListSideBar = document.getElementById('clientListSideBar');
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = clientId;
    clientListSideBar.appendChild(li);

    // Inicializamos el array de mensajes para este cliente
    if (!clientMessages[clientId]) {
        clientMessages[clientId] = [];
    }

    if (!currentClientId) currentClientId = clientId;
});

// Cuando un cliente se desconecta
socket.on('client-disconnected', (clientId) => {
    const clientListSideBar = document.getElementById('clientListSideBar');
    const items = clientListSideBar.getElementsByTagName('li');

    for (let i = 0; i < items.length; i++) {
        if (items[i].textContent === clientId) {
            clientListSideBar.removeChild(items[i]);
            break;
        }
    }

    // Eliminamos los mensajes del cliente desconectado
    delete clientMessages[clientId];
});

// Cuando se recibe un mensaje de un cliente
socket.on('message-from-client', ({ clientId, message }) => {
    // Guardamos el mensaje en el array correspondiente al cliente
    if (!clientMessages[clientId]) {
        clientMessages[clientId] = [];
    }
    clientMessages[clientId].push({ sender: 'client', message });

    // Si el cliente actual es el que envió el mensaje, lo mostramos
    if (currentClientId === clientId) {
        const div = document.getElementById('messages');
        div.innerHTML += `<p><strong>Cliente (${clientId}):</strong> ${message}</p>`;
    }
});

// Seleccionamos el ID del socket a trabajar
const ul = document.getElementById('clientListSideBar'); // El contenedor
const etiquetaIdConectado = document.getElementById('etiquetaIdConectado');

// Aquí controlamos a qué cliente le enviaremos los mensajes
ul.addEventListener('click', (e) => {
    if (e.target.classList.contains('list-group-item')) {
        const selectedClientId = e.target.textContent; // Actualiza el clientId global
        clientId = selectedClientId; // Actualiza el clientId global
        etiquetaIdConectado.innerHTML = 'Cliente conectado: ' + clientId; // Actualiza el ID del cliente conectado

        // Mostramos solo los mensajes del cliente seleccionado
        const div = document.getElementById('messages');
        div.innerHTML = ''; // Limpiamos los mensajes actuales
        if (clientMessages[clientId]) {
            clientMessages[clientId].forEach(msg => {
                if (msg.sender === 'client') {
                    div.innerHTML += `<p><strong>Cliente (${clientId}):</strong> ${msg.message}</p>`;
                } else {
                    div.innerHTML += `<p><strong>Yo:</strong> ${msg.message}</p>`;
                }
            });
        }
    }
});

// Enviamos el mensaje
function sendMessage() {
    const input = document.getElementById('input');
    const msg = input.value;

    if (!clientId) {
        alert('Selecciona un cliente para enviar el mensaje.');
        return;
    }

    // Emitimos el mensaje al cliente seleccionado
    socket.emit('message-from-admin', {
        toClientId: clientId,
        message: msg
    });

    // Guardamos el mensaje en el array correspondiente al cliente
    if (!clientMessages[clientId]) {
        clientMessages[clientId] = [];
    }
    clientMessages[clientId].push({ sender: 'admin', message: msg });

    // Mostramos el mensaje en el chat actual
    const div = document.getElementById('messages');
    div.innerHTML += `<p><strong>Yo (a ${clientId}):</strong> ${msg}</p>`;
    input.value = '';
}
