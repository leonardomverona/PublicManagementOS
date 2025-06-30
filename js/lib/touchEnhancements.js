window.addEventListener('load', () => {
    // This needs to be delegated since windows are created dynamically
    document.body.addEventListener('pointerdown', e => {
        const titleBar = e.target.closest('.title-bar');
        if (titleBar) {
            handleTitleBarPointerDown(e, titleBar);
        }
        const resizeHandle = e.target.closest('.resize-handle');
        if (resizeHandle) {
            handleResizeHandlePointerDown(e, resizeHandle);
        }
    });
});

function handleTitleBarPointerDown(e, titleBar) {
    const win = titleBar.closest('.window');
    if (!win || e.button !== 0) return;
    
    titleBar.style.touchAction = 'none';
    let dragging = false, startX, startY, origX, origY;
    let lastMoves = [], lastTime = 0;
    
    // Double-tap detection
    const now = Date.now();
    const lastTap = parseFloat(titleBar.dataset.lastTap || 0);
    if (now - lastTap < 300) {
        if (win.classList.contains('maximized')) {
            window.windowManager.maximizeWindow(win.id); // Use manager to restore
        } else {
            window.windowManager.maximizeWindow(win.id); // Use manager to maximize
        }
    }
    titleBar.dataset.lastTap = now;

    // Start dragging
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = win.getBoundingClientRect();
    origX = rect.left;
    origY = rect.top;
    lastMoves = [];
    lastTime = now;
    win.classList.add('dragging');
    titleBar.setPointerCapture(e.pointerId);

    const onPointerMove = (moveEvent) => {
        if (!dragging) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        win.style.left = `${origX + dx}px`;
        win.style.top = `${origY + dy}px`;
        
        const now = Date.now();
        lastMoves.push({ dx: moveEvent.clientX, dy: moveEvent.clientY, t: now });
        if (lastMoves.length > 5) lastMoves.shift();
    };

    const onPointerUp = (upEvent) => {
        if (!dragging) return;
        dragging = false;
        win.classList.remove('dragging');
        titleBar.releasePointerCapture(e.pointerId);
        
        // Cleanup listeners
        titleBar.removeEventListener('pointermove', onPointerMove);
        titleBar.removeEventListener('pointerup', onPointerUp);
        titleBar.removeEventListener('pointercancel', onPointerUp);
    };

    titleBar.addEventListener('pointermove', onPointerMove);
    titleBar.addEventListener('pointerup', onPointerUp);
    titleBar.addEventListener('pointercancel', onPointerUp);
}


function handleResizeHandlePointerDown(e, resizeHandle) {
    const win = resizeHandle.closest('.window');
    if (!win || e.button !== 0) return;

    resizeHandle.style.touchAction = 'none';
    let resizing = false, startX, startY, origW, origH;

    resizing = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = win.getBoundingClientRect();
    origW = rect.width;
    origH = rect.height;
    win.classList.add('resizing');
    resizeHandle.setPointerCapture(e.pointerId);

    const onPointerMove = (moveEvent) => {
        if (!resizing) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        let newW = origW + dx;
        let newH = origH + dy;
        newW = Math.max(newW, 200);
        newH = Math.max(newH, 150);
        win.style.width = `${newW}px`;
        win.style.height = `${newH}px`;
    };

    const onPointerUp = () => {
        if (!resizing) return;
        resizing = false;
        win.classList.remove('resizing');
        resizeHandle.releasePointerCapture(e.pointerId);
        
        // Cleanup
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
}