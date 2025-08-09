// filters.js
const video = document.getElementById('local-video');
const canvas = document.getElementById('filter-canvas');
const ctx = canvas.getContext('2d');
let filterEnabled = false;
let tracker = null;

document.getElementById('toggle-filter').addEventListener('click', () => {
    filterEnabled = !filterEnabled;
    canvas.style.display = filterEnabled ? 'block' : 'none';
    if (filterEnabled) {
        startFilter();
    } else {
        stopFilter();
    }
});

function startFilter() {
    if (!video.videoWidth || !video.videoHeight) {
        console.error('Video dimensions not available. Ensure video is playing.');
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Ensure canvas is positioned over the video
    canvas.style.left = `${video.offsetLeft}px`;
    canvas.style.top = `${video.offsetTop}px`;

    if (!window.tracking) {
        console.error('tracking.js not loaded. Please check the script tag.');
        return;
    }

    tracker = new tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);

    tracking.track('#local-video', tracker);
    tracker.on('track', (event) => {
        if (!filterEnabled) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        event.data.forEach((rect) => {
            // Draw sunglasses (simplified as rectangles)
            ctx.fillStyle = 'black';
            ctx.fillRect(rect.x + rect.width * 0.2, rect.y + rect.height * 0.3, rect.width * 0.6, rect.height * 0.2);
        });
    });

    // Continuous rendering loop
    function renderLoop() {
        if (filterEnabled) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(renderLoop);
        }
    }
    renderLoop();
}

function stopFilter() {
    if (tracker) {
        tracker.removeAllListeners();
        tracker = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}