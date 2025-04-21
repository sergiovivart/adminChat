const socket = io();

socket.emit('register', 'client');

socket.on('message-from-admin', ({ message }) => {
    const div = document.getElementById('messages');
    div.innerHTML += `<p><strong>Admin:</strong> ${message}</p>`;
});

function sendMessage() {
    const input = document.getElementById('input');
    const msg = input.value;
    socket.emit('message-from-client', {
        toAdmin: true,
        message: msg
    });
    const div = document.getElementById('messages');
    div.innerHTML += `<p><strong>Yo:</strong> ${msg}</p>`;
    input.value = '';
}
