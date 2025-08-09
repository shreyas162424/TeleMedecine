// recording.js
let mediaRecorder;
let recordedChunks = [];

document.getElementById('record').addEventListener('click', () => {
    if (!localStream) {
        alert('No stream available to record. Please start a call first.');
        return;
    }

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(localStream);

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.getElementById('download-recording');
        downloadLink.href = url;
        downloadLink.download = 'recording.webm';
        downloadLink.style.display = 'block';
        recordedChunks = [];
    };

    mediaRecorder.start();
    document.getElementById('record').style.display = 'none';
    document.getElementById('stop-record').style.display = 'block';
});

document.getElementById('stop-record').addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        document.getElementById('record').style.display = 'block';
        document.getElementById('stop-record').style.display = 'none';
    }
});