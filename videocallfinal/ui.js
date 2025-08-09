let timerInterval = null;
let seconds = 0;

// Mute/Unmute Mic Button
document.getElementById('toggle-mic').addEventListener('click', () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            document.getElementById('toggle-mic').innerText = audioTrack.enabled ? 'Mute Mic' : 'Unmute Mic';
        }
    }
});

// Toggle Camera On/Off Button
document.getElementById('toggle-camera').addEventListener('click', () => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            document.getElementById('toggle-camera').innerText = videoTrack.enabled ? 'Turn Off Camera' : 'Turn On Camera';
        }
    }
});

// Share Screen Button
let isScreenSharing = false;
document.getElementById('share-screen').addEventListener('click', async () => {
    try {
        if (isScreenSharing) {
            stopScreenSharing();
        } else {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            localStream.addTrack(screenStream.getTracks()[0]); 
            isScreenSharing = true;
            document.getElementById('share-screen').innerText = 'Stop Screen Sharing';
            screenStream.getVideoTracks()[0].onended = () => stopScreenSharing();
        }
    } catch (err) {
        console.error('Error sharing screen:', err);
    }
});

// Stop Screen Sharing
function stopScreenSharing() {
    const screenTrack = localStream.getTracks().find(track => track.kind === 'video');
    if (screenTrack) {
        screenTrack.stop();
        localStream.removeTrack(screenTrack);
        isScreenSharing = false;
        document.getElementById('share-screen').innerText = 'Share Screen';
    }
}

// Picture-in-Picture functionality
document.getElementById('pip-button').addEventListener('click', async () => {
    const remoteVideo = document.getElementById('remote-video');
    if (remoteVideo !== document.pictureInPictureElement) {
        try {
            if (remoteVideo) {
                await remoteVideo.requestPictureInPicture();
            }
        } catch (err) {
            console.error('PiP failed:', err);
        }
    } else {
        await document.exitPictureInPicture();
    }
});

// Hang Up Button
document.getElementById('hangup').addEventListener('click', endCallWithConfirmation);

// Reconnect Button
document.getElementById('reconnect').addEventListener('click', reconnectCall);

// Call Duration Timer
function startCallTimer() {
    seconds = 0;
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        document.getElementById('call-timer').innerText = `Call Duration: ${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopCallTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        document.getElementById('call-timer').innerText = 'Call Duration: 00:00';
    }
}

// Start call timer when call is active
peerConnection?.addEventListener('track', () => {
    startCallTimer();
    hideWaitingMessage();
});

// Show/Hide Loading Spinner
function showLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'block';
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'none';
}

// Show/Hide Waiting Message
function showWaitingMessage() {
    const waiting = document.getElementById('waiting');
    if (waiting) waiting.style.display = 'block';
}

function hideWaitingMessage() {
    const waiting = document.getElementById('waiting');
    if (waiting) waiting.style.display = 'none';
}

// Show caller's name when video is picked up
function displayCallerName(callerName) {
    const callerNameElement = document.getElementById('caller-name');
    if (callerNameElement) {
        callerNameElement.textContent = `Caller: ${callerName}`;
        callerNameElement.style.display = 'block';
    }
}

// Socket event for when a call is picked up
socket.on('callPickedUp', ({ userName }) => {
    displayCallerName(userName);
    hideWaitingMessage();
});

// Socket event for when the call ends
socket.on('callEnded', ({ userName }) => {
    alert(`${userName} has ended the call.`);
    endCall();
    stopCallTimer();
    showWaitingMessage();
});

// Update user status when connected
socket.on('statusUpdated', (status) => {
    if (status === 'online') {
        document.getElementById('status').innerText = 'Online';
        document.getElementById('status').classList.add('online');
        document.getElementById('status').classList.remove('offline');
    } else {
        document.getElementById('status').innerText = 'Offline';
        document.getElementById('status').classList.add('offline');
        document.getElementById('status').classList.remove('online');
    }
});
