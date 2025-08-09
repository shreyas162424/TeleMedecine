/**
 * Extract appointment_id and username from URL query parameters
 */
const urlParams = new URLSearchParams(window.location.search);
const appointmentId = urlParams.get('appointment_id')?.trim();
let username = urlParams.get('username')?.trim() || `User-${Math.floor(Math.random() * 100000)}`;

/**
 * Validate URL parameters
 */
if (!appointmentId) {
    alert('Error: Missing required URL parameter (appointment_id). Please check the redirection URL.');
    throw new Error('Missing appointment_id');
}

const password = "x";
const userNameEl = document.querySelector('#user-name');
if (userNameEl) {
    userNameEl.innerHTML = username;
} else {
    console.warn('User name element (#user-name) not found in DOM');
}

/**
 * Connect to socket.io server
 */
let socket;
try {
    socket = io.connect('https://192.168.110.177:8181/', {
        auth: {
            username,
            password,
            appointmentId
        }
    });
} catch (err) {
    console.error('Socket.io connection failed:', err);
    alert('Failed to connect to the server. Please try again later.');
}

/**
 * DOM elements
 */
const localVideoEl = document.querySelector('#local-video');
const remoteVideoEl = document.querySelector('#remote-video');
const durationEl = document.querySelector('#call-duration');

let localStream;
let remoteStream;
let peerConnection;
let didIOffer = false;
let callStartTime = null;
let durationInterval = null;

const peerConfiguration = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302'
            ]
        }
    ]
};

/**
 * Format duration in MM:SS
 */
const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Start call duration timer
 */
const startCallDuration = () => {
    callStartTime = Date.now();
    durationEl.textContent = '00:00';
    durationInterval = setInterval(() => {
        const duration = (Date.now() - callStartTime) / 1000;
        durationEl.textContent = formatDuration(duration);
    }, 1000);
};

/**
 * Stop call duration timer and return duration in seconds
 */
const stopCallDuration = () => {
    if (durationInterval) {
        clearInterval(durationInterval);
        durationInterval = null;
    }
    if (callStartTime) {
        const duration = (Date.now() - callStartTime) / 1000;
        callStartTime = null;
        durationEl.textContent = formatDuration(duration);
        return duration;
    }
    return 0;
};

/**
 * Initiate a call
 */
const call = async () => {
    await fetchUserMedia();
    await createPeerConnection();
    try {
        console.log("Creating offer...");
        showWaitingMessage();
        const offer = await peerConnection.createOffer();
        console.log(offer);
        peerConnection.setLocalDescription(offer);
        didIOffer = true;
        socket.emit('newOffer', offer);
    } catch (err) {
        console.error('Error creating offer:', err);
    }
};

const answerOffer = async (offerObj) => {
    await fetchUserMedia();
    await createPeerConnection(offerObj);
    const answer = await peerConnection.createAnswer({});
    await peerConnection.setLocalDescription(answer);
    console.log(offerObj);
    console.log(answer);
    offerObj.answer = answer;
    const offerIceCandidates = await socket.emitWithAck('newAnswer', offerObj);
    offerIceCandidates.forEach(c => {
        peerConnection.addIceCandidate(c);
        console.log("======Added ICE Candidate======");
    });
    console.log(offerIceCandidates);
};

const addAnswer = async (offerObj) => {
    await peerConnection.setRemoteDescription(offerObj.answer);
};

const fetchUserMedia = () => {
    return new Promise(async (resolve, reject) => {
        try {
            showLoadingSpinner();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 15 }
                },
                audio: {
                    noiseSuppression: { ideal: true },
                    echoCancellation: { ideal: true },
                    autoGainControl: { ideal: true },
                    sampleRate: { ideal: 48000 },
                    channelCount: { ideal: 1 },
                    latency: { ideal: 0.01 },
                    googEchoCancellation: { ideal: true },
                    googAutoGainControl: { ideal: true },
                    googNoiseSuppression: { ideal: true }
                }
            });
            localVideoEl.srcObject = stream;
            localStream = stream;
            localVideoEl.muted = true;
            console.log('Local audio tracks:', localStream.getAudioTracks());
            hideLoadingSpinner();
            resolve();
        } catch (err) {
            console.error('Error accessing media devices:', err);
            hideLoadingSpinner();
            reject(err);
        }
    });
};

const createPeerConnection = (offerObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            peerConnection = new RTCPeerConnection(peerConfiguration);
            remoteStream = new MediaStream();
            remoteVideoEl.srcObject = remoteStream;

            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
                console.log(`Added track: ${track.kind} (id: ${track.id})`);
            });

            peerConnection.addEventListener("signalingstatechange", (event) => {
                console.log('Signaling state:', peerConnection.signalingState);
            });

            peerConnection.addEventListener('icecandidate', e => {
                console.log('ICE candidate found:', e.candidate);
                if (e.candidate) {
                    socket.emit('sendIceCandidateToSignalingServer', {
                        iceCandidate: e.candidate,
                        iceUserName: username,
                        didIOffer
                    });
                }
            });

            peerConnection.addEventListener('iceconnectionstatechange', () => {
                console.log('ICE connection state:', peerConnection.iceConnectionState);
                if (peerConnection.iceConnectionState === 'connected') {
                    hideWaitingMessage();
                    enableSendFileButton();
                    startCallDuration();
                }
                if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'disconnected') {
                    console.warn('ICE connection failed or disconnected');
                    const duration = stopCallDuration();
                    socket.emit('callEnded', { username, duration });
                    disableSendFileButton();
                }
            });

            peerConnection.addEventListener('track', e => {
                console.log("Received remote track:", e);
                if (e.streams[0].id !== localStream.id) {
                    remoteStream = e.streams[0];
                    remoteVideoEl.srcObject = remoteStream;
                    remoteVideoEl.muted = false;
                    console.log("Assigned remote stream to remote-video, audio tracks:", remoteStream.getAudioTracks());
                    hideWaitingMessage();
                } else {
                    console.log("Skipped own stream:", e.streams[0].id);
                }
            });

            if (offerObj) {
                await peerConnection.setRemoteDescription(offerObj.offer);
            }

            createDataChannel(peerConnection, offerObj ? offerObj.offererUserName : username);

            resolve();
        } catch (err) {
            console.error('Error creating peer connection:', err);
     reject(err);
        }
    });
};

const addNewIceCandidate = iceCandidate => {
    peerConnection.addIceCandidate(iceCandidate)
        .then(() => console.log("Added ICE candidate"))
        .catch(err => console.error('Error adding ICE candidate:', err));
};

/**
 * Handle call end event
 */
socket.on('callEnded', ({ username: endedUser, duration }) => {
    console.log(`Call ended by ${endedUser}, duration: ${formatDuration(duration)}`);
    const finalDuration = stopCallDuration();
    durationEl.textContent = formatDuration(finalDuration);
});

/**
 * Event listeners
 */
document.querySelector('#call').addEventListener('click', call);

document.addEventListener('DOMContentLoaded', () => {
    disableSendFileButton();
    if (durationEl) {
        durationEl.textContent = '00:00';
    }
});