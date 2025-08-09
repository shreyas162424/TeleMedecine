// group.js
const peerConnections = {};
let roomId = null;

async function joinRoom() {
    roomId = prompt('Enter Room ID:');
    if (!roomId) {
        alert('Room ID is required.');
        return;
    }
    socket.emit('joinRoom', { roomId, userName });
    await fetchUserMedia();
    peerConnections[userName] = await createPeerConnection();
}

socket.on('newOfferAwaiting', async (offers) => {
    for (const offerObj of offers) {
        if (offerObj.roomId === roomId && offerObj.offererUserName !== userName) {
            await answerOffer(offerObj);
        }
    }
});

async function createPeerConnection(offerObj = null, targetUserName = null) {
    const pc = new RTCPeerConnection(peerConfiguration);
    const key = targetUserName || (offerObj ? offerObj.offererUserName : userName);
    peerConnections[key] = pc;

    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
        console.log(`Group call: Added track: ${track.kind} (id: ${track.id})`);
    });

    pc.ontrack = (event) => {
        console.log('Group call: Received remote track for', key, event);
        if (event.streams[0].id !== localStream.id) {
            const remoteVideo = document.createElement('video');
            remoteVideo.classList.add('video-player');
            remoteVideo.autoplay = true;
            remoteVideo.playsinline = true;
            remoteVideo.srcObject = event.streams[0];
            remoteVideo.id = `remote-video-${key}`;
            remoteVideo.muted = false;
            document.getElementById('videos').appendChild(remoteVideo);
            console.log('Group call: Assigned remote stream, audio tracks:', event.streams[0].getAudioTracks());
            hideWaitingMessage();
        } else {
            console.log('Group call: Skipped own stream:', event.streams[0].id);
        }
    };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Group call: Sending ICE candidate for', key);
            socket.emit('sendIceCandidateToSignalingServer', {
                iceCandidate: event.candidate,
                iceUserName: userName,
                didIOffer: !offerObj,
                roomId,
            });
        }
    };

    pc.oniceconnectionstatechange = () => {
        console.log(`Group call: ICE connection state for ${key}: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'connected') {
            hideWaitingMessage();
            enableSendFileButton();
        }
        if (pc.iceConnectionState === 'failed') {
            pc.restartIce();
            disableSendFileButton();
        }
    };

    // Create data channel for group calls
    createDataChannel(pc, key);

    if (offerObj) {
        await pc.setRemoteDescription(offerObj.offer);
    }

    return pc;
}

// Override call function to support group calling
const originalCall = call;
call = async () => {
    await joinRoom();
    const offer = await peerConnections[userName].createOffer();
    await peerConnections[userName].setLocalDescription(offer);
    socket.emit('newOffer', offer, roomId);
};

// Update answerOffer to use peerConnections
const originalAnswerOffer = answerOffer;
answerOffer = async (offerObj) => {
    await fetchUserMedia();
    const pc = await createPeerConnection(offerObj);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    offerObj.answer = answer;
    const offerIceCandidates = await socket.emitWithAck('newAnswer', offerObj);
    offerIceCandidates.forEach(c => {
        pc.addIceCandidate(c);
        console.log("Group call: Added ICE candidate");
    });
};

// Update addAnswer to use peerConnections
const originalAddAnswer = addAnswer;
addAnswer = async (offerObj) => {
    const pc = peerConnections[offerObj.offererUserName];
    if (pc) {
        await pc.setRemoteDescription(offerObj.answer);
    }
};