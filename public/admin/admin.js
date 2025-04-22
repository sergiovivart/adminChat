const socket = io();
let currentClientId = null;

// base con modelos para datos

// un modelo de estructura de datos para guardar lso mensajes y el id del cliente
// en orden con mi mensajes y los mensajes de los clientes
const messages = [];    
let clientId = null; // Variable para almacenar el ID del cliente seleccionado
let clientIdConectado = null; 

socket.emit('register', 'admin');

socket.on('client-connected', (clientId) => {
    const clientListSideBar = document.getElementById('clientListSideBar');
    const li                = document.createElement('li');
    li.className            = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML            = clientId;
    clientListSideBar.appendChild(li);
    if (!currentClientId) currentClientId = clientId;
});


socket.on('client-disconnected', (clientId) => {
    const clientListSideBar = document.getElementById('clientListSideBar');
    const items = clientListSideBar.getElementsByTagName('li');
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].textContent === clientId) {
            clientListSideBar.removeChild(items[i]);
            break;
        }
    }
});

socket.on('message-from-client', ({ clientId, message }) => {
    const div = document.getElementById('messages');
    div.innerHTML += `<p><strong>Cliente (${clientId}):</strong> ${message}</p>`;
    currentClientId = clientId;
});


// selecionamos l id del socket a trabajar
const ul = document.getElementById('clientListSideBar'); // El contenedor 
const etiquetaIdConectado = document.getElementById('etiquetaIdConectado');


// aqui controlamos a que personas le enviaremo sla
ul.addEventListener('click', (e) => {
    if (e.target.classList.contains('list-group-item')) {
        const selectedClientId = e.target.textContent; // Actualiza el clientId global
        clientId = selectedClientId; // Actualiza el clientId global
        etiquetaIdConectado.innerHTML = 'cliente conectado : ' + clientId; // Actualiza el ID del cliente conectado
    }
});

// enviamso el mensaje
function sendMessage() {
    const input = document.getElementById('input');
    const msg = input.value;
    const select = document.getElementById('clientList');
    // const clientId = select.value;

    socket.emit('message-from-admin', {
        toClientId: clientId,
        message: msg
    });

    const div = document.getElementById('messages');
    div.innerHTML += `<p><strong>Yo (a ${clientId}):</strong> ${msg}</p>`;
    input.value = '';
}
