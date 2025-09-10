function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.remove('d-none');
    document.getElementById('starter').classList.add('d-none')
    document.getElementById('Starttitle').classList.add('d-none')
    document.getElementById('serverList').classList.remove('d-none')
    loadingScreen.style.display = 'flex';

    const duration = 1500; // 1.5 seconds

    setTimeout(() => {
        loadingScreen.classList.add('d-none');
        loadingScreen.style.display = 'none';
    }, duration);
}

// Example: Show loading screen when Start button is clicked
document.getElementById('starter').addEventListener('click', showLoadingScreen);

function startGame() {
    // Remove/hide all other elements
    document.querySelectorAll('body > *:not(#gameSplash)').forEach(el => {
        if (el.id !== 'gameSplash') el.style.display = 'none';
    });

    // Create splash screen canvas if not already present
    let splash = document.getElementById('gameSplash');
    if (!splash) {
        splash = document.createElement('canvas');
        splash.id = 'gameSplash';
        splash.style.position = 'fixed';
        splash.style.top = '0';
        splash.style.left = '0';
        splash.style.width = '100vw';
        splash.style.height = '100vh';
        splash.width = window.innerWidth;
        splash.height = window.innerHeight;
        splash.style.zIndex = '9999';
        document.body.appendChild(splash);
    } else {
        splash.style.display = 'block';
        splash.width = window.innerWidth;
        splash.height = window.innerHeight;
    }

    const ctx = splash.getContext('2d');

    // Load the island image
    const img = new Image();
    img.src = 'island.jpg';

    // Grid and player settings
    const mapWidth = 40;
    const mapHeight = 30;

    // Keep grid size fixed (e.g. 10x10 cells visible)
    const cellsToShowX = 10;
    const cellsToShowY = 10;
    const gridSizeX = splash.width / cellsToShowX;
    const gridSizeY = splash.height / cellsToShowY;

    let player = { x: Math.floor(mapWidth / 2), y: Math.floor(mapHeight / 2) };
    let animating = false;
    let target = { x: player.x, y: player.y };
    const playerColor = '#e74c3c';

    // For smooth camera movement
    let camera = { x: player.x, y: player.y };
    let cameraTarget = { x: player.x, y: player.y };

    function draw(px, py, camX, camY) {
        ctx.clearRect(0, 0, splash.width, splash.height);

        // Calculate top-left cell to show (center on player)
        let startX = Math.max(0, Math.min(mapWidth - cellsToShowX, Math.round(camX - cellsToShowX / 2)));
        let startY = Math.max(0, Math.min(mapHeight - cellsToShowY, Math.round(camY - cellsToShowY / 2)));

        // Draw island image as background, only the relevant part
        if (img.complete && img.naturalWidth) {
            // Calculate source rectangle in image
            const srcX = (startX / mapWidth) * img.width;
            const srcY = (startY / mapHeight) * img.height;
            const srcW = (cellsToShowX / mapWidth) * img.width;
            const srcH = (cellsToShowY / mapHeight) * img.height;
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, splash.width, splash.height);
        }

        // Draw grid
        ctx.strokeStyle = '#bbb';
        ctx.lineWidth = 2;
        for (let x = 0; x < cellsToShowX; x++) {
            for (let y = 0; y < cellsToShowY; y++) {
                ctx.strokeRect(
                    x * gridSizeX,
                    y * gridSizeY,
                    gridSizeX,
                    gridSizeY
                );
            }
        }

        // Draw player (relative to visible grid)
        ctx.save();
        ctx.shadowColor = '#222';
        ctx.shadowBlur = 16;
        ctx.fillStyle = playerColor;
        const relX = px - startX;
        const relY = py - startY;
        ctx.fillRect(
            relX * gridSizeX + 8,
            relY * gridSizeY + 8,
            gridSizeX - 16,
            gridSizeY - 16
        );
        ctx.restore();
    }

    // Wait for image to load before drawing
    img.onload = function() {
        draw(player.x, player.y, camera.x, camera.y);
    };

    // Smoothly animate camera to follow player
    function animateCamera() {
        camera.x += (cameraTarget.x - camera.x) * 0.18;
        camera.y += (cameraTarget.y - camera.y) * 0.18;

        if (Math.abs(camera.x - cameraTarget.x) < 0.01 && Math.abs(camera.y - cameraTarget.y) < 0.01) {
            camera.x = cameraTarget.x;
            camera.y = cameraTarget.y;
        }

        draw(player.x, player.y, camera.x, camera.y);

        if (camera.x !== cameraTarget.x || camera.y !== cameraTarget.y) {
            requestAnimationFrame(animateCamera);
        }
    }

    // Movement
    document.addEventListener('keydown', function handleMove(e) {
        if (animating) return;
        let dx = 0, dy = 0;
        switch (e.key.toLowerCase()) {
            case 'w': case 'arrowup': dy = -1; break;
            case 's': case 'arrowdown': dy = 1; break;
            case 'a': case 'arrowleft': dx = -1; break;
            case 'd': case 'arrowright': dx = 1; break;
            case 'q': dx = -1; dy = -1; break;
            case 'e': dx = 1; dy = -1; break;
            case 'z': dx = -1; dy = 1; break;
            case 'c': dx = 1; dy = 1; break;
            default: return;
        }
        const nx = Math.max(0, Math.min(mapWidth - 1, player.x + dx));
        const ny = Math.max(0, Math.min(mapHeight - 1, player.y + dy));
        if (nx === player.x && ny === player.y) return;

        target = { x: nx, y: ny };
        animating = true;
        const duration = 220;
        const startTime = performance.now();
        const startX = player.x, startY = player.y;

        cameraTarget.x = nx;
        cameraTarget.y = ny;
        requestAnimationFrame(animateCamera);

        function animate(now) {
            const t = Math.min(1, (now - startTime) / duration);
            const px = startX + (target.x - startX) * t;
            const py = startY + (target.y - startY) * t;
            draw(px, py, camera.x, camera.y);
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                player.x = target.x;
                player.y = target.y;
                draw(player.x, player.y, camera.x, camera.y);
                animating = false;
            }
        }
        requestAnimationFrame(animate);
    }, { once: false });
}

// Attach event listener to the "explore" button
document.getElementById('explore').addEventListener('click', startGame);
