const socket = io();
let currentClientId = null;

socket.emit('register', 'admin');

socket.on('client-connected', (clientId) => {
    const select = document.getElementById('clientList');
    const option = document.createElement('option');
    option.value = clientId;
    option.text = clientId;
    select.add(option);
    if (!currentClientId) currentClientId = clientId;
});

socket.on('client-disconnected', (clientId) => {
    const select = document.getElementById('clientList');
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === clientId) {
            select.remove(i);
            break;
        }
    }
});

socket.on('message-from-client', ({ clientId, message }) => {
    const div = document.getElementById('messages');
    div.innerHTML += `<p><strong>Cliente (${clientId}):</strong> ${message}</p>`;
    currentClientId = clientId;
});

function sendMessage() {
    const input = document.getElementById('input');
    const msg = input.value;
    const select = document.getElementById('clientList');
    const clientId = select.value;

    socket.emit('message-from-admin', {
        toClientId: clientId,
        message: msg
    });

    const div = document.getElementById('messages');
    div.innerHTML += `<p><strong>Yo (a ${clientId}):</strong> ${msg}</p>`;
    input.value = '';
}
