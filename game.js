// 1. GLOBAL CONSTANTS & VARIABLES
let CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 224;

let audioCtx;
let activeJumpOsc = null;
let collectedLevelWeapons = {}; // Stores { level: true } if the weapon is found

function playPlayerShootSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    // A quick, sharp downward slide for the player's shot
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(now + 0.1);
}

function playEnemyShootSound() {
    if (!audioCtx) return;
    // Ensure the audio context is active
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // A sharper "pop" sound for enemies
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    gain.gain.setValueAtTime(0.12, now); // Increased volume
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(now + 0.12);
}


function playBossHitSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // A deeper, more "crunchy" sound for bosses
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(now + 0.2);
}

function playEnemySound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(20, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function playSecretSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    osc.type = 'square';
    // A quick rising "power-up" sequence
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.setValueAtTime(554.37, now + 0.05); // C#5
    osc.frequency.setValueAtTime(659.25, now + 0.10); // E5
    osc.frequency.setValueAtTime(880, now + 0.15); // A5

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(now + 0.3);
}

function playPortalSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // We play a sequence of 12 very fast notes to create the "spiral" effect
    for (let i = 0; i < 12; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'square';
        // The pitch jumps up in a pattern (Arpeggio)
        // This math creates a rapidly ascending series of notes
        const freq = 220 * Math.pow(1.5, i);
        osc.frequency.setValueAtTime(freq, now + (i * 0.06));

        gain.gain.setValueAtTime(0.05, now + (i * 0.06));
        gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.06) + 0.05);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + (i * 0.06));
        osc.stop(now + (i * 0.06) + 0.05);
    }
}

function playKeySound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    osc.type = 'square';
    // A quick 3-note ascending arpeggio (C6, E6, G6)
    // This is higher and faster than the coin for a "special" feel
    osc.frequency.setValueAtTime(1046.50, now);      // C6
    osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6
    osc.frequency.setValueAtTime(1567.98, now + 0.12); // G6

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(now + 0.2);
}

function playCoinSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Classic 8-bit coin: Square wave with a quick frequency jump
    osc.type = 'square';
    const now = audioCtx.currentTime;

    // Start at a mid-note and quickly jump to a high-note
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.05); // E6

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(now + 0.15);
}

// [Add after playCoinSound() around line 188]
function playPowerRechargeSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Fast, aggressive upward slide for an "energized" feel
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.4);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(now + 0.4);
}

// [Add after playPowerRechargeSound() around line 208]
function playFireAmmoSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    // 1. Start Low
    osc.frequency.setValueAtTime(150, now);
    // 2. Ramp Up to 1500Hz at the midpoint (0.2s)
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.2);
    // 3. Ramp Back Down to 150Hz at the end (0.4s)
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.4);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(now + 0.4);
}

function playJumpSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    activeJumpOsc = osc; // Store the current jump sound

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
    osc.onended = () => { if (activeJumpOsc === osc) activeJumpOsc = null; };
}

let activeIceSound = null;

function playIceSlideSound(active) {
    if (!audioCtx) return;

    // If active is true and sound isn't already playing, start it
    if (active && !activeIceSound) {
        const bufferSize = audioCtx.sampleRate * 0.5; // 0.5 second loop
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        activeIceSound = audioCtx.createBufferSource();
        activeIceSound.buffer = buffer;
        activeIceSound.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, audioCtx.currentTime);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);

        activeIceSound.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        activeIceSound.start();
    }
    // If active is false and sound is playing, stop it
    else if (!active && activeIceSound) {
        activeIceSound.stop();
        activeIceSound = null;
    }
}

function playQuicksandSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const duration = 0.4;

    // Create raw white noise (the "hiss" needed for wetness)
    const noise = audioCtx.createBufferSource();
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    // Use a Bandpass filter with extremely high resonance (Q)
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 30;
    filter.frequency.setValueAtTime(150, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + duration);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, now);

    // Rapid jitter/pulsing to simulate the sound of breaking surface tension
    for (let i = 0; i < 12; i++) {
        const t = now + (i * duration / 12);
        gain.gain.linearRampToValueAtTime(Math.random() * 0.2 + 0.05, t);
    }
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noise.start();
    noise.stop(now + duration);
}


function playDeathSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Classic 8-bit descent: Square wave that slides from mid-pitch to very low
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(300, now + 0.1); // Short pause at the start
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.6); // Long slide down

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(now + 0.6);
}


function playBrickSound() {
    if (!audioCtx) return;
    if (activeJumpOsc) {
        try { activeJumpOsc.stop(); } catch (e) { }
        activeJumpOsc = null;
    }

    const duration = 0.15;
    const osc = audioCtx.createOscillator();
    const noise = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();

    // 1. Create a low-frequency square wave for the "impact"
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + duration);

    // 2. Create a short burst of noise for the "shatter"
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gain);
    noise.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    noise.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playBubbleSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // A light, "popping" sine wave sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(now + 0.1);
}

function playPopSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // SINE wave creates a clear, liquid "pop" sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.04); // Fast upward slide

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(now + 0.04);
}


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
let lastBrickSoundTime = 0;

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
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
        if (typeof playOilSound === 'function') playOilSound(); // Triggers the audio
    });


    // Listen for ice events
    window.addEventListener('icePuff', (e) => {
        createIcePuff(e.detail.x, e.detail.y);
    });

    // Listen for player shooting events
    window.addEventListener('playerShoot', (e) => {
        if (typeof playPlayerShootSound === 'function') playPlayerShootSound();
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

    // Handle brick-breaking logic (Head Bonks)
    window.addEventListener('brickHit', (e) => {
        // 1. SOUND COOLDOWN LOGIC
        const now = Date.now(); // First declaration is fine
        if (now - lastBrickSoundTime > 150) { // Increased cooldown to 150ms to prevent double triggers
            // A head bonk is always the player, so we just play the sound.
            if (typeof playBrickSound === 'function') playBrickSound();
            lastBrickSoundTime = now;
        }

        const plat = e.detail.platform;

        // 2. SAFETY: Initialize hits if missing (default to 2)
        if (plat.hits === undefined) plat.hits = 2;

        // 3. COLLISION COOLDOWN: Prevent the brick from taking 2 hits in one jump
        // REMOVED 'const' here because 'now' is already defined at the top of this function
        if (plat.lastHitTime && now - plat.lastHitTime < 100) return;
        plat.lastHitTime = now;

        // 3. CRACK LOGIC: If it has hits left, crack it and stop
        if (!plat.isSecret && plat.hits > 1) {
            plat.hits--;
            createShatterEffect(plat.x + 8, plat.y + 8); // Dust puff
            return;
        }

        // 4. DESTRUCTION LOGIC: (The "Pop" on the 2nd hit)
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
    if (fg.level === 1 && !fg.bird && player.x > fg.portalX - 550) { // Bird spawns earlier
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
        // CHANGED: Use !fg.portalLocked instead of fg.hasStar
        if (!fg.portalLocked) {
            player.startPortalSuck(fg.portal.x, fg.portal.y);
        } else {
            const timerElement = document.getElementById('timer-display');
            if (timerElement) {
                // CHANGED: Update the message to reflect the actual requirement
                timerElement.innerText = "NEED KEY!";
                timerElement.style.color = "#ffff00";
            }
        }
    }

    if (distance < 20 && !player.isEndingLevel) {
        if (fg.hasStar || !fg.portalLocked) {
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
            if (p.isEnemyBullet) return; // Skip enemy bullets hitting themselves

            let hit = false;

            // --- NEW: Level 1-3 Boss Tail Collision ---
            if (en.isBoss && fg.level === 3 && p.isArrow) {
                const tailPos = en.getTailPosition();
                if (tailPos) {
                    // Check distance between grenade and the tail ball (offsets match draw logic)
                    const dx = p.x - (tailPos.x + 10);
                    const dy = p.y - (tailPos.y + 6);
                    if (Math.sqrt(dx * dx + dy * dy) < 18) hit = true;
                }
            }
            // --- DEFAULT: Standard Bounding Box (Minions & Level 1 Boss) ---
            else if (p.x > en.x && p.x < en.x + en.width &&
                p.y > en.y && p.y < en.y + en.height) {
                hit = true;
            }

            if (hit) {
                if (en.isBoss) {
                    const isDead = en.takeDamage();
                    if (typeof playPopSound === 'function') playPopSound();
                    projectiles.splice(pIdx, 1);
                    if (isDead) {
                        createShatterEffect(en.x + en.width / 2, en.y + en.height / 2);
                        enemies.splice(eIdx, 1);
                        // NEW: Drop the key to unlock the portal
                        fg.dropKey();
                    }
                } else {
                    // Standard Minion Death logic
                    if (typeof playEnemySound === 'function') playEnemySound();
                    createShatterEffect(en.x + en.width / 2, en.y + en.height / 2);
                    enemies.splice(eIdx, 1);
                    projectiles.splice(pIdx, 1);
                    levelKills++;
                    if (en.type === 'fireMonster') {
                        fg.dropAmmo(en.x + en.width / 2, en.y + en.height / 2, true);
                    } else {
                        // Drop ammo for all other standard enemies
                        fg.dropAmmo(en.x + en.width / 2, en.y + en.height / 2, false);
                    }
                    if (levelKills % 4 === 0) {
                        activeBubbles.push({
                            x: cameraX + 220,
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

                    // Trigger the new liquid "pop" sound instead of the boss hit sound
                    if (typeof playPopSound === 'function') playPopSound();

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
                if (typeof playBossHitSound === 'function') playBossHitSound();


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
                    // Pass 'enemy' so it always uses the checkpoint logic instead of restarting the level
                    handlePlayerDeath('enemy');
                    return; // Added safety return to prevent the freeze mentioned earlier
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
                    // Only play sound if it's the Player (!p.isEnemyBullet) or the Fire Monster (p.isFireball)
                    if (typeof playBrickSound === 'function' && (!p.isEnemyBullet || p.isFireball)) playBrickSound();

                    // Only trigger the flag if the Player (!p.isEnemyBullet) or a Fireball (p.isFireball) hits the brick
                    if (plat.isCheckpointCandidate && (!p.isEnemyBullet || p.isFireball)) {
                        fg.activeFlag = { x: plat.x, y: plat.y - 40, collected: false };
                    }

                    // UPDATED: Bullet Hit Logic with Cooldown and 2-hit destruction
                    // Only allow player bullets (!p.isEnemyBullet) OR Fireballs (p.isFireball) to crack bricks
                    if (!plat.isSecret && (!p.isEnemyBullet || p.isFireball)) {
                        const now = Date.now();
                        // Initialize hits if missing
                        if (plat.hits === undefined) plat.hits = 2;

                        // Check cooldown to prevent double-decrement from high-speed bullets
                        if (!plat.lastHitTime || now - plat.lastHitTime >= 100) {
                            plat.lastHitTime = now;

                            if (plat.hits > 1) {
                                plat.hits--;
                                createShatterEffect(p.x, p.y);
                            } else {
                                // Final Hit Destruction
                                if (plat.isCheckpointCandidate) {
                                    fg.activeFlag = { x: plat.x, y: plat.y - 40, collected: false };
                                }
                                if (plat.hasClock) {
                                    fg.clock = { x: plat.x, y: plat.y, collected: false };
                                    fg.platforms.forEach(other => { other.hasClock = false; });
                                }
                                createShatterEffect(plat.x + 8, plat.y + 8);
                                fg.platforms.splice(j, 1);
                            }
                        }
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

    // ADD THIS: Update building signals in Level 1
    // Update background signals for secret detection on all levels
    bg.updateSignals(cameraX, fg.structures);

    for (let i = activeBubbles.length - 1; i >= 0; i--) {
        let b = activeBubbles[i];
        b.y += b.vy;
        b.x += b.vx + Math.sin(Date.now() / 500) * 0.5; // Wobble effect

        // Collision with player
        let dist = Math.sqrt(Math.pow((player.x + 8) - b.x, 2) + Math.pow((player.y + 12) - b.y, 2));
        if (dist < b.radius) {
            if (typeof playBubbleSound === 'function') playBubbleSound();
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

    // 1. Draw Background
    bg.draw(ctx, cameraX);

    // 2. Draw the Portal (Now at the back of the "middle" layer)
    fg.drawPortal(ctx, cameraX);

    // 3. Draw the Boss (In front of the portal, but not the ground yet)
    enemies.filter(en => en.isBoss).forEach(en => en.draw(ctx, cameraX));

    // 4. Draw the Foreground (Ground, platforms, and items)
    // Because this is drawn last, the ground will cover the snake's tail
    fg.draw(ctx, cameraX);

    // 5. Draw standard enemies and particles on the very top
    enemies.filter(en => !en.isBoss).forEach(en => en.draw(ctx, cameraX));

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
            ctx.rotate(Math.atan2(p.vy, p.vx));

            if (fg.level === 2) {
                // --- FLYING DART (Level 1-2) ---
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(-4, -1, 10, 2);
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.moveTo(6, -2); ctx.lineTo(10, 0); ctx.lineTo(6, 2);
                ctx.fill();
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.moveTo(-4, 0); ctx.lineTo(-9, -4); ctx.lineTo(-9, 4);
                ctx.fill();
            } else if (fg.level === 3) {
                // --- FLYING GRENADE (Level 1-3) ---
                ctx.fillStyle = '#365314'; // Army Green
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2); // Round grenade body
                ctx.fill();
                ctx.fillStyle = '#94a3b8'; // Metal pin
                ctx.fillRect(-2, -5, 2, 2);
            } else {
                // --- FLYING ARROW (Level 1-1) ---
                ctx.fillStyle = '#7c2d12';
                ctx.fillRect(-8, -1, 12, 2);
                ctx.fillStyle = '#d1d5db';
                ctx.beginPath();
                ctx.moveTo(4, -3); ctx.lineTo(10, 0); ctx.lineTo(4, 3);
                ctx.fill();
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(-10, -2, 3, 1);
                ctx.fillRect(-10, 1, 3, 1);
            }
            ctx.restore();
        } else {
            // Standard enemy or player bullets
            if (p.isFireball) {
                // --- DRAWING THE FIREBALL ---
                const time = Date.now() / 50;
                ctx.save();
                ctx.translate(p.x - cameraX, p.y);

                // Outer flickering orange glow
                ctx.fillStyle = '#ea580c';
                ctx.beginPath();
                ctx.arc(0, 0, 4 + Math.sin(time) * 2, 0, Math.PI * 2);
                ctx.fill();

                // Inner yellow core
                ctx.fillStyle = '#fde047';
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI * 2);
                ctx.fill();

                // Small dark red flame trail
                ctx.fillStyle = '#991b1b';
                ctx.fillRect(p.dir === 1 ? -6 : 2, -1, 4, 2);

                ctx.restore();
            } else {
                // Normal rectangular bullet for other enemies
                ctx.fillStyle = p.color || '#ffffff';
                ctx.fillRect(p.x - cameraX, p.y, 4, 2);
            }
        }
    });

    // Only draw the player here if they are NOT in quicksand
    player.draw(ctx, cameraX);
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
    if (typeof playIceSlideSound === 'function') playIceSlideSound(false);
    if (typeof playDeathSound === 'function') playDeathSound();

    // 1. RESET ALL PLAYER STATES (Crucial so you don't respawn stunned/trapped)
    player.isEndingLevel = false;
    player.shrinkScale = 1.0;
    player.rotation = 0;
    player.isStunned = false;
    player.stunTimer = 0;
    player.stunCooldown = 0;
    player.inBubble = false;
    player.bubbleTimer = 0;
    projectiles = [];

    // 2. STAR PERMANENCE
    // Ensures stars don't reappear if they were already collected
    if (fg && collectedStars[currentLevelNum]) {
        fg.hasStar = true;
        fg.star = null;
    }

    // 3. CHECKPOINT LOGIC
    if (deathType === 'enemy' || deathType === 'quicksand') {
        const cp = globalCheckpoints[currentLevelNum];

        if (cp) {
            // NEW: Fire Monster Ammo Logic
            const wentBackBeforeFireMonster = (fg && fg.fireAmmoCollectedX !== -1 && cp.x < fg.fireAmmoCollectedX);

            if (wentBackBeforeFireMonster) {
                // If the checkpoint is behind the kill-site, reset and reload the level to respawn the monster
                collectedLevelItems[currentLevelNum] = false;
                loadLevel(currentLevelNum, true); // Keep the timer running

                player.x = cp.x;
                player.y = cp.y - player.height;
                player.hasBow = false; // Player must fight the Fire Monster again
                player.heavyAmmo = 0;
            } else {
                // If checkpoint is after the kill-site, keep the weapon and ammo
                player.x = cp.x;
                player.y = cp.y - player.height;

                if (collectedLevelItems[currentLevelNum]) {
                    player.hasBow = true;
                    fg.hasKey = true;
                    if (player.heavyAmmo <= 0) player.heavyAmmo = 3;
                }

                // 2. Restore WEAPON status ONLY if they picked it up at the end
                if (collectedLevelWeapons[currentLevelNum]) {
                    player.hasBow = true; // Reactivates the Bow/Gun visual and logic
                } else {
                    player.hasBow = false; // Ensures they don't get it for free
                }


            }

            player.velocityX = 0;
            player.velocityY = 0;
            player.updateUI();
            return;
        }
        // 4. FALLBACK: Go to previous level's checkpoint if this level has none
        else if (currentLevelNum > 1 && globalCheckpoints[currentLevelNum - 1]) {
            currentLevelNum--;
            loadLevel(currentLevelNum, true);
            const prevCp = globalCheckpoints[currentLevelNum];
            player.x = prevCp.x;
            player.y = prevCp.y - player.height;
            return;
        }
    }

    // 5. FULL RESTART (For Boss, Timeout, or no checkpoints found)
    player.hasBow = false; // Reset equipment for full restart
    player.bullets = 0;
    player.heavyAmmo = 0;
    loadLevel(currentLevelNum);
}

function loadLevel(num, keepTimer = false) {
    currentLevelNum = num;
    bg = new Background(num, CANVAS_WIDTH, CANVAS_HEIGHT);
    fg = new Foreground(num);

    // Only reset timer if NOT told to keep it
    if (!keepTimer) {
        fg.resetTimer();
    }


    player.x = 125; // change starting position back to 125 end to 4500
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
        enemies.push(new Boss(fg.portalX - 180, fg.groundY - 140));
    }

    // 2. Get the specific counts for the current level
    const counts = levelEnemies[currentLevelNum] || defaultEnemies;

    // 3. Create a list of all minion types to be spawned for the level
    let minionList = [];
    Object.keys(counts).forEach(type => {
        for (let i = 0; i < counts[type]; i++) {
            minionList.push(type);
        }
    });

    // Shuffle the list so the order of skeletons/zombies/spiders is random
    minionList.sort(() => Math.random() - 0.5);

    // 4. Segmented Spawning: Divide the map into equal zones
    const spawnStart = 400;
    const spawnEnd = fg.portalX - 900;
    const totalDist = spawnEnd - spawnStart;
    const segmentWidth = totalDist / minionList.length;

    minionList.forEach((type, i) => {
        // Each enemy is assigned to its own segment of the map
        const segmentX = spawnStart + (i * segmentWidth);
        // Randomize position strictly WITHIN its segment to prevent clumping
        const rx = segmentX + (Math.random() * (segmentWidth - 20));

        const spawnY = type === 'spider' ? fg.groundY - 12 : fg.groundY - 24;
        enemies.push(new Enemy(type, rx, spawnY));
    });

    const secSize = fg.portalX / 9;
    const minX = secSize * 3; // Start of section 4
    const maxX = secSize * 6; // End of section 6
    const fireX = minX + Math.random() * (maxX - minX - 16);
    enemies.push(new Enemy('fireMonster', fireX, fg.groundY - 24, minX, maxX));

} // This brace closes spawnEnemies correctly

// --- NOW THESE ARE IN THE GLOBAL SCOPE SO THE GAME CAN FIND THEM ---

function playOilSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // 1. Thick liquid "Bloop"
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(); osc.stop(now + 0.15);

    // 2. Short "Squelch" noise
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const ng = audioCtx.createGain();
    ng.gain.setValueAtTime(0.05, now);
    ng.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    noise.connect(ng);
    ng.connect(audioCtx.destination);
    noise.start(); noise.stop(now + 0.05);
}

function createOilSplash(x, y) {
    for (let i = 0; i < 3; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 2,
            life: 20 + Math.random() * 10,
            color: '#202020'
        });
    }
}