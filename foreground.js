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

        this.troll = { x: this.portalX + 40, y: this.groundY, width: 32, height: 40, health: 5, hit: false, flashTimer: 0, bubbleTimer: 0, bubblesPopped: 0 };

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
        // Levels 1 and 2 now both use the green grass and brown dirt theme
        if (this.level === 3) {
            this.groundColors.grass = '#d1d5db'; // Light grey surface (lunar dust)
            this.groundColors.dirt = '#4b5563';  // Darker grey underground (lunar rock)
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

        const clockCandidates = this.platforms.filter(p => {
            // Check if there's any brick directly above this one
            const isUnderneath = this.platforms.some(other => other.x === p.x && other.y < p.y);
            return p.x > CANVAS_WIDTH && p.x < 2048 && !isUnderneath;
        });
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

        // --- SPREAD OUT CHECKPOINTS ACROSS 3 ZONES ---
        const checkpointZones = [
            { min: 0, max: 975 },
            { min: 1000, max: 1975 },
            { min: 2000, max: 3000 }
        ];

        checkpointZones.forEach(zone => {
            // Find all bricks within THIS specific zone
            const zoneCandidates = this.platforms.filter(p => {
                // Check if there's any brick directly above this one
                const isUnderneath = this.platforms.some(other => other.x === p.x && other.y < p.y);
                return !p.hasClock && !p.isSecret && p.x >= zone.min && p.x <= zone.max && !isUnderneath;
            });

            if (zoneCandidates.length > 0) {
                const idx = Math.floor(Math.random() * zoneCandidates.length);
                const target = zoneCandidates[idx];

                target.isCheckpointCandidate = true;
                target.hasPulsed = false;
                target.visibleStartTime = null;
                target.pulseTriggered = false;
            }
        });

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
                player.bullets = 20;
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

        // --- TROLL BUBBLE LOGIC (Level 2) ---
        if (this.level === 2 && !this.troll.hit && player.x > this.portalX - 300) {
            this.troll.bubbleTimer++;
            if (this.troll.bubbleTimer > 60) { // Blow a bubble every second
                this.troll.bubbleTimer = 0;
                // Constraints: Not hitting gate (vx > -0.8) and not going off right (vx < 0.3)
                const randomVx = -0.8 + Math.random() * 1.1;
                activeBubbles.push({
                    x: this.troll.x + 5,
                    y: this.troll.y - 30,
                    radius: 6 + Math.random() * 3,
                    vx: randomVx,
                    vy: -1.5 - Math.random() * 1.0 // Blowing upwards
                });
            }
        }

    }

    drawBrick(ctx, x, y, isSecret, hasClock, isCheckpointCandidate, platformObj) {
        ctx.fillStyle = this.brickColors.main;
        let offsetY = 0;
        const isSpecial = isSecret || hasClock || isCheckpointCandidate;



        ctx.save();
        ctx.translate(0, offsetY);
        // Main Body
        // 1. Draw Main Body
        ctx.fillRect(x, y, 16, 16);

        // --- WHITE LIGHT SHINE EFFECT ---
        if (isSpecial) {
            const cycleTime = 5000; // 5 seconds in milliseconds
            const shineDuration = 50; // How long the shine takes to cross the brick
            const currentTime = Date.now() % cycleTime;

            if (currentTime < shineDuration) {
                const progress = currentTime / shineDuration;

                ctx.save();
                // Create a clipping region so the light stays inside the brick
                ctx.beginPath();
                ctx.rect(x, y, 16, 16);
                ctx.clip();

                // Draw a diagonal white beam that moves from left to right
                ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
                ctx.lineWidth = 4;
                ctx.beginPath();

                // The beam starts off-left (-10) and moves to off-right (+26)
                const shineX = x - 10 + (progress * 36);
                ctx.moveTo(shineX, y);
                ctx.lineTo(shineX + 8, y + 16);
                ctx.stroke();

                ctx.restore();
            }
        }

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
        // Draw Ground as solid blocks to prevent vertical seam lines
        ctx.fillStyle = this.groundColors.grass;
        ctx.fillRect(0, this.groundY, CANVAS_WIDTH, 4);
        ctx.fillStyle = this.groundColors.dirt;
        ctx.fillRect(0, this.groundY + 4, CANVAS_WIDTH, 32);


        // --- ADDED: LUNAR CRATERS (Level 1-3 Only) ---
        if (this.level === 3) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Slightly darker than the dirt
            // Draw a repeating pattern of craters across the level
            for (let cx = 0; cx < this.levelWidth; cx += 100) {
                const screenX = cx - cameraX;

                // Only draw if the crater is actually visible on the screen
                if (screenX > -40 && screenX < CANVAS_WIDTH + 40) {
                    // 1. Large Main Crater
                    ctx.beginPath();
                    ctx.arc(screenX, this.groundY + 18, 10, 0, Math.PI * 2);
                    ctx.fill();

                    // 2. Smaller secondary crater for variety
                    ctx.beginPath();
                    ctx.arc(screenX + 40, this.groundY + 26, 5, 0, Math.PI * 2);
                    ctx.fill();

                    // 3. Subtle highlight for 3D depth
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.beginPath();
                    ctx.arc(screenX - 2, this.groundY + 16, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Reset color for next loop
                }
            }
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
        // DRAW WEAPON PICKUP (Bow/Dart Gun)
        if (!this.bow.collected) {
            const bx = this.bow.x - cameraX;
            if (bx > -20 && bx < (CANVAS_WIDTH + 20)) {
                if (this.level === 2) {
                    // --- DART GUN (Level 2) ---
                    ctx.fillStyle = '#475569'; // Gun Metal
                    // We use -3 to center the barrel where the Bow grip was
                    ctx.fillRect(bx, this.bow.y - 3, 14, 6); // Barrel
                    ctx.fillRect(bx, this.bow.y + 1, 4, 8);  // Handle
                    ctx.fillStyle = '#ef4444'; // Red stripe detail
                    ctx.fillRect(bx + 4, this.bow.y - 2, 6, 2);
                } else {
                    // --- BOW (Level 1) ---
                    // 1. Draw the Bow String (Pure White)
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(bx - 4, this.bow.y - 10);
                    ctx.lineTo(bx - 4, this.bow.y + 10);
                    ctx.stroke();

                    // 2. Draw the Bow Frame
                    ctx.fillStyle = '#fde047';
                    ctx.fillRect(bx - 4, this.bow.y - 10, 5, 3);
                    ctx.fillRect(bx - 1, this.bow.y - 8, 4, 3);
                    ctx.fillRect(bx + 1, this.bow.y - 5, 4, 10); // Grip
                    ctx.fillRect(bx - 1, this.bow.y + 5, 4, 3);
                    ctx.fillRect(bx - 4, this.bow.y + 7, 5, 3);

                    // 3. Shimmer on the grip
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(bx + 2, this.bow.y - 2, 2, 2);
                }
            }
        } // <--- This was the missing brace!

        // --- IRON PORTCULLIS (GATE) ---
        if (!this.key.dropped) {
            // We position the gate 20 pixels to the right of the bow
            const gateX = (this.bow.x + 20) - cameraX;

            if (gateX > -30 && gateX < (CANVAS_WIDTH + 30)) {
                ctx.fillStyle = '#334155'; // Dark iron grey

                // Draw 5 vertical bars
                for (let i = 0; i < 5; i++) {
                    const barX = gateX + (i * 6);
                    // Bars go from the top of the screen to the ground
                    ctx.fillRect(barX, 0, 2, this.groundY);

                    // Pointed tips at the top for detail
                    ctx.beginPath();
                    ctx.moveTo(barX - 1, 12);
                    ctx.lineTo(barX + 1, 2);
                    ctx.lineTo(barX + 3, 12);
                    ctx.fill();
                }

                // Two horizontal cross-beams
                ctx.fillRect(gateX - 2, 40, 28, 4);
                ctx.fillRect(gateX - 2, 120, 28, 4);

                // Ground shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(gateX - 2, this.groundY, 28, 2);
            }
        }

        if (this.star) {
            const screenX = this.star.x - cameraX;
            if (screenX > -30 && screenX < (CANVAS_WIDTH + 30)) {
                ctx.save();
                ctx.translate(screenX, this.star.y);

                if (this.level === 1) {
                    // --- ARROW (Level 1) ---
                    ctx.fillStyle = '#7c2d12'; // Shaft
                    ctx.fillRect(-6, 0, 12, 2);

                    ctx.fillStyle = '#d1d5db'; // Arrowhead
                    ctx.beginPath();
                    ctx.moveTo(6, -2);
                    ctx.lineTo(12, 1);
                    ctx.lineTo(6, 4);
                    ctx.fill();

                    ctx.fillStyle = '#ef4444'; // Fletching
                    ctx.fillRect(-10, -2, 4, 2);
                    ctx.fillRect(-10, 2, 4, 2);

                    ctx.fillStyle = '#ffffff'; // Gleam
                    ctx.fillRect(7, -1, 2, 1);

                } else if (this.level === 2) {
                    // --- DART (Level 2) ---
                    // 1. Silver Metal Body
                    ctx.fillStyle = '#94a3b8';
                    ctx.fillRect(-4, 0, 10, 2);

                    // 2. Sharp Needle Tip
                    ctx.fillStyle = '#f8fafc';
                    ctx.beginPath();
                    ctx.moveTo(6, -1);
                    ctx.lineTo(11, 1);
                    ctx.lineTo(6, 3);
                    ctx.fill();

                    // 3. Red Fins (Fletching)
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.moveTo(-4, 1);
                    ctx.lineTo(-10, -4);
                    ctx.lineTo(-10, 6);
                    ctx.fill();

                    // 4. Grip detail
                    ctx.fillStyle = '#475569';
                    ctx.fillRect(0, 0, 3, 2);

                } else if (this.level === 3) {
                    // --- GRENADE ITEM (Level 3) ---
                    ctx.fillStyle = '#365314'; // Army Green
                    ctx.beginPath();
                    // We use (0,0) because of the translate(screenX, this.star.y) above
                    ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Grenade pin/lever
                    ctx.fillStyle = '#94a3b8';
                    ctx.fillRect(-2, -10, 4, 3);
                    ctx.fillRect(-4, -12, 8, 2);
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

        // --- FRONT-FACING TROLL MINI-BOSS (Level 2) ---
        if (this.level === 2 && !this.troll.hit) {
            const tx = this.troll.x - cameraX;
            if (tx > -60 && tx < CANVAS_WIDTH + 60) {
                const isBlowing = this.troll.bubbleTimer > 40;
                // Heave effect makes the chest/head expand when breathing in
                const heave = isBlowing ? Math.sin(Date.now() / 50) * 2 : 0;

                ctx.save();
                ctx.translate(tx + 16, this.troll.y); // Center drawing on the hitbox

                if (this.troll.flashTimer > 0) {
                    ctx.filter = 'brightness(250%) saturate(0%)';
                    this.troll.flashTimer--;
                }

                // 1. LEGS (Muscular wide stance)
                ctx.fillStyle = '#052e16'; // Shadow parts
                ctx.fillRect(-16, -12, 10, 12);
                ctx.fillRect(6, -12, 10, 12);
                ctx.fillStyle = '#15803d'; // Front skin
                ctx.fillRect(-14, -18, 8, 14);
                ctx.fillRect(6, -18, 8, 14);
                // Big flat feet
                ctx.fillStyle = '#052e16';
                ctx.fillRect(-17, -4, 12, 4);
                ctx.fillRect(5, -4, 12, 4);

                // 2. ARMS (Bulky shoulders and forearms at the sides)
                ctx.fillStyle = '#15803d';
                ctx.fillRect(-24, -36, 10, 18); // Left shoulder
                ctx.fillRect(14, -36, 10, 18);  // Right shoulder
                ctx.fillStyle = '#16a34a'; // Bright forearms
                ctx.fillRect(-26, -20, 8, 16);
                ctx.fillRect(18, -20, 8, 16);
                // Heavy knuckles resting on ground
                ctx.fillStyle = '#052e16';
                ctx.fillRect(-28, -6, 10, 6);
                ctx.fillRect(18, -6, 10, 6);

                // 3. TORSO (Broad Chest)
                ctx.fillStyle = '#15803d';
                ctx.fillRect(-15 - heave, -38, 30 + (heave * 2), 22);
                // Chest Highlights (Pectorals)
                ctx.fillStyle = '#4ade80';
                ctx.fillRect(-10 - heave, -34, 8, 4);
                ctx.fillRect(2 + heave, -34, 8, 4);

                // Loincloth
                ctx.fillStyle = '#451a03';
                ctx.fillRect(-16, -18, 32, 10);
                ctx.fillStyle = '#78350f';
                ctx.fillRect(-6, -10, 12, 8);

                // 4. THE HEAD (Centered)
                ctx.save();
                ctx.translate(0, -42 - heave); // Head bobs with chest heaving
                ctx.fillStyle = '#15803d';
                ctx.fillRect(-11, -11, 22, 22); // Face base

                // Hair (Messy top)
                ctx.fillStyle = '#1e1b4b';
                ctx.fillRect(-12, -13, 24, 6);
                ctx.fillRect(-8, -15, 16, 4);

                // Brow Ridge and Shading
                ctx.fillStyle = '#052e16';
                ctx.fillRect(-9, -4, 18, 3);
                ctx.fillRect(-11, 4, 2, 8); // Side shadows
                ctx.fillRect(9, 4, 2, 8);

                // Eyes (Glowing Symmetrical)
                ctx.fillStyle = '#fde047';
                ctx.fillRect(-7, -1, 4, 3); // Left
                ctx.fillRect(3, -1, 4, 3);  // Right
                ctx.fillStyle = '#000';
                ctx.fillRect(-5, 0, 1, 1);
                ctx.fillRect(4, 0, 1, 1);

                // Nose (Large snout)
                ctx.fillStyle = '#166534';
                ctx.fillRect(-3, 1, 6, 7);

                // Tusks (One on each side)
                ctx.fillStyle = '#fefce8';
                ctx.fillRect(-10, 6, 3, 8); // Left
                ctx.fillRect(7, 6, 3, 8);  // Right

                // MOUTH (Centered Blowing)
                if (isBlowing) {
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(0, 11, 5, 0, Math.PI * 2);
                    ctx.fill();
                    // Saliva/Bubble gleam
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.fillRect(-2, 9, 2, 2);
                } else {
                    ctx.fillStyle = '#052e16';
                    ctx.fillRect(-6, 12, 12, 2); // Grimace line
                }

                // Ears (Pointed out sides)
                ctx.fillStyle = '#15803d';
                ctx.beginPath();
                ctx.moveTo(-11, -5); ctx.lineTo(-18, -10); ctx.lineTo(-11, 5); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(11, -5); ctx.lineTo(18, -10); ctx.lineTo(11, 5); ctx.fill();

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