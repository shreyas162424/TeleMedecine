const fs = require('fs');
const https = require('https');
const express = require('express');
const app = express();
const socketio = require('socket.io');
app.use(express.static(__dirname));

// SSL certificates
const key = fs.readFileSync('cert.key');
const cert = fs.readFileSync('cert.crt');

const expressServer = https.createServer({ key, cert }, app);
const io = socketio(expressServer, {
    cors: {
        origin: [
            "https://localhost",
            '192.168.110.177'
        ],
        methods: ["GET", "POST"]
    }
});
expressServer.listen(8181);

const offers = [];
const connectedSockets = [];
const rooms = {};

io.on('connection', (socket) => {
    const username = socket.handshake.auth.username;
    const password = socket.handshake.auth.password;
    const appointmentId = socket.handshake.auth.appointmentId;

    // Validate authentication
    if (password !== "x") {
        console.error(`Connection rejected: Invalid password (username: ${username})`);
        socket.disconnect(true);
        return;
    }

    if (!appointmentId) {
        console.error(`Connection rejected: Missing appointmentId (username: ${username})`);
        socket.disconnect(true);
        return;
    }

    // Create a unique room ID for this appointment
    const roomId = `room_${appointmentId}`;
    
    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
        rooms[roomId] = [];
    }

    // Allow only two users per room
    if (rooms[roomId].length >= 2) {
        console.error(`Connection rejected: Room ${roomId} is full (username: ${username})`);
        socket.disconnect(true);
        return;
    }

    // Add to connected sockets and room
    connectedSockets.push({
        socketId: socket.id,
        username,
        roomId
    });

    rooms[roomId].push({ socketId: socket.id, username });
    socket.join(roomId);

    io.to(roomId).emit('userStatus', { username, status: 'Online' });

    // Send existing offers in the room to the new socket
    const roomOffers = offers.filter(o => o.roomId === roomId);
    if (roomOffers.length) {
        socket.emit('availableOffers', roomOffers);
    }

    socket.on('disconnect', () => {
        io.to(roomId).emit('userStatus', { username, status: 'Offline' });
        connectedSockets.splice(connectedSockets.findIndex(s => s.socketId === socket.id), 1);
        rooms[roomId] = rooms[roomId].filter(s => s.socketId !== socket.id);
        if (rooms[roomId].length === 0) {
            delete rooms[roomId];
            offers.splice(0, offers.length, ...offers.filter(o => o.roomId !== roomId));
        }
        io.to(roomId).emit('callEnded', { username, duration: 0 });
    });

    socket.on('newOffer', (newOffer) => {
        const offerObj = {
            offererUserName: username,
            offer: newOffer,
            offerIceCandidates: [],
            answererUserName: null,
            answer: null,
            answererIceCandidates: [],
            roomId
        };
        console.log('New offer created:', offerObj);
        console.log('Offer SDP audio:', newOffer.sdp.includes('m=audio') ? 'Present' : 'Missing');
        offers.push(offerObj);
        socket.to(roomId).emit('newOfferAwaiting', [offerObj]);
    });

    socket.on('newAnswer', (offerObj, ackFunction) => {
        console.log('Received newAnswer:', offerObj);
        console.log('Answer SDP audio:', offerObj.answer.sdp.includes('m=audio') ? 'Present' : 'Missing');
        if (offerObj.roomId !== roomId) {
            console.log("Answer for wrong room");
            return;
        }
        const socketToAnswer = connectedSockets.find(s => s.username === offerObj.offererUserName && s.roomId === roomId);
        if (!socketToAnswer) {
            console.log("No matching socket for answer");
            return;
        }
        const socketIdToAnswer = socketToAnswer.socketId;
        const offerToUpdate = offers.find(o => o.offererUserName === offerObj.offererUserName && o.roomId === roomId);
        if (!offerToUpdate) {
            console.log("No OfferToUpdate");
            return;
        }
        ackFunction(offerToUpdate.offerIceCandidates);
        offerToUpdate.answer = offerObj.answer;
        offerToUpdate.answererUserName = username;
        socket.to(socketIdToAnswer).emit('answerResponse', offerToUpdate);
    });

    socket.on('sendIceCandidateToSignalingServer', iceCandidateObj => {
        const { didIOffer, iceUserName, iceCandidate } = iceCandidateObj;
        console.log(`Received ICE candidate from ${iceUserName} (didIOffer: ${didIOffer})`);
        const offerInOffers = offers.find(o => (didIOffer ? o.offererUserName : o.answererUserName) === iceUserName && o.roomId === roomId);
        if (offerInOffers) {
            if (didIOffer) {
                offerInOffers.offerIceCandidates.push(iceCandidate);
                if (offerInOffers.answererUserName) {
                    const socketToSendTo = connectedSockets.find(s => s.username === offerInOffers.answererUserName && s.roomId === roomId);
                    if (socketToSendTo) {
                        socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate);
                        console.log(`Sent ICE candidate to ${offerInOffers.answererUserName}`);
                    }
                }
            } else {
                offerInOffers.answererIceCandidates.push(iceCandidate);
                const socketToSendTo = connectedSockets.find(s => s.username === offerInOffers.offererUserName && s.roomId === roomId);
                if (socketToSendTo) {
                    socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate);
                    console.log(`Sent ICE candidate to ${offerInOffers.offererUserName}`);
                }
            }
        } else {
            console.warn(`No matching offer found for ICE candidate from ${iceUserName}`);
        }
    });

    socket.on('chatMessage', ({ username, message }) => {
        io.to(roomId).emit('chatMessage', { username, message });
    });

    socket.on('callEnded', ({ username, duration }) => {
        console.log(`Call ended by ${username}, duration: ${duration} seconds`);
        socket.to(roomId).emitPREFIX('callEnded', { username, duration });
    });
});