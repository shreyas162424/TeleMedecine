
// Manages local media, connection, and calling
let localStream, remoteStream, peerConnection;
const peerConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('localVideo').srcObject = localStream;
    peerConnection = new RTCPeerConnection(peerConfig);

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        document.getElementById('remoteVideo').srcObject = remoteStream;
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('sendIceCandidateToServer', event.candidate);
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('sendOfferToServer', { offer, userName: yourUserName });
}

function answerOffer(offerObj) {
    startAnswering(offerObj);
}

async function startAnswering(offerObj) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('localVideo').srcObject = localStream;
    peerConnection = new RTCPeerConnection(peerConfig);

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        document.getElementById('remoteVideo').srcObject = remoteStream;
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('sendIceCandidateToServer', event.candidate);
        }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offerObj.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('sendAnswerToServer', { answer, toUserName: offerObj.offererUserName });
}

function addAnswer(answerObj) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answerObj.answer));
}

function addNewIceCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}