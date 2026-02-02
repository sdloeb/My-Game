/**
 * MODULE: ENEMY
 * Responsibility: AI movement, random squatting, and projectile attacks.
 * This file should be saved as enemy.js
 */
class Enemy {
    constructor(type, x, y, minX = null, maxX = null) {
        this.type = type; // 'skeleton', 'zombie', 'spider', 'fireMonster'
        this.x = x;
        this.y = y;
        this.minX = minX; // Movement boundary
        this.maxX = maxX; // Movement boundary
        this.velocityY = 0;

        // Skeletons and Zombies are tall; Spiders are wide and short
        this.width = type === 'spider' ? 20 : 16;
        this.height = type === 'spider' ? 12 : 24;
        this.normalHeight = this.height;
        this.squatHeight = type === 'spider' ? 8 : 12;

        // Stat variations
        this.speed = type === 'zombie' ? 0.25 : 0.5;
        this.dir = Math.random() > 0.5 ? 1 : -1;

        // State Management
        this.isSquatting = false;
        this.squatTimer = 0;
        this.shootTimer = 100 + Math.random() * 150;
        this.walkCounter = 0;
        this.onGround = false;
    }
    update(platforms, player, projectiles) {
        // --- 0. GRAVITY LOGIC ---
        this.velocityY += 0.25;
        this.y += this.velocityY;

        // Ground collision
        if (this.y + this.height > 192) { // 192 is 224 - 32
            this.y = 192 - this.height;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // --- 1. SQUAT / JUMP LOGIC ---
        if (this.type === 'fireMonster') {
            // Jumping logic: Jump randomly if on the ground
            if (this.onGround && Math.random() < 0.01) {
                this.velocityY = -5.5; // Upward force
                this.onGround = false;
            }
        } else {
            // Standard Squat logic for other enemies
            if (!this.isSquatting && Math.random() < 0.005) {
                this.isSquatting = true;
                this.squatTimer = 60;
                this.height = this.squatHeight;
                this.y += (this.normalHeight - this.squatHeight);
            }

            if (this.isSquatting) {
                this.squatTimer--;
                if (this.squatTimer <= 0) {
                    this.isSquatting = false;
                    this.y -= (this.normalHeight - this.squatHeight);
                    this.height = this.normalHeight;
                }
            }
        }

        // --- 2. MOVEMENT & SHOOTING ---
        if (!this.isSquatting) {
            this.x += this.speed * this.dir;
            this.walkCounter += 0.15;

            //fireenemy
            if (this.type === 'fireMonster' && this.minX !== null && this.maxX !== null) {
                if (this.x <= this.minX) {
                    this.dir = 1;
                } else if (this.x + this.width >= this.maxX) {
                    this.dir = -1;
                }
            }

            // Turn around if hitting a platform
            platforms.forEach(p => {
                const pW = p.w * 16;
                const pH = p.h * 16;
                if (this.y < p.y + pH && this.y + this.height > p.y) {
                    if (this.dir === 1 && this.x + this.width > p.x && this.x < p.x) this.dir = -1;
                    else if (this.dir === -1 && this.x < p.x + pW && this.x + this.width > p.x + pW) this.dir = 1;
                }
            });

            // --- WORLD BOUNDARY CHECK ---
            // Prevent enemies from walking past the portal (pixel 2800)
            if (this.x + this.width > 4500 && this.dir === 1) {
                this.dir = -1;
            }
            // Optional: Prevent them from walking off the left side of the map
            if (this.x < 0 && this.dir === -1) {
                this.dir = 1;
            }
        }

        this.shootTimer--;
        if (this.shootTimer <= 0) {
            this.shoot(projectiles);
            this.shootTimer = 120 + Math.random() * 200;
        }
    }

    shoot(projectiles) {
        // Only play sound if the enemy is within the camera view
        if (typeof playEnemyShootSound === 'function' && this.x + this.width > cameraX && this.x < cameraX + CANVAS_WIDTH) {
            playEnemyShootSound();
        }
        const bulletY = this.y + 6; // Fire from the face area

        if (this.type === 'fireMonster') {
            // Shoot in BOTH directions at once
            [-1, 1].forEach(fireDir => {
                projectiles.push({
                    x: fireDir === 1 ? this.x + this.width : this.x,
                    y: bulletY,
                    spawnX: this.x,
                    vx: fireDir * 2.5, // Sets the horizontal velocity
                    dir: fireDir,
                    isEnemyBullet: true,
                    isFireball: true,
                    color: '#f97316'
                });
            });
        } else {
            // Standard single-shot logic for skeletons, zombies, spiders
            const standardY = this.isSquatting ? this.y + 4 : this.y + 6;
            projectiles.push({
                x: this.dir === 1 ? this.x + this.width : this.x,
                y: standardY,
                spawnX: this.x,
                vx: this.dir * 2, // Sets the horizontal velocity
                dir: this.dir,
                isEnemyBullet: true,
                color: this.type === 'skeleton' ? '#fff' : (this.type === 'zombie' ? '#4ade80' : '#f87171')
            });
        }
    }

    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        // Don't draw if off-screen
        if (screenX + this.width < 0 || screenX > CANVAS_WIDTH) return;

        const limbSwing = Math.sin(this.walkCounter) * 4;

        ctx.save();
        ctx.translate(screenX, this.y);

        if (this.type === 'skeleton') {
            this.drawSkeleton(ctx, limbSwing);
        } else if (this.type === 'zombie') {
            this.drawZombie(ctx, limbSwing);
        } else if (this.type === 'spider') {
            this.drawSpider(ctx, limbSwing);
        } else if (this.type === 'fireMonster') {
            this.drawFireMonster(ctx, limbSwing);
        }

        ctx.restore();
    }

    drawSkeleton(ctx, limb) {
        const headBob = Math.sin(this.walkCounter) * 2;

        // 1. SKULL (Detailed with Jaw)
        ctx.fillStyle = '#f3f4f6'; // Clean bone white
        ctx.fillRect(4, 0 + headBob, 8, 5); // Cranium
        ctx.fillRect(5, 5 + headBob, 6, 2); // Upper Jaw

        // Eyes and Nasal Cavity
        ctx.fillStyle = '#000';
        ctx.fillRect(this.dir === 1 ? 9 : 5, 2 + headBob, 2, 2); // Eye
        ctx.fillRect(7, 4 + headBob, 1, 1); // Nose hole

        // 2. RIB CAGE (Using gaps to show "hollowness")
        ctx.fillStyle = '#e5e7eb'; // Slightly darker for depth
        ctx.fillRect(7, 7, 2, 9); // Spine
        // Individual Ribs
        ctx.fillRect(4, 8, 8, 1);
        ctx.fillRect(4, 11, 8, 1);
        ctx.fillRect(5, 14, 6, 1);

        // 3. PELVIS
        ctx.fillRect(5, 16, 6, 2);

        // 4. BONY LIMBS
        ctx.fillStyle = '#f3f4f6';

        if (this.isSquatting) {
            // Squatting Legs: Positioned at the bottom (y=10 to y=12)
            // Left Leg
            ctx.fillRect(2, 10, 4, 2);  // Thigh angled out
            ctx.fillRect(2, 11, 2, 1);  // Shin
            // Right Leg
            ctx.fillRect(10, 10, 4, 2); // Thigh angled out
            ctx.fillRect(12, 11, 2, 1); // Shin

            // Lowered Arms for squatting
            ctx.fillRect(this.dir === 1 ? 12 : 2, 4 + headBob, 2, 4);
        } else {
            // Standard walking limbs
            ctx.fillRect(this.dir === 1 ? 12 : 2, 8 + headBob, 2, 6); // Arms

            // Leg 1
            ctx.fillRect(4, 18, 2, 4 + limb);
            ctx.fillRect(4, 22 + limb, 3, 2); // Foot

            // Leg 2
            ctx.fillRect(10, 18, 2, 4 - limb);
            ctx.fillRect(10, 22 - limb, 3, 2); // Foot
        }

        // 5. THE LOWER JAW
        ctx.fillStyle = '#d1d5db';
        const jawOffset = this.isSquatting ? 0 : (headBob > 0 ? headBob : 0);
        ctx.fillRect(6, 6 + jawOffset, 4, 1);
    } // 




    drawZombie(ctx, limb) {
        const bounce = Math.abs(Math.sin(this.walkCounter)) * 2;
        const skinColor = '#4d7c0f'; // Rotten olive green
        const highlightSkin = '#a3e635'; // Sickly light green
        const bloodColor = '#7f1d1d'; // Dark dried blood
        const shirtColor = '#1e3a8a'; // Tattered blue shirt
        const pantsColor = '#422006'; // Filthy brown pants

        // 1. BACK ARM (Dangling/Broken)
        ctx.fillStyle = skinColor;
        if (!this.isSquatting) {
            // This arm is shorter and hangs limply behind
            ctx.fillRect(this.dir === 1 ? -2 : 14, 10 + (bounce * 0.5), 3, 6);
            ctx.fillStyle = bloodColor;
            ctx.fillRect(this.dir === 1 ? -2 : 14, 14 + (bounce * 0.5), 2, 1); // Blood on hand
        }

        // 2. LEGS (Asymmetrical Shambling)
        ctx.fillStyle = pantsColor;
        if (this.isSquatting) {
            ctx.fillRect(2, 8, 5, 4);
            ctx.fillRect(9, 8, 5, 4);
        } else {
            // Leg 1: Tattered but whole
            ctx.fillRect(3, 16, 4, 8 + limb);

            // Leg 2: Exposed bone at the knee
            ctx.fillRect(9, 16, 4, 8 - limb);
            ctx.fillStyle = '#f3f4f6'; // Exposed Bone (White)
            ctx.fillRect(10, 19 - (limb * 0.5), 2, 2);
            ctx.fillStyle = bloodColor;
            ctx.fillRect(9, 18 - (limb * 0.5), 4, 1); // Blood around the wound
        }

        // 3. TORSO (Tattered Shirt)
        ctx.fillStyle = shirtColor;
        ctx.fillRect(3, 8 + (bounce * 0.5), 10, 9);
        // Holes in shirt
        ctx.fillStyle = skinColor;
        ctx.fillRect(4, 11 + (bounce * 0.5), 2, 2); // Belly hole
        ctx.fillRect(9, 13 + (bounce * 0.5), 2, 1); // Shoulder tear

        // 4. HEAD (The "Death Stare")
        ctx.fillStyle = skinColor;
        ctx.fillRect(4, 0 + bounce, 8, 8); // Base head
        ctx.fillStyle = highlightSkin;
        ctx.fillRect(5, 0 + bounce, 3, 2); // Forehead highlight

        // Sunken Face
        ctx.fillStyle = '#000000';
        ctx.fillRect(4, 3 + bounce, 8, 2); // Eye sockets
        ctx.fillStyle = '#fefce8'; // Pale yellow/cloudy pupils
        ctx.fillRect(this.dir === 1 ? 9 : 5, 3 + bounce, 1, 1);

        // Slack Jaw with blood
        ctx.fillStyle = '#052e16'; // Inside mouth
        ctx.fillRect(5, 6 + bounce, 6, 2);
        ctx.fillStyle = bloodColor;
        ctx.fillRect(6, 7 + bounce, 2, 2); // Blood dripping from mouth

        // 5. FRONT ARM (Reaching/Grasping)
        if (!this.isSquatting) {
            ctx.fillStyle = skinColor;
            // Reaching out towards the player
            ctx.fillRect(this.dir === 1 ? 10 : -2, 9 + (bounce * 0.5), 8, 3);
            ctx.fillStyle = highlightSkin;
            ctx.fillRect(this.dir === 1 ? 15 : -2, 9 + (bounce * 0.5), 2, 1); // Finger highlight
        }
    }


    //SPIDER
    drawSpider(ctx, limb) {
        const headBob = Math.sin(this.walkCounter) * 1.5;
        const bodyColor = '#18181b'; // Dark charcoal
        const highlightColor = '#3f3f46'; // Lighter slate for depth

        // 1. ABDOMEN (The large back section)
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(12, 7 + headBob, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Add a small highlight on the abdomen
        ctx.fillStyle = highlightColor;
        ctx.fillRect(10, 4 + headBob, 3, 2);

        // 2. CEPHALOTHORAX (The head/front section)
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(6, 8 + headBob, 4, 0, Math.PI * 2);
        ctx.fill();

        // 3. EYES (Clustered spider eyes)
        ctx.fillStyle = '#ef4444'; // Piercing Red
        const eyeX = this.dir === 1 ? 7 : 3;
        // Main eyes
        ctx.fillRect(eyeX, 6 + headBob, 2, 2);
        // Secondary smaller eyes
        ctx.fillRect(eyeX + (this.dir === 1 ? -2 : 2), 5 + headBob, 1, 1);
        ctx.fillRect(eyeX + (this.dir === 1 ? -1 : 1), 8 + headBob, 1, 1);

        // 4. SEGMENTED LEGS (With joints)
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = 2;

        for (let i = 0; i < 4; i++) {
            const spacing = i * 3;

            // --- Left Legs ---
            ctx.beginPath();
            ctx.moveTo(8, 7 + headBob); // Start at body
            // Joint (Elbow)
            const lxJoint = 2 - (i * 1);
            const lyJoint = 2 + spacing + (i === 0 ? limb : -limb);
            ctx.lineTo(lxJoint, lyJoint);
            // Tip (Foot)
            ctx.lineTo(lxJoint - 4, 12);
            ctx.stroke();

            // --- Right Legs ---
            ctx.beginPath();
            ctx.moveTo(12, 7 + headBob); // Start at body
            // Joint (Elbow)
            const rxJoint = 16 + (i * 1);
            const ryJoint = 2 + spacing + (i === 0 ? -limb : limb);
            ctx.lineTo(rxJoint, ryJoint);
            // Tip (Foot)
            ctx.lineTo(rxJoint + 4, 12);
            ctx.stroke();
        }
    }

    drawFireMonster(ctx, limb) {
        const time = Date.now();
        const bob = Math.sin(time / 150) * 2;

        // 1. THE "CHARRED LOG" CORE
        // We draw crossed logs instead of a block for a more realistic bonfire look
        ctx.fillStyle = '#0f172a'; // Deep charred black
        ctx.save();
        ctx.translate(8, 16 + bob);
        ctx.rotate(0.4); ctx.fillRect(-6, -1, 12, 3); // Log 1
        ctx.rotate(-0.8); ctx.fillRect(-6, -1, 12, 3); // Log 2
        ctx.restore();

        // 2. BURNT TWIG LIMBS
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#18181b';
        ctx.beginPath();
        ctx.moveTo(4, 12 + bob); ctx.lineTo(-4, 6 + bob + Math.sin(time / 100) * 3); // Left Arm
        ctx.moveTo(12, 12 + bob); ctx.lineTo(20, 6 + bob + Math.cos(time / 100) * 3); // Right Arm
        ctx.moveTo(6, 20 + bob); ctx.lineTo(6 - limb, 24); // Left Leg
        ctx.moveTo(10, 20 + bob); ctx.lineTo(10 + limb, 24); // Right Leg
        ctx.stroke();

        // 3. FLAME LICK LOGIC (With Alpha Bloom)
        const drawFlameLick = (offset, height, speed, color, alpha = 1.0, scale = 1.0) => {
            const flicker = Math.sin((time * speed) + offset) * (4 * scale);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(8 + offset - (4 * scale), 20 + bob);
            ctx.quadraticCurveTo(8 + offset + flicker, 10 + bob, 8 + offset, 20 - (height * scale) + bob + flicker);
            ctx.quadraticCurveTo(8 + offset - flicker, 10 + bob, 8 + offset + (4 * scale), 20 + bob);
            ctx.fill();
        };

        // --- LAYER 1: OUTER HEAT GLOW (Semi-transparent, larger) ---
        drawFlameLick(-5, 18, 0.008, '#991b1b', 0.3, 1.3);
        drawFlameLick(5, 20, 0.007, '#991b1b', 0.3, 1.3);

        // --- LAYER 2: MAIN BONFIRE FLAMES ---
        drawFlameLick(-5, 15, 0.008, '#ea580c'); // Deep Orange
        drawFlameLick(5, 18, 0.007, '#f97316'); // Bright Orange
        drawFlameLick(0, 22, 0.009, '#fb923c'); // Golden Orange

        // --- LAYER 3: HOT YELLOW CORE ---
        drawFlameLick(-2, 10, 0.012, '#fde047');
        drawFlameLick(3, 12, 0.011, '#fef08a');

        // --- LAYER 4: HOTTEST BASE (Blue & White) ---
        drawFlameLick(0, 6, 0.02, '#38bdf8', 0.6, 0.5); // Blue root
        drawFlameLick(0, 4, 0.025, '#ffffff', 0.8, 0.3); // White heart

        ctx.globalAlpha = 1.0;

        // 4. SCARY FACE (Flickering eyes and coal mouth)
        const eyeColor = () => Math.random() > 0.8 ? '#ffffff' : (Math.random() > 0.5 ? '#fde047' : '#f97316');
        ctx.fillStyle = eyeColor(); ctx.fillRect(4, 10 + bob, 3, 3); // Left Eye
        ctx.fillStyle = eyeColor(); ctx.fillRect(9, 10 + bob, 3, 3); // Right Eye

        ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(3, 9 + bob); ctx.lineTo(7, 11 + bob);  // Left Brow
        ctx.moveTo(13, 9 + bob); ctx.lineTo(9, 11 + bob); // Right Brow
        ctx.stroke();

        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1; ctx.beginPath(); // Glowing Mouth
        ctx.moveTo(4, 16 + bob); ctx.lineTo(6, 18 + bob); ctx.lineTo(8, 15 + bob); ctx.lineTo(10, 18 + bob); ctx.lineTo(12, 16 + bob);
        ctx.stroke();

        // 5. SMOKE & SPARKS
        for (let i = 0; i < 4; i++) {
            const sparkX = (Math.sin(time / 200 + i) * 10) + 8;
            const sparkY = (time / 5 + i * 15) % 50;
            const progress = sparkY / 50;

            // Draw Smoke (Dark Grey Puffs)
            ctx.fillStyle = '#334155';
            ctx.globalAlpha = (1 - progress) * 0.4;
            ctx.beginPath(); ctx.arc(sparkX + (Math.sin(time / 100) * 3), 15 + bob - sparkY, 3 + progress * 4, 0, Math.PI * 2); ctx.fill();

            // Draw Sparks (Bright Embers)
            ctx.fillStyle = '#fefce8';
            ctx.globalAlpha = 1 - progress;
            ctx.fillRect(sparkX, 20 + bob - sparkY, 1.5, 1.5);
        }
        ctx.globalAlpha = 1.0;
    }
}

class Boss {
    constructor(x, y) {
        this.originX = x;
        // In game.js, y is passed as fg.groundY - 140, so this restores ground level
        this.groundY = y + 140;
        this.x = x;
        this.y = this.groundY + 50;
        this.width = 20;
        this.height = 40;
        this.health = 3;
        this.isBoss = true;
        this.shakeTimer = 0;
        this.flashTimer = 0; // ADD THIS LINE

        // --- States: 'hidden', 'emerging', 'turning', 'diving' ---
        this.state = 'hidden';
        this.stateTimer = 60;

        // --- Path Following (Segment History) ---
        this.history = [];
        this.historyLimit = 100; // Enough frames to cover the whole snake
        this.numSegments = 10;
        this.spacing = 6; // Number of frames between each segment

        // --- U-Turn Config ---
        this.turnRadius = 40;
        this.turnCenterX = 0;
        this.turnCenterY = 0;
        this.turnAngle = 0;

        this.shootTimer = 40;
    }

    update(projectiles, player) {
        if (this.shakeTimer > 0) this.shakeTimer--;
        if (this.flashTimer > 0) this.flashTimer--;

        // Track path history
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.historyLimit) this.history.shift();

        switch (this.state) {
            case 'hidden':
                this.stateTimer--;
                if (this.stateTimer <= 0) {
                    // --- CONFINED SPAWN AREA (Right of Gate) ---
                    // Gate is at originX + 5. We start 10px past it.
                    const minSpawnX = this.originX + 40;
                    const spawnRange = 120;

                    this.x = minSpawnX + (Math.random() * spawnRange);
                    this.turnRadius = 30 + Math.random() * 20; // Randomizes how wide and high the snake jumps

                    this.y = this.groundY + 20;
                    this.state = 'emerging';
                    this.history = []; // Reset path for the new run
                }
                break;

            case 'emerging':
                this.y -= 2.5; // Rise vertically
                // 3/4 way up the screen (Canvas is 224 high, 3/4 is ~56 from top)
                if (this.y <= 10) {
                    this.state = 'turning';
                    this.turnCenterX = this.x + this.turnRadius;
                    this.turnCenterY = this.y;
                    this.turnAngle = Math.PI; // Start at the left of the U-turn
                }
                break;

            case 'turning':
                // Move in a semi-circle to the right
                this.turnAngle -= 0.05;
                this.x = this.turnCenterX + Math.cos(this.turnAngle) * this.turnRadius;
                this.y = this.turnCenterY + Math.sin(this.turnAngle) * this.turnRadius;

                if (this.turnAngle <= 0) {
                    this.state = 'diving';
                }
                break;

            case 'diving':
                this.y += 3; // Dive back into the ground
                // Check if the tail (the oldest position in history) has submerged
                const tailPos = this.history[0];
                if (tailPos && tailPos.y > this.groundY + 20) {
                    this.state = 'hidden';
                    this.stateTimer = 0;
                    this.history = [];
                }
                break;
        }

        // Shooting logic (only while above ground)
        if (this.state !== 'hidden' && this.y < this.groundY) {
            this.shootTimer--;
            if (this.shootTimer <= 0) {
                this.shoot(projectiles, player);
                this.shootTimer = 70;
            }
        }
    }

    shoot(projectiles, player) {
        // Only play sound if the boss is within the camera view
        if (typeof playEnemyShootSound === 'function' && this.x + this.width > cameraX && this.x < cameraX + CANVAS_WIDTH) {
            playEnemyShootSound();
        }

        const dx = player.x - this.x;
        const vx = dx * 0.02;
        projectiles.push({
            x: this.x + 20, y: this.y + 10,
            spawnX: this.x, vx: vx, vy: -2,
            isEnemyBullet: true, isGrenade: true, fromBoss: true,
            color: '#bef264'
        });
    }

    takeDamage() {
        // Only vulnerable if head is above ground
        if (this.state === 'hidden' || this.y > this.groundY) return false;
        this.health--;
        this.shakeTimer = 15;
        this.flashTimer = 15;
        // Retreat early if hit
        if (this.state === 'emerging' || this.state === 'turning') this.state = 'diving';
        return this.health <= 0;
    }

    getTailPosition() {
        // The tail is the last segment in the chain
        const index = this.history.length - 1 - ((this.numSegments - 1) * this.spacing);
        if (index < 0) return null;
        return this.history[index];
    }

    draw(ctx, cameraX) {
        if (this.state === 'hidden' && this.history.length === 0) return;

        let shakeX = (this.shakeTimer > 0) ? (Math.random() - 0.5) * 12 : 0;

        // Replace the contents of the Boss.draw loop with this:
        for (let i = this.numSegments - 1; i >= 0; i--) {
            const index = this.history.length - 1 - (i * this.spacing);
            if (index < 0) continue;

            const pos = this.history[index];
            const screenX = pos.x - cameraX + (i === 0 ? shakeX : 0);

            ctx.save();
            ctx.translate(screenX, pos.y);

            // Reduced segment shrinking factor to keep tail visible at smaller width
            const size = this.width - (i * 1.2);
            const glow = Math.abs(Math.sin(Date.now() / 300 + i)) * 40;

            if (i === 0) {
                // --- SCARY ANACONDA HEAD (Half Size) ---
                if (Math.sin(Date.now() / 100) > 0.7) {
                    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(10, -8);
                    ctx.moveTo(10, -8); ctx.lineTo(8, -12);
                    ctx.moveTo(10, -8); ctx.lineTo(12, -12); ctx.stroke();
                }

                ctx.fillStyle = '#14532d';
                ctx.beginPath();
                ctx.moveTo(0, 7); ctx.lineTo(10, -2); ctx.lineTo(20, 7); ctx.lineTo(10, 12);
                ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1; ctx.stroke();

                const eyePulse = 150 + Math.sin(Date.now() / 150) * 100;
                ctx.fillStyle = `rgb(255, ${eyePulse}, 0)`;
                ctx.beginPath(); ctx.ellipse(6, 4, 1.5, 2.5, 0.2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(14, 4, 1.5, 2.5, -0.2, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.fillRect(5.5, 2.5, 1, 3); ctx.fillRect(13.5, 2.5, 1, 3);

                // Locate the tail drawing section inside draw(ctx, cameraX) (around line 391)
            } else if (i === this.numSegments - 1) {
                // --- TAIL TARGET BALL ---
                const pulse = Math.abs(Math.sin(Date.now() / 200));

                // Determine color based on flashTimer
                const isFlashing = this.flashTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0;
                const ballColor = isFlashing ? '#ffffff' : '#ef4444';
                const glowColor = isFlashing ? 'rgba(255, 255, 255, 0.6)' : `rgba(255, 0, 0, ${0.2 + (pulse * 0.4)})`;

                ctx.fillStyle = glowColor;
                ctx.beginPath();
                ctx.arc(10, 6, 6 + (pulse * 3), 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = ballColor; // USES THE FLASH COLOR
                ctx.beginPath();
                ctx.arc(10, 6, 4, 0, Math.PI * 2);
                ctx.fill();

                // Only draw the inner blink if not flashing white
                if (!isFlashing && Date.now() % 500 < 250) {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(10, 6, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // --- BODY SEGMENTS (Half Size) ---
                ctx.fillStyle = '#064e3b';
                ctx.beginPath();
                ctx.ellipse(10, 6, size / 2, 5.5, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `rgb(${101 + glow}, ${163 + glow}, 13)`;
                ctx.fillRect(10 - (size / 4), 4, size / 2, 1);
                ctx.fillRect(10 - (size / 6), 7, size / 3, 1);
            }
            ctx.restore();
        }
    }


}
