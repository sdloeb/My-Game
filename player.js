/**
 * MODULE: PLAYER
 * Responsibility: Input, physics, coin collection, and shooting.
 */
class Player {
    constructor(canvasHeight) {
        this.width = 16;
        this.normalHeight = 24;
        this.squatHeight = 12;
        this.height = this.normalHeight;
        this.x = 35;
        this.y = canvasHeight - 100;

        // Physics & Stats
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 0.4;
        this.maxSpeed = 2.0;
        this.friction = 0.80;
        this.gravity = 0.35;
        this.jumpForce = -9.2;
        this.aimAngle = 0;
        this.inQuicksand = false;
        this.quicksandTimer = 0;
        this.bullets = 0;
        this.heavyAmmo = 0;
        this.onGround = false;
        this.onElevator = null;
        this.facingRight = true;
        this.walkCounter = 0;
        this.inBubble = false;
        this.bubbleTimer = 0;
        this.onChain = null;
        this.climbDist = 0;
        this.chainGraceTimer = 0;
        this.chainGrabCooldown = 0;
        this.ignoreVine = false;

        // State Management
        this.isStunned = false;
        this.stunTimer = 0;
        this.stunType = null;
        this.rotation = 0;
        this.stunCooldown = 0;
        this.hasBow = false;
        this.isSlamming = false; // Tracks if the player is currently ground-pounding
        this.zapCooldown = 0; // Prevents sound/UI spam when hit by electricity
        this.knockbackTimer = 0; // NEW: Allows the bounce to ignore speed limits


        // Squatting State
        this.isSquatting = false;
        this.squatTimer = 0;

        // --- Portal Sequence Properties ---
        this.isEndingLevel = false;
        this.shrinkScale = 1.0;
        this.targetPortalX = 0;
        this.targetPortalY = 0;
        this.struggleTimer = 0;

        this.setupControls();
        this.keys = { left: false, right: false, up: false, down: false };
        this.updateUI(); // Initializes the UI text when the game starts
    }

    //GAME CONTROLLER KEYBOARD KEYS

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (this.isEndingLevel) return;

            // --- 1. MOVEMENT KEYS ---
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
            if (e.code === 'ArrowUp') {
                if (!this.hasBow && this.onGround) this.ignoreVine = true;
                if (!this.hasBow) this.keys.up = true;
            }
            if (e.code === 'KeyW') {
                if (this.onGround) this.ignoreVine = true; // ADDED
                this.keys.up = true;
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.keys.down = true;
                // NEW: Trigger Ground Pound if in the air
                if (!this.onGround && !this.inBubble && !this.isSlamming) {
                    this.isSlamming = true;
                    this.velocityY = 12; // High downward velocity
                    this.velocityX = 0;  // Stop horizontal momentum for a "precision" slam
                }
                // --- NEW: SONAR TRIGGER (Jump + Down Combo) ---
                const isJumpKey = (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp');
                const isDownKey = (e.code === 'ArrowDown' || e.code === 'KeyS');

                if (this.onGround && !this.isStunned && ((isJumpKey && this.keys.down) || (isDownKey && this.keys.up))) {
                    if (this.bullets >= 3) {
                        this.bullets -= 3;
                        this.updateUI();
                        if (typeof activeShockwaves !== 'undefined') {
                            activeShockwaves.push(new Shockwave(this.x + this.width / 2, this.y + this.height / 2));
                        }
                        if (typeof playSonarPingSound === 'function') playSonarPingSound();

                        this.keys.up = false;
                        this.keys.down = false;
                        return; // Stops normal jumping/crouching on this specific frame
                    }
                }
            }


            // --- 2. AIMING LOGIC (Up/Down) ---
            // If the player has the bow, Up/Down arrows adjust the angle
            if (this.hasBow) {
                const angleStep = 0.1; // How fast the aim moves
                if (e.code === 'ArrowUp') {
                    // Aim higher (negative angle is "up" in canvas)
                    // Limit to -1.5 radians (roughly straight up)
                    this.aimAngle = Math.max(this.aimAngle - angleStep, -1.5);
                }
                if (e.code === 'ArrowDown') {
                    // Aim lower
                    // Limit to 1.5 radians (roughly straight down)
                    this.aimAngle = Math.min(this.aimAngle + angleStep, 1.5);
                }
            }

            // --- 3. JUMPING LOGIC ---
            // Removed ArrowUp from here to prevent jumping while aiming
            if (e.code === 'Space' || e.code === 'KeyW') {
                if (this.onGround) this.ignoreVine = true;
                this.keys.up = true;
            }

            // --- 4. CROUCHING LOGIC ---
            // We only crouch if the player DOES NOT have the bow 
            // OR you can keep it as is if you want them to crouch and aim
            if (!this.hasBow && (e.code === 'ArrowDown' || e.code === 'KeyS')) {
                if (this.onGround && !this.isSquatting) {
                    this.isSquatting = true;
                    this.squatTimer = 60;
                    this.y += (this.normalHeight - this.squatHeight);
                    this.height = this.squatHeight;
                }
            }

            // --- SONAR TRIGGER (Jump + Down Combo) ---
            // Triggered if both Jump (Up/W/Space) and Down (Down/S) are held while on ground
            const isJumpPressed = this.keys.up;
            const isDownPressed = this.keys.down;

            if (this.onGround && isJumpPressed && isDownPressed && !this.isStunned) {
                if (this.bullets >= 3) {
                    this.bullets -= 3;
                    this.updateUI();

                    // Create the visual shockwave at the player's center
                    if (typeof activeShockwaves !== 'undefined') {
                        activeShockwaves.push(new Shockwave(this.x + this.width / 2, this.y + this.height / 2));
                    }

                    // Optional: Play a sound if we had a ping sound defined
                    // if (typeof playPingSound === 'function') playPingSound();

                    // Consume the inputs so the player doesn't accidentally jump or crouch
                    this.keys.up = false;
                    this.keys.down = false;
                }
            }

            const canShoot = this.hasBow ? this.heavyAmmo > 0 : this.bullets > 0;
            if (e.code === 'KeyB' && canShoot && !this.isStunned) this.shoot();
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
            if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
                this.keys.up = false;
                this.ignoreVine = false; // NEW: Re-enable vine grabbing when jump is released
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
        });

        // Add this inside setupControls() in player.js
        const handleTouch = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                // NEW: Ignore vine if jumping from ground via touch
                if (key === 'up' && this.onGround) this.ignoreVine = true;
                this.keys[key] = true;

                if (key === 'up' && this.hasBow) {
                    this.aimAngle = Math.max(this.aimAngle - 0.1, -1.5);
                }
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (key === 'up') this.ignoreVine = false; // NEW
                this.keys[key] = false;
            }, { passive: false });
        };

        // Map buttons to keys
        handleTouch('btn-left', 'left');
        handleTouch('btn-right', 'right');
        handleTouch('btn-up', 'up');
        handleTouch('btn-down', 'down');

        // Special listener for the Shoot button
        const shootBtn = document.getElementById('btn-shoot');
        if (shootBtn) {
            shootBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                // Check heavyAmmo if player has the Bow, otherwise check standard bullets
                const canShoot = this.hasBow ? this.heavyAmmo > 0 : this.bullets > 0;
                if (canShoot && !this.isStunned) this.shoot();
            });
        }


    }


    isCeilingAbove(platforms) {
        if (!platforms) return false;
        // Check the space where your head WOULD be if you stood up
        const futureTop = this.y - (this.normalHeight - this.height);
        return platforms.some(p => {
            return (this.x + this.width > p.x &&
                this.x < p.x + (p.w * 16) &&
                futureTop < p.y + (p.h * 16) &&
                this.y > p.y);
        });
    }

    startPortalSuck(px, py) {
        this.isEndingLevel = true;
        this.targetPortalX = px;
        this.targetPortalY = py;
        if (typeof playPortalSound === 'function') playPortalSound();
    }

    shoot() {

        // NEW: If we have the bow, we can ONLY shoot if we have also found the Arrow (fg.hasKey)
        if (this.hasBow && !fg.hasKey) {
            console.log("Found the bow, but need the Arrow to shoot!");
            return; // Stop the shot
        }

        if (this.hasBow) {
            this.heavyAmmo--;
        } else {
            this.bullets--;
        }

        this.updateUI();

        const projectileType = this.hasBow ? 'arrow' : 'bullet';

        let vx, vy;

        if (this.hasBow) {
            // Use the aiming angle for arrows
            const power = 8;
            vx = Math.cos(this.aimAngle) * power * (this.facingRight ? 1 : -1);
            vy = Math.sin(this.aimAngle) * power;
        } else {
            // Normal bullets fire straight ahead
            vx = this.facingRight ? 4 : -4;
            vy = 0;
        }

        window.dispatchEvent(new CustomEvent('playerShoot', {
            detail: {
                x: this.x + (this.facingRight ? this.width : 0),
                y: this.y + (this.isSquatting ? 6 : 12),
                dir: this.facingRight ? 1 : -1,
                type: projectileType,
                vx: vx,
                vy: vy
            }
        }));
    }

    updateUI() {
        const bulletDisplay = document.getElementById('bullet-display');
        const heavyDisplay = document.getElementById('heavy-ammo-display');

        if (bulletDisplay) {
            bulletDisplay.innerText = `BULLETS: ${this.bullets}`;
        }

        if (heavyDisplay) {
            // UPDATED: Show count if the player has the weapon OR has ammo stored
            if (this.hasBow || this.heavyAmmo > 0) {
                let label = "ARROWS";
                // Safety check for the global level variable
                const level = (typeof currentLevelNum !== 'undefined') ? currentLevelNum : 1;
                if (level === 2) label = "DARTS";
                if (level === 3) label = "GRENADES";

                heavyDisplay.innerText = `${label}: ${this.heavyAmmo}`;
            } else {
                heavyDisplay.innerText = ""; // Hide if no ammo and no weapon
            }
        }
    }

    update(groundY, platforms, elevators, groundHazards, coins, fg) {
        // --- MOBILE & DESKTOP SONAR CHECK ---
        // Checks every frame if BOTH Jump (Up) and Down are held while on ground
        if (this.onGround && this.keys.up && this.keys.down && !this.isStunned) {
            if (this.bullets >= 3) {
                this.bullets -= 3;
                this.updateUI();

                if (typeof activeShockwaves !== 'undefined') {
                    activeShockwaves.push(new Shockwave(this.x + this.width / 2, this.y + this.height / 2));
                }
                if (typeof playSonarPingSound === 'function') playSonarPingSound();

                // Reset keys so it doesn't trigger 60 times a second
                this.keys.up = false;
                this.keys.down = false;
                return; // Stop further movement processing for this frame
            }
        }
        if (this.zapCooldown > 0) this.zapCooldown--;

        if (this.inQuicksand) {
            this.quicksandTimer++;
            this.onGround = false; // Disable limb swinging while stuck

            // --- ADDED: Horizontal Suction ---
            // Find the specific quicksand patch the player is currently in
            const hazard = (groundHazards || []).find(hz => hz.type === 'quicksand' && this.x + this.width > hz.x && this.x < hz.x + hz.w);
            if (hazard) {
                // Calculate unit boundaries including the gun extension (4px)
                const unitLeft = this.facingRight ? this.x : this.x - 4;
                const unitRight = this.facingRight ? this.x + 20 : this.x + 16;

                if (unitLeft < hazard.x) {
                    this.x += 0.5; // Slide right into sand
                } else if (unitRight > hazard.x + hazard.w) {
                    this.x -= 0.5; // Slide left into sand
                }
            }

            // 1. SINKING: Constant slow downward pull
            this.y += 0.2;

            // 2. STRUGGLING: Tapping Up/Jump moves you up slightly
            if (this.keys.up) {
                this.y -= 2.4;         // The power of a single struggle "tap"
                this.velocityY = -3.0;  // NEW: Stronger upward momentum to fight gravity
                this.velocityX = 0;     // NEW: Zero out friction
                this.keys.up = false; // Force the player to tap again
                this.struggleTimer = 20;
                if (typeof playQuicksandSound === 'function') playQuicksandSound();
            }

            // 3. ESCAPE CONDITION: Trigger the vault out once the body is mostly visible
            // height is 24, so groundY - 20 means only 4 pixels are submerged
            const escapeThreshold = groundY - 12;
            if (this.y <= escapeThreshold) {
                this.inQuicksand = false;
                this.onGround = false; // Ensures physics take over correctly
                this.velocityY = this.jumpForce * .9; // Stronger vault out force
                this.velocityX = this.facingRight ? 3.0 : -3.0; // More horizontal kick
                return;
            }

            // 4. DEATH CHECK: If the top of the head goes too deep below the surface
            if (this.y > groundY + 12) {
                this.inQuicksand = false;
                handlePlayerDeath('quicksand');
            }

            return; // Skip standard physics while in quicksand
        }



        if (this.stunCooldown > 0) this.stunCooldown--;

        if (this.isEndingLevel) {
            this.x += (this.targetPortalX - (this.x + this.width / 2)) * 0.1;
            this.y += (this.targetPortalY - (this.y + this.height / 2)) * 0.1;
            this.rotation += 0.4;
            this.shrinkScale *= 0.95;
            if (this.shrinkScale < 0.05) nextLevel();
            return;
        }

        if (this.isSquatting) {
            if (this.squatTimer > 0) this.squatTimer--;
            // Only stand up if the timer is out AND the player isn't holding the down key 
            // AND there is actually room to stand up
            if (this.squatTimer <= 0 && !this.keys.down && !this.isCeilingAbove(platforms)) {
                this.isSquatting = false;
                this.y -= (this.normalHeight - this.squatHeight);
                this.height = this.normalHeight;
            }
        }

        if (fg && fg.star) {
            const dx = (this.x + this.width / 2) - fg.star.x;
            const dy = (this.y + this.height / 2) - fg.star.y;
            if (Math.sqrt(dx * dx + dy * dy) < 15) {
                fg.star = null;
                fg.hasStar = true;
                collectedStars[fg.level] = true;
                const levelDisp = document.getElementById('level-display');
                if (levelDisp) levelDisp.innerText += " ⭐";
            }
        }

        let moving = false;

        // --- VINE INTERACTION & TIMERS ---
        if (this.chainGraceTimer > 0) this.chainGraceTimer--;
        if (this.chainGrabCooldown > 0) this.chainGrabCooldown--;

        if (this.onChain) {
            this.velocityX = 0;
            this.velocityY = 0;
            this.onGround = false;

            // 1. CLIMBING VS JUMPING
            // Separation: Holding a direction (Left/Right) + Jump (Up) triggers a jump off.
            // We use the Grace Timer so you don't instantly jump off the frame you catch it.
            if (this.chainGraceTimer === 0 && this.keys.up && (this.keys.left || this.keys.right)) {
                this.velocityX = this.keys.left ? -4 : 4;
                this.velocityY = this.jumpForce * 0.8;
                this.onChain = null;
                this.chainGrabCooldown = 30; // 0.5s cooldown before you can grab a vine again
                if (typeof playJumpSound === 'function') playJumpSound();
                return;
            }
            else {
                // Regular Climbing
                if (this.keys.up) this.climbDist = Math.max(20, this.climbDist - 2);
                if (this.keys.down) this.climbDist = Math.min(this.onChain.length - 10, this.climbDist + 2);
            }

            // --- // --- ADDED: MANUAL SWINGING & ACTIVE FRICTION ---
            if (this.keys.left) {
                this.onChain.angleVelocity += 0.00032;
                this.onChain.angleVelocity *= 0.996; // Weak friction while pumping
            } else if (this.keys.right) {
                this.onChain.angleVelocity -= 0.00032;
                this.onChain.angleVelocity *= 0.996; // Weak friction while pumping
            } else {
                this.onChain.angleVelocity *= 0.985; // STRONG friction when player is idle
            }

            // 2. SNAP TO VINE POSITION (World Coordinates following the arc)
            // Using "- Math.sin" correctly aligns the player with Canvas's clockwise rotation
            this.x = this.onChain.x - (Math.sin(this.onChain.angle) * this.climbDist) - (this.width / 2);
            this.y = this.onChain.y + (Math.cos(this.onChain.angle) * this.climbDist) - (this.height / 2);

            // Auto-drop if at bottom
            if (this.climbDist >= this.onChain.length - 11 && this.keys.down) {
                this.onChain = null;
                this.chainGrabCooldown = 20;
            }

            return; // Skip standard physics while on vine
        }

        // --- ATTACH TO VINE CHECK (UPDATED) ---
        // Requirement: Must NOT be ignoring vines (from initial jump) AND must be pressing Jump while touching
        if (!this.onChain && this.chainGrabCooldown === 0 && !this.inBubble && !this.isSlamming && !this.isStunned && this.keys.up && !this.ignoreVine) {
            fg.chains.forEach(c => {
                const playerCenterX = this.x + this.width / 2;
                const playerCenterY = this.y + this.height / 2;
                const relativeY = playerCenterY - c.y;

                if (relativeY > 10 && relativeY < c.length) {
                    const vineXAtHeight = c.x - Math.sin(c.angle) * relativeY;

                    if (Math.abs(playerCenterX - vineXAtHeight) < 15) {
                        this.onChain = c;
                        this.climbDist = relativeY;
                        this.chainGraceTimer = 15;

                        // Reduced initial kick so the player must build momentum manually
                        let kick = this.velocityX * 0.015; // Small nudge on grab
                        const maxKick = 0.04; // Low cap for the initial impact
                        c.angleVelocity -= Math.max(-maxKick, Math.min(maxKick, kick));

                        // SEAMLESS SNAP: Recalculate player position immediately
                        this.x = c.x - (Math.sin(c.angle) * this.climbDist) - (this.width / 2);
                        this.y = c.y + (Math.cos(c.angle) * this.climbDist) - (this.height / 2);

                        // NEW: Set ignoreVine to true immediately upon grabbing. 
                        // This helps ensure the "grab" feels like a distinct action.
                        this.ignoreVine = true;
                    }
                }
            });
        }

        if (this.isStunned) {
            this.stunTimer--;
            if (Math.abs(this.velocityX) > 0.01) {
                if (this.stunType === 'oil') {
                    this.rotation += 0.2; // This now stays active
                } else if (this.stunType === 'ice') { // Changed to else if
                    this.rotation = this.facingRight ? -0.4 : 0.4;
                    if (Math.abs(this.velocityX) > 0.1) {
                        if (typeof playIceSlideSound === 'function') playIceSlideSound(true);
                    } else {
                        if (typeof playIceSlideSound === 'function') playIceSlideSound(false);
                    }
                } else {
                    this.rotation = 0;
                }
            }

            // This only happens when the timer runs out
            if (this.stunTimer <= 0) {
                this.isStunned = false;
                this.rotation = 0;
                this.stunType = null;
                this.stunCooldown = 40;
                if (typeof playIceSlideSound === 'function') playIceSlideSound(false);

            }
        } else {
            // Only process walking movement if NOT in a bubble
            if (!this.inBubble) {
                if (this.keys.left) { this.velocityX -= this.speed; this.facingRight = false; moving = true; }
                if (this.keys.right) { this.velocityX += this.speed; this.facingRight = true; moving = true; }
            }

            if (this.onGround && this.keys.up) {
                this.velocityY = this.jumpForce;
                this.onGround = false;
                this.onElevator = null;
                if (typeof playJumpSound === 'function') playJumpSound();

                if (this.isSquatting) {
                    // If jumping while squatting, only stand up if there is room
                    if (!this.isCeilingAbove(platforms)) {
                        this.isSquatting = false;
                        this.y -= (this.normalHeight - this.squatHeight);
                        this.height = this.normalHeight;
                    }
                    this.velocityX *= 0.5; // Slight penalty for jumping from a crouch
                }
            }
        }

        // UPDATED: Only squat if NOT triggering the sonar (holding Jump)
        if (!this.hasBow && this.keys.down && !this.keys.up && this.onGround && !this.isSquatting) {
            this.isSquatting = true;
            this.squatTimer = 60;
            this.y += (this.normalHeight - this.squatHeight);
            this.height = this.squatHeight;
        }




        // --- Physics Application ---
        if (this.inBubble) {
            this.bubbleTimer++; // 10-second timer (600 frames)
            if (this.bubbleTimer >= 600) {
                this.inBubble = false;
                this.bubbleTimer = 0;
            }

            this.gravity = 0;
            this.friction = 0.92;

            // Slowed Bubble Controls
            if (this.keys.up) this.velocityY -= 0.2;
            if (this.keys.down) this.velocityY += 0.2;
            if (this.keys.left) this.velocityX -= 0.2;
            if (this.keys.right) this.velocityX += 0.2;

            const maxBSpeed = 1.5; // Slower max speed for bubble
            this.velocityX = Math.max(-maxBSpeed, Math.min(maxBSpeed, this.velocityX));
            this.velocityY = Math.max(-maxBSpeed, Math.min(maxBSpeed, this.velocityY));
            this.onGround = false;
        } else {
            this.gravity = 0.35;
        }


        this.velocityY += this.gravity;
        let finalFriction = this.isStunned ? 0.99 : (this.onGround ? 0.85 : 0.98);
        this.velocityX *= finalFriction;

        // NEW: Only clamp speed if NOT currently being knocked back by electricity
        if (this.knockbackTimer > 0) {
            this.knockbackTimer--;
        } else {
            if (this.velocityX > this.maxSpeed) this.velocityX = this.maxSpeed;
            if (this.velocityX < -this.maxSpeed) this.velocityX = -this.maxSpeed;
        }

        this.x += this.velocityX;
        this.y += this.velocityY;


        // TOP BOUNDARY CHECK: Prevents flying out of the top of the screen
        // Only prevents flying out of the top if the player is in a bubble.
        if (this.inBubble && this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }

        if (Math.abs(this.velocityX) < 0.1) {
            this.velocityX = 0;
        }

        this.onGround = false;

        if (fg && fg.clock && !fg.clock.collected) {
            const clockDx = (this.x + this.width / 2) - (fg.clock.x + 8);
            const clockDy = (this.y + this.height / 2) - (fg.clock.y + 8);
            if (Math.sqrt(clockDx * clockDx + clockDy * clockDy) < 15) {
                fg.clock.collected = true;
                if (typeof playSecretSound === 'function') playSecretSound();
                fg.timeLeft += 25; // Add 25 seconds to the timer
                const timerElement = document.getElementById('timer-display');
                if (timerElement) {
                    timerElement.style.color = "#00ff00";
                    setTimeout(() => { if (timerElement) timerElement.style.color = "white"; }, 1000);
                }
            }
        }

        if (coins) {
            for (let i = coins.length - 1; i >= 0; i--) {
                let c = coins[i];
                if (this.x < c.x + 10 && this.x + this.width > c.x && this.y < c.y + 10 && this.y + this.height > c.y) {
                    coins.splice(i, 1);
                    if (typeof playCoinSound === 'function') playCoinSound();
                    this.bullets += 1;
                    this.updateUI();
                }
            }
        }

        // UPDATED: Only snap to the ground if NOT currently sinking in quicksand
        if (this.y + this.height >= groundY && !this.inQuicksand && this.velocityY >= 0) {

            // --- ADDED: BUBBLE BOUNCE ---
            if (this.inBubble) {
                this.velocityY = -2.5; // Upward bounce force
                this.y = groundY - this.height - 2; // Prevent getting stuck in the floor
                return; // Skip the rest of the landing logic (like snapping to ground)
            }

            // Standard ground reset
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
            this.onElevator = null;
            if (this.isSlamming) this.isSlamming = false; // Reset stomp state

            if (groundHazards && !this.isStunned && this.stunCooldown <= 0 && !this.inBubble) {
                const playerCenter = this.x + (this.width / 2);

                groundHazards.forEach(h => {
                    // Falls in earlier for quicksand (4px overlap), center-point for others
                    const isTriggered = h.type === 'quicksand'
                        ? (this.x + this.width - 4 > h.x && this.x + 4 < h.x + h.w)
                        : (playerCenter > h.x && playerCenter < h.x + h.w);

                    if (isTriggered) {

                        // UPDATED: Enter quicksand and cancel Stomp
                        if (h.type === 'quicksand' && !this.inQuicksand && this.velocityY >= 0) {
                            this.inQuicksand = true;
                            this.isSlamming = false; // NEW: Stop slamming so you can sink
                            this.velocityX = 0;
                            this.velocityY = 0;
                            this.y = groundY - 4; // Start slightly submerged
                            this.quicksandTimer = 0;
                        }

                        // EXISTING: Standard stun logic for Oil and Ice
                        else if (h.type === 'oil' || h.type === 'ice') {
                            this.isStunned = true;
                            this.stunTimer = 60;
                            this.stunType = h.type;

                            // Use velocityX to determine direction, defaulting to 4.0 if standing still
                            let pushDir = this.velocityX >= 0 ? 4.0 : -4.0;
                            this.velocityX = pushDir;
                        }
                    }
                });
            }



            // TRIGGER THE SPLASH (Updated for precision)
            if (this.isStunned && this.stunType === 'oil') {
                // Check if we are still physically OVER an oil slick
                const playerCenter = this.x + (this.width / 2);
                const currentlyOnOil = groundHazards.some(h =>
                    h.type === 'oil' && playerCenter > h.x && playerCenter < h.x + h.w
                );

                // Only splash if the probability check AND the position check pass
                if (currentlyOnOil && Math.random() > 0.4) {
                    window.dispatchEvent(new CustomEvent('oilSplash', {
                        detail: { x: this.x + (this.width / 2), y: groundY }
                    }));
                }
            }


            // TRIGGER THE ICE PUFF
            if (this.isStunned && this.stunType === 'ice') {
                // Real-time check: are we still physically ON an ice slick?
                const playerCenter = this.x + (this.width / 2);
                const currentlyOnIce = groundHazards.some(h =>
                    h.type === 'ice' && playerCenter > h.x && playerCenter < h.x + h.w
                );

                // Subtle frost effect while sliding
                if (currentlyOnIce && Math.random() > 0.7) {
                    window.dispatchEvent(new CustomEvent('icePuff', {
                        detail: { x: this.x + (this.width / 2), y: groundY }
                    }));
                }
            }
        } // This closes the ground check block



        if (platforms && !this.inBubble) {
            platforms.forEach(p => {
                const pW = p.w * 16;
                const pH = p.h * 16;

                // 1. Define the player's current bounding box
                const pLeft = this.x + 1;
                const pRight = this.x + this.width - 1;
                const pTop = this.y;
                const pBottom = this.y + this.height;

                // 2. Check if there is ANY overlap with the platform
                if (pRight > p.x && pLeft < p.x + pW && pBottom > p.y && pTop < p.y + pH) {

                    // Calculate how far we are overlapping from each side
                    let overlapLeft = pRight - p.x;
                    let overlapRight = (p.x + pW) - pLeft;
                    let overlapTop = pBottom - p.y;
                    let overlapBottom = (p.y + pH) - pTop;

                    // 3. Determine the Shallowest Overlap (this tells us which side we hit)
                    // We prioritize Top/Bottom to prevent falling through or jumping through
                    let minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                    // LANDING ON TOP
                    if (minOverlap === overlapTop && this.velocityY >= 0) {

                        // --- ADDED: BUBBLE BOUNCE FOR BRICKS ---
                        if (this.inBubble) {
                            this.velocityY = -2.5;
                            this.y = p.y - this.height - 2;
                            return; // Skip standard landing logic for this platform
                        }

                        // NEW: If slamming, trigger the brick crack (Your existing code)
                        if (this.isSlamming) {
                            window.dispatchEvent(new CustomEvent('brickHit', { detail: { platform: p } }));
                            this.isSlamming = false; // End the slam
                            this.velocityY = -3;    // Bounce up slightly
                        }

                        this.y = p.y - this.height;
                        this.velocityY = 0;
                        this.onGround = true;

                        if (this.velocityY === 0) this.y = Math.floor(this.y);
                    }

                    // BONKING HEAD (Breaking Brick)
                    else if (minOverlap === overlapBottom && this.velocityY < 0) {
                        this.y = p.y + pH;
                        this.velocityY = 2; // Small bounce down
                        window.dispatchEvent(new CustomEvent('brickHit', { detail: { platform: p } }));
                    }

                    // HITTING SIDES (Walls)
                    else {
                        if (minOverlap === overlapLeft) {
                            this.x = p.x - this.width;
                            this.velocityX = 0;
                        } else if (minOverlap === overlapRight) {
                            this.x = p.x + pW;
                            this.velocityX = 0;
                        }
                    }
                }
            });
        }




        if (elevators) {
            elevators.forEach(e => {
                const withinX = this.x + this.width > e.x && this.x < e.x + e.w;
                const isAbove = this.y + this.height <= e.y + 10;
                if (withinX && isAbove) {
                    if (this.velocityY >= 0 || this.onElevator === e) {
                        if (this.y + this.height + this.velocityY >= e.y) {
                            this.y = e.y - this.height;
                            this.velocityY = 0;
                            this.onGround = true;
                            this.onElevator = e;
                            this.y += e.speed * e.direction;
                        }
                    }
                }
            });
            if (!this.onGround) this.onElevator = null;
        }

        if (moving && this.onGround && !this.isStunned) {
            this.walkCounter += 0.12;
        } else if (!this.onGround) {
            this.walkCounter = 1.5;
        } else {
            this.walkCounter = 0;
            if (!this.isStunned) this.velocityX *= 0.7;
        }
        if (this.struggleTimer > 0) this.struggleTimer--;
    }

    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        const limbSwing = Math.sin(this.walkCounter) * 5;
        ctx.save();
        ctx.translate(screenX + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        const scaleY = this.isSquatting ? this.shrinkScale * 0.5 : this.shrinkScale;
        ctx.scale(this.shrinkScale, scaleY);
        ctx.translate(-(this.width / 2), -(this.height / 2));

        ctx.fillStyle = '#312e81';
        ctx.fillRect(3, 16, 4, 6 + (this.onGround ? -limbSwing : 0));
        ctx.fillRect(9, 16, 4, 6 + (this.onGround ? limbSwing : 0));
        ctx.fillStyle = '#111827';
        ctx.fillRect(2, 21 + (this.onGround ? -limbSwing : 0), 5, 3);
        ctx.fillRect(9, 21 + (this.onGround ? limbSwing : 0), 5, 3);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(3, 8, 10, 10);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(3, 9, 3, 8);
        ctx.fillRect(10, 9, 3, 8);
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(3, 16, 10, 2);
        ctx.fillStyle = '#ffdbac';
        if (this.facingRight) {
            ctx.fillRect(10, 11 + (limbSwing * 0.5), 4, 4);
            // Draw red gun ONLY if player doesn't have the bow
            if (!this.hasBow) {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(13, 10, 7, 3);
                ctx.fillRect(12, 11, 3, 5);
            }
        } else {
            ctx.fillRect(2, 11 + (limbSwing * 0.5), 4, 4);
            // Draw red gun ONLY if player doesn't have the bow
            if (!this.hasBow) {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(-4, 10, 7, 3);
                ctx.fillRect(1, 11, 3, 5);
            }
        }

        // --- HEAD DRAWING (Moved outside the arm logic so it always shows) ---
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(6, 6, 4, 2); // Neck
        ctx.fillRect(4, 0, 8, 7); // Face

        ctx.fillStyle = '#27272a'; // Hair
        ctx.fillRect(4, 0, 8, 3);
        ctx.fillRect(this.facingRight ? 4 : 10, 0, 2, 6);

        ctx.fillStyle = '#0ea5e9'; // Eyes
        const eyeX = this.facingRight ? 9 : 5;
        ctx.fillRect(eyeX, 3, 2, 2);

        // --- WEAPON DRAWING (In Player's Hand) ---
        if (this.hasBow) {
            ctx.save();

            // Adjust position based on where the player's "hand" is
            // We translate to the hand position and rotate based on aiming angle
            ctx.translate(this.facingRight ? 12 : 4, 12);
            ctx.rotate(this.facingRight ? this.aimAngle : Math.PI - this.aimAngle);

            if (currentLevelNum === 2) {
                // --- DART GUN (Level 1-2) ---
                ctx.fillStyle = '#475569';
                ctx.fillRect(0, -3, 14, 6);
                ctx.fillRect(0, 1, 4, 7);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(4, -2, 6, 2);
            } else if (currentLevelNum === 3) {
                // --- RE-DRAWN GRENADE LAUNCHER (Level 1-3) ---
                const colorMain = '#365314';   // Army Green
                const colorShadow = '#1a2e05'; // Dark Green Shadow
                const colorMetal = '#4b5563';  // Gunmetal Grey

                // 1. Main Receiver / Body
                ctx.fillStyle = colorMain;
                ctx.fillRect(0, -4, 12, 8);

                // 2. The Drum (The round part that holds grenades)
                ctx.fillStyle = colorShadow;
                ctx.fillRect(2, -2, 7, 8);
                ctx.fillStyle = colorMain;
                ctx.fillRect(3, -1, 5, 6);

                // 3. Sleeker Barrel
                ctx.fillStyle = colorMetal;
                ctx.fillRect(12, -3, 10, 4); // Longer, thinner barrel
                // Front Sight
                ctx.fillRect(19, -5, 2, 2);

                // 4. Rear Stock
                ctx.fillStyle = colorShadow;
                ctx.fillRect(-4, -2, 4, 4);

                // 5. Grip
                ctx.fillStyle = colorMain;
                ctx.fillRect(2, 4, 4, 5);
            } else {
                // --- BOW (Level 1-1) ---
                ctx.strokeStyle = '#fde047';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 8, -Math.PI / 2, Math.PI / 2);
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, -8);
                ctx.lineTo(0, 8);
                ctx.stroke();
            }

            ctx.restore();
        }

        // --- AIM LINE ---
        if (this.hasBow) {
            ctx.save();
            ctx.translate(this.facingRight ? 10 : 2, 12);
            ctx.rotate(this.facingRight ? this.aimAngle : -this.aimAngle);
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)'; // Semi-transparent yellow
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(15, 0);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
}