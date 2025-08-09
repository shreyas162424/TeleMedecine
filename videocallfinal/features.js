// fileshare.js
const dataChannels = {}; // Store data channels by target user
let selectedFile = null;

function createDataChannel(pc, targetUserName) {
    const channel = pc.createDataChannel('fileTransfer');
    dataChannels[targetUserName] = channel;
    channel.onopen = () => {
        console.log(`Data channel open for ${targetUserName}`);
        enableSendFileButton();
    };
    channel.onclose = () => {
        console.log(`Data channel closed for ${targetUserName}`);
        disableSendFileButton();
    };
    channel.onmessage = (event) => {
        const file = event.data;
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.innerText = `Download ${file.name}`;
        document.getElementById('file-downloads').appendChild(link);
    };

    pc.ondatachannel = (event) => {
        const channel = event.channel;
        dataChannels[targetUserName] = channel;
        channel.onopen = () => {
            console.log(`Data channel open for ${targetUserName}`);
            enableSendFileButton();
        };
        channel.onclose = () => {
            console.log(`Data channel closed for ${targetUserName}`);
            disableSendFileButton();
        };
        channel.onmessage = (event) => {
            const file = event.data;
            const url = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            link.innerText = `Download ${file.name}`;
            document.getElementById('file-downloads').appendChild(link);
        };
    };
}

function enableSendFileButton() {
    const sendButton = document.getElementById('send-file');
    if (sendButton) {
        sendButton.disabled = false;
        sendButton.classList.remove('btn-secondary');
        sendButton.classList.add('btn-primary');
        console.log('Send File button enabled');
    }
}

function disableSendFileButton() {
    const sendButton = document.getElementById('send-file');
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.classList.remove('btn-primary');
        sendButton.classList.add('btn-secondary');
        console.log('Send File button disabled');
    }
}

document.getElementById('file-input').addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    if (selectedFile) {
        console.log(`Selected file: ${selectedFile.name}`);
    }
});

document.getElementById('send-file').addEventListener('click', async () => {
    if (!selectedFile) {
        alert('Please select a file first.');
        return;
    }
    const targetUserName = prompt('Enter target username:'); // For group calls
    const channel = dataChannels[targetUserName];
    if (!channel || channel.readyState !== 'open') {
        alert(`Data channel not ready for ${targetUserName}. Please wait for the call to connect.`);
        return;
    }
    try {
        channel.send(selectedFile);
        alert(`File "${selectedFile.name}" sent successfully to ${targetUserName}.`);
        selectedFile = null;
        document.getElementById('file-input').value = ''; // Clear the input
    } catch (err) {
        console.error('Error sending file:', err);
        alert('Failed to send file. Please try again.');
    }
});

// Initialize button state
disableSendFileButton();

// Update createPeerConnection to include data channel
const originalCreatePeerConnection = createPeerConnection;
createPeerConnection = (offerObj, targetUserName) => {
    return new Promise(async (resolve, reject) => {
        await originalCreatePeerConnection(offerObj, targetUserName);
        const pc = peerConnections[targetUserName || (offerObj ? offerObj.offererUserName : userName)];
        createDataChannel(pc, targetUserName || (offerObj ? offerObj.offererUserName : userName));
        resolve();
    });
};