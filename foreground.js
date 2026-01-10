/**
 * MODULE: FOREGROUND
 * Responsibility: Static ground, grass tiles, brick obstacles, floor hazards, moving elevators, 
 * Game Timer, the Level End Portal, and the required Level Star.
 */
class Foreground {
    constructor(level = 1) {
        this.tileSize = 16;
        this.groundY = 224 - 32;
        this.portalX = 3200;
        this.levelWidth = this.portalX + (CANVAS_WIDTH / 2);

        this.platforms = [];
        this.groundHazards = [];
        this.elevators = [];
        this.coins = [];
        this.level = level;
        this.checkpointTextTimer = 0;
        this.timeLeft = 60;
        this.timerStarted = false;
        this.lastTick = 0;
        this.key = { x: 0, y: 0, vx: 0, vy: 0, dropped: false, collected: false };
        this.hasKey = false;
        this.portalLocked = true;
        this.bow = { x: this.portalX - 175, y: this.groundY - 20, collected: false }; //bow location

        this.portal = {
            x: this.portalX,
            y: this.groundY - 48,
            radius: 32,
            rotation: 0
        };

        this.hasStar = false;
        this.star = null;
        this.clock = null;
        this.activeFlag = null;

        this.brickColors = { main: '#bc4a24', shadow: '#541800', highlight: '#f8b800' };
        this.elevatorColors = {
            main: '#9ca3af',    // Medium stone grey
            shadow: '#4b5563',  // Darker shadow
            highlight: '#d1d5db' // Light grey highlight
        };
        this.groundColors = { grass: '#48a048', dirt: '#885010', oil: '#202020', ice: '#a0d8f8', quicksand: '#d4a373' };

        this.setTheme();
        this.init();
        this.setupInput();
    }

    resetTimer() {
        this.timeLeft = 60;
        const timerElement = document.getElementById('timer-display');
        if (timerElement) {
            timerElement.innerText = `TIME: ${this.timeLeft}`;
            timerElement.style.color = "white";
        }
    }

    setTheme() {
        if (this.level === 2) {
            this.groundColors.grass = '#0058f8';
            this.groundColors.dirt = '#000000';
        } else {
            this.groundColors.grass = '#48a048';
            this.groundColors.dirt = '#885010';
        }
    }

    dropKey(x, y, birdDir) {
        // FORCE the key to spawn in front of the portal, regardless of where the bird is
        // We place it 100 pixels to the left of the portal
        this.key.x = this.portalX - 100;

        // We set the height to be high in the air so it "falls" into view
        this.key.y = this.groundY - 100;

        this.key.vy = -2; // Upward pop

        // Force the horizontal momentum to the LEFT (towards the player)
        this.key.vx = -1.5;

        this.key.dropped = true;
    }

    updateKey(player) {
        // 1. STAR COLLECTION LOGIC (For Levels 2 & 3)
        if (this.star) {
            const sdx = (player.x + player.width / 2) - this.star.x;
            const sdy = (player.y + player.height / 2) - this.star.y;
            if (Math.sqrt(sdx * sdx + sdy * sdy) < 15) {
                this.star = null;
                this.hasStar = true; // For portal logic
                this.hasKey = true;  // FOR SHOOTING LOGIC
                const levelDisp = document.getElementById('level-display');
                if (levelDisp && !levelDisp.innerText.includes("🏹")) {
                    levelDisp.innerText += " 🏹"; // Show an arrow icon
                }
            }
        }

        // 2. KEY LOGIC (For Level 1)
        // If no key exists or it's already picked up, exit immediately
        if (!this.key.dropped || this.key.collected) return;

        // PHYSICS: Make the key fall to the ground
        if (this.key.y < this.groundY - 10) {
            this.key.vy += 0.2; // Gravity
            this.key.y += this.key.vy;
            this.key.x += this.key.vx; // Horizontal momentum from bird

            // SAFETY: If the key ever goes too far right, stop it 50px before the portal
            if (this.key.x > this.portalX - 50) {
                this.key.x = this.portalX - 50;
                this.key.vx = 0;
            }


            this.key.vx *= 0.98; // Friction
        } else {
            this.key.vy = 0;
            this.key.vx = 0;
            this.key.y = this.groundY - 10;
        }

        // PICKUP DETECTION: Check distance between player and key
        const kdx = (player.x + player.width / 2) - this.key.x;
        const kdy = (player.y + player.height / 2) - this.key.y;
        const kDist = Math.sqrt(kdx * kdx + kdy * kdy);

        if (kDist < 15) {
            // SET THIS FIRST: This stops the function from running again next frame
            this.key.collected = true;
            this.hasKey = true;
            this.portalLocked = false; // Start portal spinning

            // RESTORE GUN: Remove bow and give bullets
            player.hasBow = false;
            player.bullets = 10;
            player.updateUI();

            const levelDisp = document.getElementById('level-display');
            // Prevent infinite string appending (the crash fix)
            if (levelDisp && !levelDisp.innerText.includes("🔑")) {
                levelDisp.innerText += " 🔑";
            }
        }
    }


    init() {
        let x = 200;
        const groundOccupiedX = [];
        // The screen is 256px wide. We stop everything before the last 256px.
        const lastScreenStart = this.portalX - CANVAS_WIDTH;

        while (x < lastScreenStart - 40) {
            const structureType = Math.floor(Math.random() * 4);
            let structureWidth = 0;
            switch (structureType) {
                case 0:
                    const floatWidth = 3 + Math.floor(Math.random() * 4);
                    const floatHeight = 60 + Math.floor(Math.random() * 60);
                    for (let col = 0; col < floatWidth; col++) {
                        this.platforms.push({ x: x + (col * 16), y: this.groundY - floatHeight, w: 1, h: 1, hasClock: false, isSecret: false, isCheckpointCandidate: false });
                    }
                    structureWidth = floatWidth * this.tileSize;
                    break;
                case 1:
                    const steps = 3 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < steps; i++) {
                        for (let j = 0; j <= i; j++) {
                            this.platforms.push({ x: x + (i * this.tileSize), y: this.groundY - ((j + 1) * this.tileSize), w: 1, h: 1, hasClock: false, isSecret: false, isCheckpointCandidate: false });
                            this.platforms.push({ x: x + ((steps * 2 - i - 1) * this.tileSize), y: this.groundY - ((j + 1) * this.tileSize), w: 1, h: 1, hasClock: false, isSecret: false, isCheckpointCandidate: false });
                        }
                    }
                    structureWidth = (steps * 2) * this.tileSize;
                    groundOccupiedX.push({ start: x, end: x + structureWidth });
                    break;
                case 2:
                    const towerHeight = 3 + Math.floor(Math.random() * 5);
                    for (let row = 0; row < towerHeight; row++) {
                        this.platforms.push({ x: x, y: this.groundY - ((row + 1) * this.tileSize), w: 1, h: 1, hasClock: false, isSecret: false, isCheckpointCandidate: false });
                        this.platforms.push({ x: x + 16, y: this.groundY - ((row + 1) * this.tileSize), w: 1, h: 1, hasClock: false, isSecret: false, isCheckpointCandidate: false });
                    }
                    structureWidth = 2 * this.tileSize;
                    groundOccupiedX.push({ start: x, end: x + structureWidth });
                    break;
                case 3:
                    const longWidth = 6 + Math.floor(Math.random() * 8);
                    for (let col = 0; col < longWidth; col++) {
                        this.platforms.push({ x: x + (col * 16), y: this.groundY - (this.tileSize * 2), w: 1, h: 1, hasClock: false, isSecret: false, isCheckpointCandidate: false });
                    }
                    structureWidth = longWidth * this.tileSize;
                    break;
            }
            const gap = 80 + Math.random() * 180;
            if (gap > 120 && Math.random() > 0.4 && (x + structureWidth + gap) < lastScreenStart) {
                this.elevators.push({ x: x + structureWidth + (gap / 2) - 16, y: Math.random() * (this.groundY - 60) + 30, w: 32, h: 8, speed: 0.6 + Math.random() * 0.8, direction: Math.random() > 0.5 ? 1 : -1, topLimit: 20, bottomLimit: this.groundY - 12 });
            }
            x += structureWidth + gap;
        }

        const clockCandidates = this.platforms.filter(p => p.x > CANVAS_WIDTH && p.x < 2048);
        for (let i = 0; i < 3; i++) {
            if (clockCandidates.length > 0) {
                const idx = Math.floor(Math.random() * clockCandidates.length);
                const target = clockCandidates[idx]; // We define 'target' to make it easier
                target.hasClock = true;
                target.hasPulsed = false;
                target.visibleStartTime = null;
                target.pulseTriggered = false;
                clockCandidates.splice(idx, 1);
            }
        }

        const flyingCandidates = this.platforms.filter(p => {
            const isUnderneath = this.platforms.some(other => other.x === p.x && other.y < p.y);
            return !p.hasClock && p.x > 500 && !isUnderneath;
        });
        for (let i = 0; i < 3; i++) {
            if (flyingCandidates.length > 0) {
                const idx = Math.floor(Math.random() * flyingCandidates.length);
                const target = flyingCandidates[idx];
                target.isSecret = true;
                target.hasPulsed = false;
                target.visibleStartTime = null;
                target.pulseTriggered = false;
                target.state = 'idle';
                target.timer = 45;
                flyingCandidates.splice(idx, 1);
            }
        }

        const checkpointCandidates = this.platforms.filter(p => !p.hasClock && !p.isSecret && p.x > 400 && p.x < 2000);
        for (let i = 0; i < 3; i++) {
            if (checkpointCandidates.length > 0) {
                const idx = Math.floor(Math.random() * checkpointCandidates.length);
                const target = checkpointCandidates[idx];
                target.isCheckpointCandidate = true;
                target.hasPulsed = false;
                target.visibleStartTime = null;
                target.pulseTriggered = false;
                checkpointCandidates.splice(idx, 1);
            }
        }

        const starX = 768 + Math.random() * 1500;
        let starHighestY = this.groundY;
        this.platforms.forEach(p => { if (starX > p.x && starX < p.x + 16 && p.y < starHighestY) starHighestY = p.y; });
        this.star = { x: starX, y: starHighestY - 45 };

        // Stop hazards before the last screen
        for (let hx = 300; hx < lastScreenStart; hx += 150) {
            if (Math.random() > 0.4) {
                const hWidth = 24 + Math.random() * 48;
                const rand = Math.random();
                let hType;
                if (rand < 0.33) hType = 'oil';
                else if (rand < 0.66) hType = 'ice';
                else hType = 'quicksand';


                // Check if any platform above this hazard range is too low (less than 36px clearance)
                const hasLowBricks = this.platforms.some(p => {
                    const horizontalOverlap = (hx < p.x + 16 && hx + hWidth > p.x);
                    const verticalGap = this.groundY - (p.y + 16);
                    return horizontalOverlap && verticalGap < 36;
                });

                // Final check to make sure the width of the hazard doesn't enter the zone
                const overlaps = groundOccupiedX.some(range => (hx < range.end && hx + hWidth > range.start));
                if (!overlaps && !hasLowBricks && (hx + hWidth < lastScreenStart)) {
                    this.groundHazards.push({ x: hx, w: hWidth, type: hType });
                }
            }
        }

        let coinX = 350;
        while (coinX < this.portalX - 150) {
            let coinHighestY = this.groundY;
            this.platforms.forEach(p => { if (coinX > p.x && coinX < p.x + 16 && p.y < coinHighestY) coinHighestY = p.y; });
            this.coins.push({ x: coinX, y: coinHighestY - 25 });
            coinX += 150 + (Math.random() * 150);
        }
    }

    setupInput() {
        window.addEventListener('keydown', () => {
            if (!this.timerStarted) {
                this.timerStarted = true;
                this.lastTick = Date.now();
            }
        }, { once: true });
    }

    update(player) {

        // --- PROGRESS LOCK ---
        // If the key hasn't dropped yet, don't let the player pass the bow area
        const limitX = this.bow.x;
        if (!this.key.dropped && player.x > limitX) {
            player.x = limitX;
            player.velocityX = 0;
        }

        this.updateKey(player);



        if (!this.portalLocked) this.portal.rotation += 0.05;

        if (this.timerStarted && this.timeLeft > 0) {
            let now = Date.now();
            if (now - this.lastTick >= 1000) {
                this.timeLeft--;
                this.lastTick = now;
                const timerElement = document.getElementById('timer-display');
                if (timerElement) timerElement.innerText = `TIME: ${this.timeLeft}`;
            }
        }

        //BOW COLLECTED

        if (!this.bow.collected) {
            const dx = (player.x + player.width / 2) - this.bow.x;
            const dy = (player.y + player.height / 2) - this.bow.y;
            // We use a radius of 20 for detection
            if (Math.sqrt(dx * dx + dy * dy) < 20) {
                this.bow.collected = true;
                player.hasBow = true;
                player.bullets = 6;
                player.updateUI();
            }
        }

        const bossAlive = enemies.some(en => en.isBoss);
        this.portalX = bossAlive ? 99999 : 3200;

        this.elevators.forEach(e => {
            e.y += e.speed * e.direction;
            if (e.y <= e.topLimit) { e.y = e.topLimit; e.direction = 1; }
            else if (e.y >= e.bottomLimit) { e.y = e.bottomLimit; e.direction = -1; }
        });

        if (this.activeFlag && !this.activeFlag.collected) {
            const dx = (player.x + player.width / 2) - this.activeFlag.x;
            const dy = (player.y + player.height / 2) - (this.activeFlag.y + 14);
            if (Math.sqrt(dx * dx + dy * dy) < 25) {
                this.activeFlag.collected = true;
                globalCheckpoints[this.level] = { x: this.activeFlag.x, y: this.activeFlag.y + 16 };
                this.checkpointTextTimer = 90;
            }
        }

        for (let i = this.platforms.length - 1; i >= 0; i--) {
            let p = this.platforms[i];
            if (p.isSecret) {
                let onTop = (player.x + player.width > p.x && player.x < p.x + 16 && Math.abs((player.y + player.height) - p.y) < 5 && player.velocityY >= 0);
                if (onTop && p.state === 'idle') {
                    p.timer--; // Decrease the timer every frame the player is on top

                    // Visual feedback: Shake the brick slightly as the timer runs out
                    if (p.timer < 15) {
                        p.x += (Math.random() - 0.5) * 2;
                    }

                    if (p.timer <= 0) {
                        p.state = 'moving';
                        // Lock out other secret bricks as before
                        this.platforms.forEach(other => { if (other !== p) other.isSecret = false; });
                    }
                } else if (!onTop && p.state === 'idle') {
                    // Optional: Reset timer if player jumps off before it flies away
                    p.timer = 45;
                }
                if (p.state === 'moving') {
                    p.y -= 1.5;
                    if (onTop) player.y -= 1.5;
                    if (p.y <= 56) { p.y = 56; p.state = 'traveling'; p.startX = p.x; }
                } else if (p.state === 'traveling') {
                    p.x += 2.0;
                    if (onTop) player.x += 2.0;
                    if (p.x >= p.startX + 768) {
                        if (onTop) player.onGround = false;
                        this.platforms.splice(i, 1);
                    }
                }
            }
        }

        for (let i = this.groundHazards.length - 1; i >= 0; i--) {
            let h = this.groundHazards[i];
            if (h.life !== undefined) {
                h.life--;
                if (h.life <= 0) this.groundHazards.splice(i, 1);
            }
        }
    }

    drawBrick(ctx, x, y, isSecret, hasClock, isCheckpointCandidate, platformObj) {
        ctx.fillStyle = this.brickColors.main;
        let offsetY = 0;
        const isSpecial = isSecret || hasClock || isCheckpointCandidate;

        if (isSpecial && platformObj && !platformObj.hasPulsed) {

            // TRIGGER: Capture the time when the brick first appears on screen
            if (!platformObj.pulseTriggered && x > 0 && x < (CANVAS_WIDTH - 16)) {
                platformObj.pulseTriggered = true;
                platformObj.pulseStartTime = Date.now();
            }

            if (platformObj.pulseTriggered) {
                const elapsed = Date.now() - platformObj.pulseStartTime;

                // --- NEW DELAY LOGIC ---
                const delay = 600; // Brick waits 0.6 seconds after appearing before it moves

                if (elapsed > delay) {
                    const animationProgress = elapsed - delay; // Time spent actually animating

                    if (animationProgress < 500) {
                        // One smooth nudge up and down
                        offsetY = Math.sin(animationProgress * (Math.PI / 500)) * 1.5;
                    } else {
                        // Stop forever after the 0.5s animation finishes
                        platformObj.hasPulsed = true;
                    }
                }
                // -----------------------
            }
        }

        ctx.save();
        ctx.translate(0, offsetY);
        // Main Body
        ctx.fillRect(x, y, 16, 16);
        // Highlights
        ctx.fillStyle = this.brickColors.highlight;
        ctx.fillRect(x, y, 16, 1);
        ctx.fillRect(x, y, 1, 16);
        // Shadows
        ctx.fillStyle = this.brickColors.shadow;
        ctx.fillRect(x + 1, y + 15, 15, 1);
        ctx.fillRect(x + 15, y + 1, 1, 15);
        ctx.restore();
    }

    drawPortal(ctx, cameraX) {
        const screenX = this.portal.x - cameraX;
        if (screenX + 100 < 0 || screenX - 100 > CANVAS_WIDTH) return;
        ctx.save();
        ctx.translate(screenX, this.portal.y);
        ctx.beginPath();
        ctx.arc(0, 0, this.portal.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = '#8800ff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 60; i++) {
            const angle = 0.2 * i + this.portal.rotation;
            const r = i * 0.5;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
    }

    draw(ctx, cameraX) {
        const groundStart = Math.floor(cameraX / this.tileSize) * this.tileSize;
        for (let gx = groundStart; gx < cameraX + CANVAS_WIDTH + 16; gx += this.tileSize) {
            const screenX = gx - cameraX;
            ctx.fillStyle = this.groundColors.grass;
            ctx.fillRect(screenX, this.groundY, 16, 4);
            ctx.fillStyle = this.groundColors.dirt;
            ctx.fillRect(screenX, this.groundY + 4, 16, 32);
        }

        if (this.checkpointTextTimer > 0) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px 'Courier New'";
            ctx.textAlign = "center";
           ctx.fillText("CHECKPOINT!", CANVAS_WIDTH / 2, 50);
            this.checkpointTextTimer--;
        }

        this.groundHazards.forEach(h => {
            const screenX = h.x - cameraX;
            if (screenX + h.w > 0 && screenX < CANVAS_WIDTH) {
                // OIL
                if (h.type === 'oil') {
                    ctx.fillStyle = '#111111';
                    ctx.beginPath();
                    ctx.ellipse(screenX + h.w / 2, this.groundY + 6, h.w / 2, 6, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else if (h.type === 'ice') {
                    // 1. Base Ice Block (Flush with ground)
                    ctx.fillStyle = '#a0d8f8';
                    ctx.fillRect(screenX, this.groundY, h.w, 6);

                    // 2. High-Contrast "Cracks" (Internal diagonal lines)
                    ctx.strokeStyle = '#e0f2fe';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for (let ix = 4; ix < h.w; ix += 12) {
                        // Lines start and end strictly within the 6px height
                        ctx.moveTo(screenX + ix, this.groundY);
                        ctx.lineTo(screenX + ix - 4, this.groundY + 6);
                    }
                    ctx.stroke();

                    // 3. Surface Glaze (Subtle shine on the very top pixel row)
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(screenX, this.groundY, h.w, 1);
                }
                // Inside the loop, after the 'ice' block (else block), add this:
                else if (h.type === 'quicksand') {
                    ctx.fillStyle = this.groundColors.quicksand;
                    // This draws the sand from ground level to the very bottom of the canvas
                    ctx.fillRect(screenX, this.groundY, h.w, 224 - this.groundY);

                    // Add some "grain" details for texture
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    for (let i = 0; i < h.w; i += 8) {
                        ctx.fillRect(screenX + i + (Math.sin(Date.now() / 500) * 2), this.groundY + 10, 2, 2);
                    }




                } // Closes the else block
            } // Closes the screen check if-statement
        }); // Closes the forEach loop



        if (this.clock && !this.clock.collected) {
            const screenX = this.clock.x - cameraX;
            if (screenX > -20 && screenX < CANVAS_WIDTH + 20) {
                ctx.fillStyle = '#ffff00'; ctx.beginPath(); ctx.arc(screenX + 8, this.clock.y + 8, 6, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.beginPath();
                ctx.moveTo(screenX + 8, this.clock.y + 8); ctx.lineTo(screenX + 8, this.clock.y + 4);
                ctx.moveTo(screenX + 8, this.clock.y + 8); ctx.lineTo(screenX + 11, this.clock.y + 8); ctx.stroke();
            }
        }

        this.coins.forEach(c => {
            const screenX = c.x - cameraX;
            if (screenX > -10 && screenX < CANVAS_WIDTH) {
                const cx = screenX + 5;
                const cy = c.y + 5;

                // 1. Darker Gold Outline (gives it shape)
                ctx.fillStyle = '#8a6508';
                ctx.beginPath();
                ctx.arc(cx, cy, 5, 0, Math.PI * 2);
                ctx.fill();

                // 2. Main Gold Body
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(cx, cy, 4, 0, Math.PI * 2);
                ctx.fill();

                // 3. Shiny Metallic Reflection (The "Gleam")
                // We use a crescent shape of lighter gold
                ctx.fillStyle = '#fff4ad';
                ctx.beginPath();
                ctx.arc(cx, cy, 3, -Math.PI / 1.5, 0);
                ctx.lineTo(cx, cy);
                ctx.fill();

                // 4. Pure White Hot-Spot (The "Sparkle")
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cx - 1, cy - 3, 2, 2);
            }
        });

       // Locate this section in foreground.js (around line 431)
this.elevators.forEach(e => {
    const screenX = e.x - cameraX;
    if (screenX + e.w > 0 && screenX < CANVAS_WIDTH) {
        // 1. Draw the Main Stone Body
        ctx.fillStyle = this.elevatorColors.main;
        ctx.fillRect(screenX, e.y, e.w, e.h);

        // 2. Add Top Highlight (makes it look solid/bevelled)
        ctx.fillStyle = this.elevatorColors.highlight;
        ctx.fillRect(screenX, e.y, e.w, 1); // Top edge
        ctx.fillRect(screenX, e.y, 1, e.h); // Left edge

        // 3. Add Bottom/Right Shadow
        ctx.fillStyle = this.elevatorColors.shadow;
        ctx.fillRect(screenX + 1, e.y + e.h - 1, e.w - 1, 1); // Bottom edge
        ctx.fillRect(screenX + e.w - 1, e.y + 1, 1, e.h - 1); // Right edge

        // 4. Add "Stone Texture" (Little cracks or grit)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        // Draw 3 small random pixels to simulate stone grit
        ctx.fillRect(screenX + 5, e.y + 3, 2, 1);
        ctx.fillRect(screenX + 22, e.y + 5, 1, 1);
        ctx.fillRect(screenX + 14, e.y + 2, 1, 1);
    }
});

        this.platforms.forEach(p => {
            const screenX = p.x - cameraX;
            if (screenX + 16 > 0 && screenX < CANVAS_WIDTH)
                this.drawBrick(ctx, screenX, p.y, p.isSecret, p.hasClock, p.isCheckpointCandidate, p);
        });

        //DRAW BOW LEVEL 1-1
        // Locate this section in the draw(ctx, cameraX) method of foreground.js
        if (!this.bow.collected) {
            const bx = this.bow.x - cameraX;
            if (bx > -20 && bx < (CANVAS_WIDTH + 20)) {
                // 1. Draw the Bow String (Pure White) - Moved to the left side
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(bx - 4, this.bow.y - 10);
                ctx.lineTo(bx - 4, this.bow.y + 10);
                ctx.stroke();

                // 2. Draw the Bow Frame (Flipped Horizontally)
                ctx.fillStyle = '#fde047';
                // Top Limb - Offsets are now positive to move right
                ctx.fillRect(bx - 4, this.bow.y - 10, 5, 3);
                ctx.fillRect(bx - 1, this.bow.y - 8, 4, 3);
                // Middle Grip
                ctx.fillRect(bx + 1, this.bow.y - 5, 4, 10);
                // Bottom Limb
                ctx.fillRect(bx - 1, this.bow.y + 5, 4, 3);
                ctx.fillRect(bx - 4, this.bow.y + 7, 5, 3);

                // 3. Shimmer on the grip
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(bx + 2, this.bow.y - 2, 2, 2);
            }
        }

        if (this.star) {
            const screenX = this.star.x - cameraX;
            if (screenX > -30 && screenX < (CANVAS_WIDTH + 30)) {
                ctx.save();
                ctx.translate(screenX, this.star.y);

                if (this.level === 1) {
                    // 1. Shaft (Wood color)
                    ctx.fillStyle = '#7c2d12';
                    ctx.fillRect(-6, 0, 12, 2);

                    // 2. Arrowhead (Shiny Silver/Grey)
                    ctx.fillStyle = '#d1d5db';
                    ctx.beginPath();
                    ctx.moveTo(6, -2);
                    ctx.lineTo(12, 1);
                    ctx.lineTo(6, 4);
                    ctx.fill();

                    // 3. Fletching/Feathers (White/Red for visibility)
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(-10, -2, 4, 2); // Top feather
                    ctx.fillRect(-10, 2, 4, 2);  // Bottom feather

                    // 4. Added "Gleam" on the arrowhead
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(7, -1, 2, 1);

                } else {
                    // Keep your Level 2/3 Star logic here
                    const pulse = 1 + Math.sin(Date.now() / 200) * 0.2;
                    ctx.scale(pulse, pulse);
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    for (let i = 0; i < 10; i++) {
                        const r = i % 2 === 0 ? 12 : 5;
                        const angle = (Math.PI / 5) * i - Math.PI / 2;
                        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                    }
                    ctx.closePath(); ctx.fill();
                }
                ctx.restore();
            }
        }

        if (this.activeFlag && !this.activeFlag.collected) {
            const fx = this.activeFlag.x - cameraX;
           if (fx > -20 && fx < (CANVAS_WIDTH + 20)) {
                ctx.fillStyle = '#ffffff'; ctx.fillRect(fx + 7, this.activeFlag.y - 15, 2, 31);
                ctx.fillStyle = '#ff0000'; ctx.fillRect(fx + 9, this.activeFlag.y - 15, 12, 8);
            }
        }



        if (this.bird && !this.bird.hit) {
            const bx = this.bird.x - cameraX;
            if (bx > -50 && bx < (CANVAS_WIDTH + 50)) {
                ctx.save();
                ctx.translate(bx + 8, this.bird.y + 4);
                // Flip the drawing if the bird is moving right
                if (this.bird.dir === 1) ctx.scale(-1, 1);
                
                // 1. FLASH EFFECT (Red when hit)
                let bodyColor = '#334155'; // Dark slate blue/grey
                let highlightColor = '#475569';
                let eyeColor = '#ef4444'; // Piercing red eye
                
                if (this.bird.flashTimer > 0) {
                    bodyColor = '#ff0000';
                    highlightColor = '#ff5555';
                    this.bird.flashTimer--;
                }

                // 2. WINGS (Flapping Animation)
                const wingFlap = Math.sin(Date.now() / 800) * 0.8; // Slower, more majestic flap
                ctx.fillStyle = highlightColor;
                
                // Far Wing (behind body)
                ctx.save();
                ctx.rotate(-wingFlap - 0.5);
                ctx.fillRect(-4, -10, 14, 4); // Main wing span
                ctx.fillRect(2, -6, 10, 2);  // Primary feathers
                ctx.restore();

                // 3. TAIL FEATHERS
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.moveTo(8, 0);
                ctx.lineTo(16, -4);
                ctx.lineTo(16, 4);
                ctx.fill();

                // 4. MAIN BODY (Aerodynamic shape)
                ctx.beginPath();
                ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
                ctx.fill();

                // 5. THE HEAD & BEAK
                ctx.save();
                ctx.translate(-8, -2);
                // Head
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                // Eye
                ctx.fillStyle = eyeColor;
                ctx.fillRect(-2, -1, 2, 2);
                // Beak (Sharp and pointed)
                ctx.fillStyle = '#fde047';
                ctx.beginPath();
                ctx.moveTo(-4, 0);
                ctx.lineTo(-10, 1);
                ctx.lineTo(-4, 3);
                ctx.fill();
                ctx.restore();

                // 6. NEAR WING (In front of body)
                ctx.save();
                ctx.fillStyle = bodyColor;
                ctx.rotate(wingFlap);
                ctx.fillRect(-2, -8, 12, 5); // Upper wing
                ctx.fillStyle = highlightColor;
                ctx.fillRect(2, -3, 10, 2);  // Wing highlight/shading
                ctx.restore();

                ctx.restore();
            }
        }

        if (this.key.dropped && !this.key.collected) {
            const kx = this.key.x - cameraX;
            const ky = this.key.y;

            // 1. Dark Gold Outline (The "Skeleton" of the key)
            ctx.fillStyle = '#8a6508';
            ctx.fillRect(kx - 1, ky - 1, 6, 10); // Main shaft outline
            ctx.fillRect(kx + 4, ky + 5, 5, 4);  // Teeth outline

            // 2. Shiny Gold Body
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(kx, ky, 4, 8);          // Shaft
            ctx.fillRect(kx + 4, ky + 6, 4, 2);  // Teeth

            // 3. The "Ring" Handle (Shiny Gold)
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(kx + 2, ky - 2, 3, 0, Math.PI * 2);
            ctx.stroke();

            // 4. Metallic Highlights (White gleam)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(kx + 1, ky + 1, 2, 2);  // Gleam on shaft
            ctx.fillRect(kx + 1, ky - 4, 2, 1);  // Shine on top of the ring
        }

        this.drawPortal(ctx, cameraX);
    }

    drawQuicksand(ctx, cameraX) {
        this.groundHazards.forEach(h => {
            if (h.type === 'quicksand') {
                const screenX = h.x - cameraX;
                if (screenX + h.w > 0 && screenX < CANVAS_WIDTH) {
                    // Draw the solid sand block
                    ctx.fillStyle = this.groundColors.quicksand;
                    ctx.fillRect(screenX, this.groundY, h.w, 224 - this.groundY);

                    // Draw the texture grains so they appear on top
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    for (let i = 0; i < h.w; i += 8) {
                        ctx.fillRect(screenX + i + (Math.sin(Date.now() / 500) * 2), this.groundY + 10, 2, 2);
                    }
                }
            }
        });
    }


}