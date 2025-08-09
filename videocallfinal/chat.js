const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

document.getElementById('send-chat').addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
        socket.emit('chatMessage', { userName, message });
        appendMessage(message, 'sent');
        chatInput.value = '';
    }
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('send-chat').click();
    }
});

socket.on('chatMessage', ({ userName: sender, message }) => {
    appendMessage(`${sender}: ${message}`, 'received');
});

function appendMessage(message, type) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('chat-bubble', type);
    messageEl.innerText = message;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}