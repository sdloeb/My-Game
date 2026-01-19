/**
 * MODULE: ENEMY
 * Responsibility: AI movement, random squatting, and projectile attacks.
 * This file should be saved as enemy.js
 */
class Enemy {
    constructor(type, x, y) {
        this.type = type; // 'skeleton', 'zombie', 'spider'
        this.x = x;
        this.y = y;
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
    }
    update(platforms, player, projectiles) {
        // --- 0. GRAVITY LOGIC ---
        this.velocityY += 0.25;
        this.y += this.velocityY;

        // Ground collision
        if (this.y + this.height > 192) { // 192 is 224 - 32
            this.y = 192 - this.height;
            this.velocityY = 0;
        }

        // --- 1. SQUAT LOGIC ---
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

        // --- 2. MOVEMENT & SHOOTING ---
        if (!this.isSquatting) {
            this.x += this.speed * this.dir;
            this.walkCounter += 0.15;

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
            // Prevent enemies from walking past the portal (pixel 3000)
            if (this.x + this.width > 3000 && this.dir === 1) {
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
        // Bullet spawns at face height; if squatting, bullet spawns lower
        const bulletY = this.isSquatting ? this.y + 4 : this.y + 6;
        projectiles.push({
            x: this.dir === 1 ? this.x + this.width : this.x,
            y: bulletY,
            spawnX: this.x,
            dir: this.dir,
            speed: 2,
            isEnemyBullet: true,
            color: this.type === 'skeleton' ? '#fff' : (this.type === 'zombie' ? '#4ade80' : '#f87171')
        });
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
}


class Boss {
    constructor(x, y) {
        this.x = x;
        this.originX = x;
        this.groundY = y + 140; // Calibrate to the actual ground level
        this.y = this.groundY;  // Start hidden
        this.width = 40;
        this.height = 80;
        this.health = 5;
        this.isBoss = true;
        this.shakeTimer = 0;

        // --- Glow Worm States ---
        // states: 'hidden', 'emerging', 'active', 'hiding'
        this.state = 'hidden';
        this.stateTimer = 60;
        this.targetY = this.groundY - this.height;

        this.shootTimer = 40;
        this.dir = -1;
    }

    update(projectiles, player) {
        if (this.shakeTimer > 0) this.shakeTimer--;

        switch (this.state) {
            case 'hidden':
                this.stateTimer--;
                if (this.stateTimer <= 0) {
                    // Pick a new random spot near the portal area
                    this.x = this.originX + (Math.random() * 200 - 150);
                    this.state = 'emerging';
                }
                break;

            case 'emerging':
                this.y -= 2; // Rise from ground
                if (this.y <= this.targetY) {
                    this.y = this.targetY;
                    this.state = 'active';
                    this.stateTimer = 180; // Stay up for 3 seconds
                }
                break;

            case 'active':
                this.stateTimer--;
                this.shootTimer--;

                if (this.shootTimer <= 0) {
                    this.shoot(projectiles, player);
                    this.shootTimer = 50;
                }

                if (this.stateTimer <= 0) {
                    this.state = 'hiding';
                }
                break;

            case 'hiding':
                this.y += 3; // Retreat quickly
                if (this.y >= this.groundY) {
                    this.y = this.groundY;
                    this.state = 'hidden';
                    this.stateTimer = 90; // Stay hidden for 1.5 seconds
                }
                break;
        }
    }

    shoot(projectiles, player) {
        // Spit glowing bile at the player's position
        const dx = player.x - this.x;
        const vx = dx * 0.02; // Simple tracking: speed based on distance

        projectiles.push({
            x: this.x + 20,
            y: this.y + 10,
            spawnX: this.x,
            vx: vx,
            vy: -3, // Slight upward arc
            isEnemyBullet: true,
            isGrenade: true,
            fromBoss: true,
            color: '#bef264' // Glowing Lime Green
        });
    }

    takeDamage() {
        // Only vulnerable when not hidden
        if (this.state === 'hidden') return false;

        this.health--;
        this.shakeTimer = 15;

        // If hit, retreat early
        if (this.state === 'active') {
            this.state = 'hiding';
        }

        return this.health <= 0;
    }

    draw(ctx, cameraX) {
        if (this.state === 'hidden') return;

        let shakeX = (this.shakeTimer > 0) ? (Math.random() - 0.5) * 10 : 0;
        const screenX = this.x - cameraX + shakeX;

        ctx.save();
        ctx.translate(screenX, this.y);

        // --- DRAW GLOW WORM BODY (Segments) ---
        const segments = 5;
        for (let i = 0; i < segments; i++) {
            const size = this.width - (i * 5);
            const segmentY = i * 15;

            // Pulsing Glow effect
            const glow = Math.sin(Date.now() / 200 + i) * 20;
            ctx.fillStyle = `rgb(${190 + glow}, ${242 + glow}, 100)`;

            // Draw segment
            ctx.beginPath();
            ctx.ellipse(20, segmentY + 10, size / 2, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Darker core
            ctx.fillStyle = '#65a30d';
            ctx.beginPath();
            ctx.ellipse(20, segmentY + 10, size / 4, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- HEAD & EYES ---
        ctx.fillStyle = '#bef264';
        ctx.beginPath();
        ctx.arc(20, 5, 15, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(8, 2, 4, 4);
        ctx.fillRect(28, 2, 4, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(9, 3, 1, 1);
        ctx.fillRect(29, 3, 1, 1);

        ctx.restore();
    }
}



