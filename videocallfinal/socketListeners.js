socket.on('availableOffers', offers => {
    console.log('Received availableOffers:', offers);
    // Automatically answer the first valid offer (should be from the other participant)
    const validOffer = offers.find(o => o.offererUserName !== username);
    if (validOffer) {
        console.log('Auto-answering offer from:', validOffer.offererUserName);
        answerOffer(validOffer);
    }
});

socket.on('newOfferAwaiting', offers => {
    console.log('Received newOfferAwaiting:', offers);
    // Automatically answer the first valid offer
    const validOffer = offers.find(o => o.offererUserName !== username);
    if (validOffer) {
        console.log('Auto-answering offer from:', validOffer.offererUserName);
        answerOffer(validOffer);
    }
});

socket.on('answerResponse', offerObj => {
    console.log('Received answerResponse:', offerObj);
    addAnswer(offerObj);
    hideWaitingMessage();
});

socket.on('receivedIceCandidateFromServer', iceCandidate => {
    console.log('Received ICE candidate:', iceCandidate);
    addNewIceCandidate(iceCandidate);
});

socket.on('userStatus', ({ username, status }) => {
    console.log(`User ${username} is ${status}`);
    // Update UI to reflect the other participant's status
    const statusEl = document.querySelector('#participant-status');
    if (statusEl && username !== username) {
        statusEl.innerHTML = `${username} is ${status}`;
    }
});

// Emit a status update when the user is connected
socket.emit('statusUpdate', 'online');