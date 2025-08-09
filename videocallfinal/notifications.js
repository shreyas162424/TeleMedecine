// notifications.js
async function requestNotificationPermission() {
    if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
    }
}

socket.on('newOfferAwaiting', (offers) => {
    if (Notification.permission === 'granted') {
        offers.forEach((o) => {
            new Notification(`New Call from ${o.offererUserName}`, {
                body: 'Click to answer the call.',
            });
        });
    }
});

requestNotificationPermission();