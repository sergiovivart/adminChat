const socket = io();

socket.emit('register', 'client');

// Manejar cambios en el estado de conexión del admin
socket.on('admin-status-change', ({ connected }) => {
    const statusElement = document.querySelector('#adminStatus .badge');
    if (connected) {
        statusElement.className = 'badge bg-success';
        statusElement.textContent = 'Admin conectado';
    } else {
        statusElement.className = 'badge bg-secondary';
        statusElement.textContent = 'Admin desconectado';
    }
});

socket.on('message-from-admin', ({ message }) => {
    const div = document.getElementById('messages');
    div.innerHTML += `<p class="mensajeAdmin"><strong>Admin:</strong> ${message}</p>`;
});

function sendMessage() {
    const input = document.getElementById('input');
    const msg = input.value;
    socket.emit('message-from-client', {
        toAdmin: true,
        message: msg
    });
    const div = document.getElementById('messages');
    div.innerHTML += `<p class=mensajeYo><strong>Yo:</strong> ${msg}</p>`;
    input.value = '';
}
