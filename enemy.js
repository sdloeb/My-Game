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
        this.y = y;
        this.width = 60; 
        this.height = 140; // Approx 3/4 of screen height
        this.health = 4;
        this.isBoss = true;
        this.shakeTimer = 0;
	this.reflectTimer = 0;      // Tracks the 2 seconds of shaking
	this.reflectCooldown = 200; // Time between reflection phases
        
        // Movement: 3-step area logic
        this.originX = x;
        this.stepSize = 10;
        this.stepState = 0; // 0: Origin, 1: Forward, 2: Origin, 3: Back
        this.moveTimer = 0;

        this.shootTimer = 100;
        this.dir = -1; // Faces left toward player
    }

update(projectiles, player) {
    if (this.shakeTimer > 0) this.shakeTimer--;

    // 3-step movement animation
    this.moveTimer++;
    if (this.moveTimer > 40) {
        this.moveTimer = 0;
        this.stepState = (this.stepState + 1) % 4;
        if (this.stepState === 0 || this.stepState === 2) this.x = this.originX;
        else if (this.stepState === 1) this.x = this.originX + this.stepSize;
        else if (this.stepState === 3) this.x = this.originX - this.stepSize;
    }


// 1. Manage Reflection State
if (this.reflectTimer > 0) {
    this.reflectTimer--;
    // Profuse shaking: override the standard shakeTimer while reflecting
    this.shakeTimer = 2; 
} else {
    this.reflectCooldown--;
    if (this.reflectCooldown <= 0) {
        this.reflectTimer = 120; // 2 seconds at 60fps
        this.reflectCooldown = 300; // Wait 5 seconds before next reflect
    }
}



    this.shootTimer--;
    if (this.shootTimer <= 0) {
        // TOSS LOGIC: Randomize distance by changing horizontal speed (vx)
        const horizontalPower = -1.5 - (Math.random() * 3.5); // Tosses between -1.5 and -5.0 speed
        
        projectiles.push({
            x: this.x - 5,
            y: this.y + 75,
            spawnX: this.x,
            vx: horizontalPower,
            vy: -4, // Upward force for the toss
            isEnemyBullet: true,
            isGrenade: true, // Flag to identify this projectile type
           fromBoss: true, // This allows game.js to know it's a boss death           
          color: '#ffffff'
        });
        this.shootTimer = 70 + Math.random() * 50;
    }
}

   takeDamage() {
    // Only take damage if not in the 'forward' step (stepState 1)
    if (this.stepState === 1) {
        this.shakeTimer = 5; // Minimal shake to show a "block"
        return false; 
    }
    this.health--;
    this.shakeTimer = 20; 
    return this.health <= 0;
}


//LEVEL 1 BOSS
draw(ctx, cameraX) {
    // 1. Calculate Base Shake
    let shakeX = 0;
    
    if (this.reflectTimer > 0) {
        // PROFUSE SHAKING: Violent, random jitter during reflection
        shakeX = (Math.random() - 0.5) * 12; 
    } else if (this.shakeTimer > 0) {
        // STANDARD SHAKING: Smaller jitter when taking damage
        shakeX = (Math.random() - 0.5) * 6;
    }

    const screenX = this.x - cameraX + shakeX;
    
    ctx.save();
// Add a tiny vertical jitter only during reflection
    const shakeY = this.reflectTimer > 0 ? (Math.random() - 0.5) * 4 : 0;
    
    ctx.translate(screenX, this.y + shakeY);

    // --- 1. THE SKULL (Profile facing Left) ---
    ctx.fillStyle = '#e5e7eb'; // Primary Bone
    // Rounded Cranium
    ctx.fillRect(14, 0, 20, 4); 
    ctx.fillRect(10, 4, 28, 16);
    ctx.fillRect(10, 20, 24, 4);
    
    // Eye Socket Shadow
    ctx.fillStyle = '#000000';
    ctx.fillRect(12, 8, 10, 10); 


    /// NEW: Pulse Purple if reflecting, otherwise Red
    const pulse = Math.floor(155 + Math.sin(Date.now() / 200) * 100);
    if (this.reflectTimer > 0) {
        ctx.fillStyle = `rgb(${pulse}, 0, ${pulse})`; // Purple Glow
    } else {
        ctx.fillStyle = `rgb(${pulse}, 0, 0)`; // Normal Red Glow
    }
    ctx.fillRect(14, 11, 4, 4);

    // Nasal notch
    ctx.fillStyle = '#000000';
    ctx.fillRect(10, 20, 4, 4);
    
    // Jaw
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(10, 28, 18, 6);
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(12, 24, 12, 2);

    // --- 2. THE SPINE (Hunched posture) ---
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(30, 24, 6, 12);
    ctx.fillRect(34, 36, 8, 90);
    ctx.fillStyle = '#9ca3af';
    for(let v = 0; v < 7; v++) {
        ctx.fillRect(34, 45 + (v * 15), 10, 3);
    }

    // --- 3. THE RIBCAGE (Floating Ribs) ---
    ctx.fillStyle = '#e5e7eb';
    const ribWidths = [28, 32, 30, 26, 20, 14];
    ribWidths.forEach((w, i) => {
        const yPos = 42 + (i * 12);
        const xPos = 38 - w;
        ctx.fillRect(xPos, yPos, w, 4);
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(xPos, yPos + 2, 4, 2);
        ctx.fillStyle = '#e5e7eb';
    });

    // --- 4. PELVIS & HIPS ---
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(28, 126, 18, 12);
    ctx.fillRect(24, 134, 26, 6);

    // --- 5. THE ARM ---
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(28, 40, 10, 10);
    ctx.fillRect(20, 50, 8, 25);
    ctx.fillRect(0, 75, 24, 8);
    ctx.fillRect(-6, 72, 8, 4);
    ctx.fillRect(-8, 79, 10, 4);
    ctx.fillRect(-6, 86, 8, 4);

    ctx.restore();
}
}