// fileshare.js
let dataChannel;
let selectedFile = null;

function createDataChannel(pc, targetUserName) {
    dataChannel = pc.createDataChannel('fileTransfer');
    dataChannel.onopen = () => console.log('Data channel open');
    dataChannel.onmessage = (event) => {
        const file = event.data;
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.innerText = `Download ${file.name}`;
        document.getElementById('file-downloads').appendChild(link);
    };

    pc.ondatachannel = (event) => {
        dataChannel = event.channel;
        dataChannel.onopen = () => console.log('Data channel open');
        dataChannel.onmessage = (event) => {
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

document.getElementById('file-input').addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    if (selectedFile) {
        console.log(`Selected file: ${selectedFile.name}`);
    }
});

document.getElementById('send-file').addEventListener('click', () => {
    if (!selectedFile) {
        alert('Please select a file first.');
        return;
    }
    if (!dataChannel || dataChannel.readyState !== 'open') {
        alert('Data channel not ready. Please wait for the call to connect.');
        return;
    }
    dataChannel.send(selectedFile);
    alert(`File "${selectedFile.name}" sent successfully.`);
    selectedFile = null;
    document.getElementById('file-input').value = ''; // Clear the input
});

// Update createPeerConnection to include data channel
const originalCreatePeerConnection = createPeerConnection;
createPeerConnection = (offerObj, targetUserName) => {
    return new Promise(async (resolve, reject) => {
        await originalCreatePeerConnection(offerObj, targetUserName);
        const pc = peerConnections[targetUserName || (offerObj ? offerObj.offererUserName : userName)];
        createDataChannel(pc, targetUserName);
        resolve();
    });
};