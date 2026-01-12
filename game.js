// 1. GLOBAL CONSTANTS & VARIABLES
let CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 224;

let canvas, ctx, player, fg, bg;
let projectiles = [];
let enemies = [];
let particles = [];
let cameraX = 0;
let isInitialized = false;
let globalCheckpoints = {}; // Stores { level: { x, y } }
let collectedStars = {};    // Stores { level: true }
let currentLevelNum; // Declared here; initialized in loadLevel(1)
let isGodMode = false; // Set to true for testing, false for normal gameplay
let collectedLevelItems = {}; // Stores { level: true } if the quest item (Arrow) is found
let fadeOpacity = 0;
let fadeTarget = 0;
let fadeSpeed = 0.03;
let pendingLevelChange = false;
let levelKills = 0;
let activeBubbles = [];

// --- LEVEL DIFFICULTY CONFIGURATION ---
const levelEnemies = {
    1: { skeleton: 3, zombie: 3, spider: 3 },
    2: { skeleton: 4, zombie: 3, spider: 3 },
    3: { skeleton: 4, zombie: 4, spider: 3 }, // Boss levels might have fewer minions
    // Add level 4, 5, etc., here to make them harder
};

// Default settings if a level is not defined above
const defaultEnemies = { skeleton: 4, zombie: 4, spider: 4 };




// 2. INITIALIZATION
function init() {
    if (isInitialized) return;

    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    player = new Player(CANVAS_HEIGHT);

    // Use loadLevel to ensure all global states are synced from start
    loadLevel(1);

    // Listen for oil events
    window.addEventListener('oilSplash', (e) => {
        createOilSplash(e.detail.x, e.detail.y);
    });


    // Listen for ice events
    window.addEventListener('icePuff', (e) => {
        createIcePuff(e.detail.x, e.detail.y);
    });

    // Listen for player shooting events
    window.addEventListener('playerShoot', (e) => {
        const isArrow = e.detail.type === 'arrow';

        projectiles.push({
            x: e.detail.x,
            y: e.detail.y,
            spawnX: e.detail.x,
            dir: e.detail.dir,
            vx: e.detail.vx, // Ensure this is being passed
            vy: e.detail.vy, // Ensure this is being passed
            isArrow: isArrow,
            isEnemyBullet: false,
            color: isArrow ? '#fde047' : '#ffffff'
        });
    });

    // Handle brick-breaking logic
    window.addEventListener('brickHit', (e) => {
        const plat = e.detail.platform;
        if (plat.isCheckpointCandidate) {
            fg.activeFlag = { x: plat.x, y: plat.y - 40, collected: false };
        }
        if (!plat.isSecret) {
            const index = fg.platforms.indexOf(plat);
            if (index > -1) {
                if (plat.hasClock) {
                    fg.clock = { x: plat.x, y: plat.y, collected: false };
                    fg.platforms.forEach(other => { other.hasClock = false; });
                }
                createShatterEffect(plat.x + 8, plat.y + 8);
                fg.platforms.splice(index, 1);
            }
        }
    });

    isInitialized = true;

    // SAFETY START: Only start the loop once player and level (fg) are confirmed to exist
    if (player && fg) {
        requestAnimationFrame(gameLoop);
    } else {
        // If generation takes a millisecond longer, wait and try again
        setTimeout(() => {

            if (player && fg) requestAnimationFrame(gameLoop);
        }, 10);
    }
}

// 3. MAIN GAME LOOP
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {

    if (!player || !fg) return;

    // Initialize Bird if player is near portal
    if (fg.level === 1 && !fg.bird && player.x > fg.portalX - 400) {
        fg.bird = {
            x: fg.portalX,
            y: fg.portal.y - 110,
            dir: -1,
            speed: 2,
            width: 16,
            height: 12,
            hit: false
        };
    }

    // Update Bird movement
    if (fg.bird && !fg.bird.hit) {
        fg.bird.x += fg.bird.dir * fg.bird.speed;

        fg.bird.y = (fg.portal.y - 110) + Math.sin(Date.now() / 200) * 25;


        if (fg.bird.x < fg.portalX - 30) fg.bird.dir = 1;
        if (fg.bird.x > fg.portalX + 15) fg.bird.dir = -1;
    }




    // DEFERRED DEATH FLAG: Prevents freezing by waiting for loops to finish
    let playerHit = false;

    // --- 1. TIMER TIMEOUT CHECK ---
    if (fg.timeLeft <= 0 && !player.isEndingLevel) {
        handlePlayerDeath('timeout');
        return;
    }



    player.update(fg.groundY, fg.platforms, fg.elevators, fg.groundHazards, fg.coins, fg);

    // Portal Boundary
    if (player.x + player.width > fg.portal.x && !player.isEndingLevel) {
        player.x = fg.portal.x - player.width;
        player.velocityX = 0;
    }

    // Portal Proximity & Level End
    const dx = (player.x + player.width / 2) - fg.portal.x;
    const dy = (player.y + player.height / 2) - fg.portal.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 20 && !player.isEndingLevel) {
        if (fg.hasStar) {
            player.startPortalSuck(fg.portal.x, fg.portal.y);
        } else {
            const timerElement = document.getElementById('timer-display');
            if (timerElement) {
                timerElement.innerText = "NEED STAR!";
                timerElement.style.color = "#ffff00";
            }
        }
    }

    enemies.forEach((en, eIdx) => {
        if (en.isBoss) {
            en.update(projectiles, player);
        } else {
            en.update(fg.platforms, player, projectiles);
        }

        projectiles.forEach((p, pIdx) => {
            // Check if a player bullet hits an enemy or boss
            if (!p.isEnemyBullet && p.x > en.x && p.x < en.x + en.width &&
                p.y > en.y && p.y < en.y + en.height) {

                if (en.isBoss) {
                    if (en.reflectTimer > 0) {
                        // NEW: Reverse the bullet back at the player
                        p.isEnemyBullet = true;
                        p.dir *= -1;         // Flip horizontal direction
                        p.color = '#ff0000'; // Turn red for danger
                        p.spawnX = p.x;      // Reset spawn point for travel distance checks
                    } else {
                        // NORMAL: Boss takes damage
                        const isDead = en.takeDamage();
                        projectiles.splice(pIdx, 1);
                        if (isDead) {
                            createShatterEffect(en.x + en.width / 2, en.y + en.height / 2);
                            enemies.splice(eIdx, 1);
                        }
                    }
                } else {
                    // NORMAL: Standard enemy dies
                    createShatterEffect(en.x + en.width / 2, en.y + en.height / 2);
                    enemies.splice(eIdx, 1);
                    projectiles.splice(pIdx, 1);
                    levelKills++;
                    if (levelKills % 4 === 0) {
                        activeBubbles.push({
                            x: cameraX + 220, // Bottom right of screen
                            y: 224,
                            radius: 18,
                            vx: -0.5,
                            vy: -0.8
                        });
                    }
                }
            }
        });


        // PLAYER COLLISION WITH ENEMY/BOSS
        if (!isGodMode && !player.inBubble && player.x < en.x + en.width && player.x + player.width > en.x &&
            player.y < en.y + en.height && player.y + player.height > en.y) {
            handlePlayerDeath(en.isBoss ? 'boss' : 'enemy');
        }
    });

    // PROJECTILE UPDATES 
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];

        // Change this line to include p.isArrow
        if (p.isGrenade || p.isArrow) {
            // Parabolic movement (Gravity)
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15; // Gravity pulling the arrow/bone down

            // Ground collision
            if (p.y > fg.groundY) {
                createShatterEffect(p.x, p.y);
                projectiles.splice(i, 1);
                continue;
            }
        } else {
            // Normal straight bullets
            p.x += p.vx;
        }

        // --- START OF ADDED BUBBLE COLLISION (LEVEL 1-2) ---
        if (fg.level === 2) {
            let hitBubble = false;
            for (let j = activeBubbles.length - 1; j >= 0; j--) {
                let b = activeBubbles[j];

                // 1. Distance from the dart's center/tail
                let distCenter = Math.sqrt(Math.pow(p.x - b.x, 2) + Math.pow(p.y - b.y, 2));

                // 2. Calculate the position of the dart's TIP (about 10 pixels ahead of its origin)
                let angle = Math.atan2(p.vy, p.vx);
                let tipX = p.x + Math.cos(angle) * 10;
                let tipY = p.y + Math.sin(angle) * 10;
                let distTip = Math.sqrt(Math.pow(tipX - b.x, 2) + Math.pow(tipY - b.y, 2));

                // Check if EITHER the center OR the tip is inside the bubble's radius
                if (!p.isEnemyBullet && (distCenter < b.radius || distTip < b.radius)) {
                    createBubblePopEffect(b.x, b.y);
                    // 1. Pop the bubble and remove projectile
                    activeBubbles.splice(j, 1);
                    projectiles.splice(i, 1);

                    // 2. Increment Troll counter and provide visual flash
                    fg.troll.bubblesPopped++;
                    fg.troll.flashTimer = 10;

                    // 3. Handle Boss Death at 3 pops
                    if (fg.troll.bubblesPopped >= 3) {
                        fg.troll.hit = true;
                        createShatterEffect(fg.troll.x + 16, fg.troll.y - 20); // Center of troll
                        fg.dropKey(); // Triggers the key to fall just like Level 1-1
                    }
                    hitBubble = true;
                    break;
                }
            }
            if (hitBubble) continue; // Skip other collisions for this projectile
        }


        // 2. REACTION BIRD COLLISION & HEALTH
        if (fg.bird && !fg.bird.hit && !p.isEnemyBullet) {
            const pLeft = p.isArrow ? p.x - 8 : p.x;
            const pRight = p.isArrow ? p.x + 6 : p.x + 4;
            if (pRight > fg.bird.x && pLeft < fg.bird.x + fg.bird.width &&
                p.y > fg.bird.y && p.y < fg.bird.y + fg.bird.height) {

                // Initialize health if it doesn't exist
                if (fg.bird.health === undefined) fg.bird.health = 2;


                fg.bird.health--;

                if (fg.bird.health <= 0) {
                    fg.bird.hit = true;
                    // Trigger the key drop in the foreground
                    fg.dropKey(fg.bird.x + 8, fg.bird.y + 8, fg.bird.dir);
                    createShatterEffect(fg.bird.x + 8, fg.bird.y + 8);

                } else {
                    // NEW: Trigger a red flash for 10 frames when hit but not dead
                    fg.bird.flashTimer = 10;
                }

                projectiles.splice(i, 1);
                continue;
            }
        }


        // Check if enemy bullet hits player
        if (p.isEnemyBullet && !isGodMode) {
            if (p.x > player.x && p.x < player.x + player.width &&
                p.y > player.y && p.y < player.y + player.height) {
                if (player.inBubble) {
                    // NEW: Pop the bubble instead of killing the player
                    player.inBubble = false;
                    player.bubbleTimer = 0;
                } else {
                    handlePlayerDeath(p.fromBoss ? 'boss' : 'enemy');
                }
                projectiles.splice(i, 1);
                continue;
            }
        }

        let bulletHitBrick = false;
        if (fg.platforms) {
            for (let j = fg.platforms.length - 1; j >= 0; j--) {
                const plat = fg.platforms[j];
                const platW = plat.w * 16;
                const platH = plat.h * 16;

                if (p.x > plat.x && p.x < plat.x + platW &&
                    p.y > plat.y && p.y < plat.y + platH) {
                    bulletHitBrick = true;

                    // NEW: If a bullet (from player OR enemy) hits a checkpoint brick
                    if (plat.isCheckpointCandidate) {
                        fg.activeFlag = { x: plat.x, y: plat.y - 40, collected: false };
                    }

                    if (!plat.isSecret) {
                        if (plat.hasClock) {
                            fg.clock = { x: plat.x, y: plat.y, collected: false };
                            fg.platforms.forEach(other => { other.hasClock = false; });
                        }
                        createShatterEffect(plat.x + 8, plat.y + 8);
                        fg.platforms.splice(j, 1);
                    }
                    break;
                }
            }
        }

        // Ensure 'p' and 'p.spawnX' exist before doing math
        const travelDist = (p && typeof p.spawnX !== 'undefined') ? Math.abs(p.x - p.spawnX) : 0;

        // Use a safety check for the off-screen logic
        const isOffScreen = p ? (p.x < cameraX - 10 || p.x > cameraX + CANVAS_WIDTH + 10) : false;

        if (isOffScreen || bulletHitBrick || (p && p.isEnemyBullet && travelDist > 300)) {
            projectiles.splice(i, 1);
        }
    }

    // Camera follow
    // Safety check: only calculate camera if player is defined
    let targetX = (player && typeof player.x !== 'undefined') ? player.x - 125 : cameraX;
    const maxX = fg.portalX - (CANVAS_WIDTH / 2);
    cameraX = Math.max(0, Math.min(targetX, maxX));

    updateParticles();
    fg.update(player);

    for (let i = activeBubbles.length - 1; i >= 0; i--) {
        let b = activeBubbles[i];
        b.y += b.vy;
        b.x += b.vx + Math.sin(Date.now() / 500) * 0.5; // Wobble effect

        // Collision with player
        let dist = Math.sqrt(Math.pow((player.x + 8) - b.x, 2) + Math.pow((player.y + 12) - b.y, 2));
        if (dist < b.radius) {
            player.inBubble = true;
            player.bubbleTimer = 0;
            player.facingRight = true;    // Force face right
            player.rotation = 0;          // Stop any stun spinning
            player.isStunned = false;     // Cancel active stuns
            player.isSquatting = false;   // Force stand up
            player.height = player.normalHeight; // Reset the hitbox size
            activeBubbles.splice(i, 1);
        }
        // Remove if it floats off top
        if (b.y < -20) activeBubbles.splice(i, 1);
    }

}

function nextLevel() {
    if (!pendingLevelChange) {
        fadeTarget = 1; // Start the blackout
        pendingLevelChange = true;
    }
}

function draw() {
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    bg.draw(ctx, cameraX);
    // Draw the player early if in sand so ground tiles cover their edges
    if (player.inQuicksand) player.draw(ctx, cameraX);
    fg.draw(ctx, cameraX);
    enemies.forEach(en => en.draw(ctx, cameraX));

    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - cameraX, p.y, 2, 2);
    });

    // --- DRAWING THE TROLL'S FLOATING BUBBLES ---
    activeBubbles.forEach(b => {
        const bx = b.x - cameraX;
        ctx.save();

        // 1. Start a fresh path to prevent the 'nipple' line from the Troll's mouth
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1;

        // 2. Draw the bubble circle
        ctx.arc(bx, b.y, b.radius, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Draw a circular highlight (Replaces the square fillRect)
        ctx.beginPath();
        const shimmerSize = b.radius * 0.25; // Scales with the bubble
        const shimmerOffset = b.radius * 0.3;
        ctx.arc(bx - shimmerOffset, b.y - shimmerOffset, shimmerSize, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fill();

        ctx.restore();
    });

    if (player.inBubble) {
        ctx.strokeStyle = "rgba(173, 216, 230, 0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc((player.x + 8) - cameraX, player.y + 12, 18, 0, Math.PI * 2);
        ctx.stroke();
    }

    projectiles.forEach(p => {
        ctx.fillStyle = p.color || '#ffffff';

        if (p.isArrow) {
            ctx.save();
            ctx.translate(p.x - cameraX, p.y);
            // This ensures the dart/arrow points in the direction it is moving
            ctx.rotate(Math.atan2(p.vy, p.vx));

            if (fg.level === 2) {
                // --- FLYING DART (Level 1-2) ---
                // 1. Metal Body
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(-4, -1, 10, 2);

                // 2. Sharp Tip
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.moveTo(6, -2); ctx.lineTo(10, 0); ctx.lineTo(6, 2);
                ctx.fill();

                // 3. Red Fins (at the back)
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.moveTo(-4, 0); ctx.lineTo(-9, -4); ctx.lineTo(-9, 4);
                ctx.fill();
            } else {
                // --- FLYING ARROW (Level 1-1) ---
                // 1. Wood Shaft
                ctx.fillStyle = '#7c2d12';
                ctx.fillRect(-8, -1, 12, 2);

                // 2. Arrowhead
                ctx.fillStyle = '#d1d5db';
                ctx.beginPath();
                ctx.moveTo(4, -3); ctx.lineTo(10, 0); ctx.lineTo(4, 3);
                ctx.fill();

                // 3. Tiny Red Feathers
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(-10, -2, 3, 1);
                ctx.fillRect(-10, 1, 3, 1);
            }
            ctx.restore();
        } else {
            // Standard enemy or player bullets
            ctx.fillRect(p.x - cameraX, p.y, 4, 2);
        }
    });

    // Only draw the player here if they are NOT in quicksand
    if (!player.inQuicksand) player.draw(ctx, cameraX);
    fg.drawQuicksand(ctx, cameraX);

    // 1. Calculate fade
    if (fadeOpacity < fadeTarget) fadeOpacity += fadeSpeed;
    if (fadeOpacity > fadeTarget) fadeOpacity -= fadeSpeed;
    fadeOpacity = Math.max(0, Math.min(1, fadeOpacity));

    // 2. Draw the overlay
    if (fadeOpacity > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 3. Perform the reset ONLY when the screen is fully black
    if (pendingLevelChange && fadeOpacity > 0.9) {
        fadeOpacity = 1; // Force it to 1 so it's fully black
        cameraX = 0;     // Reset camera view
        currentLevelNum++;
        loadLevel(currentLevelNum);

        // Reset player state
        player.isEndingLevel = false;
        player.shrinkScale = 1.0;
        player.rotation = 0;

        pendingLevelChange = false;
        fadeTarget = 0; // Fade back in
    }
} // <--- THIS BRACE CLOSES THE DRAW FUNCTION. DO NOT REMOVE.

function createShatterEffect(x, y) {
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            life: 30,
            color: '#bc4a24'
        });
    }
}

function createBubblePopEffect(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 15 + Math.random() * 10,
            color: 'rgba(255, 255, 255, 0.8)' // Semi-transparent white
        });
    }
}


function createOilSplash(x, y) {
    for (let i = 0; i < 3; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 10, // Spread across player width
            y: y,
            vx: (Math.random() - 0.5) * 2,     // Slight horizontal spread
            vy: -Math.random() * 3 - 2,        // Strong upward force
            life: 20 + Math.random() * 10,
            color: '#202020'                   // Matches groundColors.oil
        });
    }
}


function createIcePuff(x, y) {
    // 2-3 small particles per puff to keep it subtle
    for (let i = 0; i < 3; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 2 - 0.5, // Lower height than oil to simulate "sliding"
            life: 10 + Math.random() * 10,
            color: Math.random() > 0.5 ? '#ffffff' : '#a0d8f8' // White and Ice-Blue
        });
    }
}



function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function handlePlayerDeath(deathType) {
    // 1. Reset player state common to all deaths
    player.hasBow = false;
    player.bullets = 5;
    player.updateUI();
    projectiles = [];
    player.isStunned = false;
    player.stunTimer = 0;
    player.rotation = 0;
    player.stunCooldown = 0;
    player.inBubble = false;
    player.bubbleTimer = 0;

    // 2. PERMANENCE: Check if items were already collected
    if (fg && (collectedStars[currentLevelNum] || collectedLevelItems[currentLevelNum])) {
        fg.hasStar = true;
        fg.star = null;
    }

    // 3. CHECKPOINT LOGIC: Killed by standard Enemy
    if (deathType === 'enemy' || deathType === 'quicksand') {
        const cp = globalCheckpoints[currentLevelNum];

        if (cp) {
            // Respawn at checkpoint; timer continues
            player.x = cp.x;
            player.y = cp.y - player.height;
            player.velocityX = 0;
            player.velocityY = 0;
        }
        else if (currentLevelNum > 1 && globalCheckpoints[currentLevelNum - 1]) {
            // Fall back to previous level checkpoint; timer continues
            currentLevelNum--;
            loadLevel(currentLevelNum, true); // true keeps the current timer
            const prevCp = globalCheckpoints[currentLevelNum];
            player.x = prevCp.x;
            player.y = prevCp.y - player.height;
        }
        else {
            // No checkpoints: Start level 1 over
            loadLevel(1);
        }
    }

    // 4. RESTART LOGIC: Killed by Boss or Timer Ran Out
    else if (deathType === 'boss' || deathType === 'timeout') {
        // Back to level start; timer resets to 60
        loadLevel(currentLevelNum);
    }
}

function loadLevel(num, keepTimer = false) {
    currentLevelNum = num;
    bg = new Background(num, CANVAS_WIDTH, CANVAS_HEIGHT);
    fg = new Foreground(num);

    // Only reset timer if NOT told to keep it
    if (!keepTimer) {
        fg.resetTimer();
    }


    player.x = 125;
    player.y = 100;
    player.velocityX = 0;
    player.velocityY = 0;
    levelKills = 0;
    player.inBubble = false;

    projectiles = [];
    spawnEnemies();

    if (collectedLevelItems[num]) {
        fg.hasStar = true;
        fg.star = null;
    }

    const levelDisp = document.getElementById('level-display');
    if (levelDisp) {
        levelDisp.innerText = `Level 1-${num}${collectedStars[num] ? " ⭐" : ""}`;
    }

}

function spawnEnemies() {
    if (!fg || typeof fg.groundY === 'undefined') return;
    enemies = [];

    // 1. Handle Boss Spawning
    if (currentLevelNum % 3 === 0) {
        enemies.push(new Boss(fg.portal.x - 120, fg.groundY - 140));
    }

    // 2. Get the specific counts for the current level
    const counts = levelEnemies[currentLevelNum] || defaultEnemies;

    // 3. Helper function to spawn a specific type multiple times
    const spawnType = (type, count) => {
        for (let i = 0; i < count; i++) {
            // Randomly place between 400px and 150px before the portal
            const rx = 400 + (Math.random() * (fg.portal.x - 550));

            // Adjust height based on the enemy type (Spiders are shorter)
            const spawnY = type === 'spider' ? fg.groundY - 12 : fg.groundY - 24;

            enemies.push(new Enemy(type, rx, spawnY));
        }
    };

    // 4. Run the spawner for each type defined in your config
    Object.keys(counts).forEach(type => {
        spawnType(type, counts[type]);
    });
}