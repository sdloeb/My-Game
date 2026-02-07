/**
 * MODULE: BACKGROUND
 * Responsibility: Parallax layers, sky elements, and level-specific scenery.
 */
class Background {
    constructor(level = 1, canvasWidth, canvasHeight) {
        this.level = level;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.clouds = [];
        this.scenery = [];
        this.groundY = canvasHeight - 32;
        this.skyColor = this.level === 3 ? '#000000' :
            (this.level === 2 ? '#5c94fc' : '#5c94fc');

        this.init();
    }

    init() {
        // Shared Clouds
        for (let i = 0; i < 20; i++) {
            this.clouds.push({
                x: Math.random() * 5000,
                y: 20 + Math.random() * 60,
                w: 30 + Math.random() * 40,
                h: 10 + Math.random() * 15
            });
        }

        if (this.level === 1) {
            this.generateCityTheme();
        } else if (this.level === 2) {
            this.generateCarnivalTheme();
        } else if (this.level === 3) {
            this.generateSpaceTheme();
        }
    }

    drawCloud(ctx, x, y, w, h) {
        // 1. Draw the Main "Puffy" Body (Semi-transparent white)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        // Central mass
        ctx.fillRect(x + 4, y + 4, w - 8, h - 4);
        // Left puff
        ctx.fillRect(x, y + 6, 8, h - 8);
        // Right puff
        ctx.fillRect(x + w - 8, y + 6, 8, h - 8);
        // Top puffs
        ctx.fillRect(x + w * 0.2, y, w * 0.3, 4);
        ctx.fillRect(x + w * 0.5, y + 2, w * 0.2, 4);

        // 2. Draw the Bottom Shadow (Slightly darker/bluer)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(x + 4, y + h - 2, w - 8, 2);
        ctx.fillRect(x + 8, y + h, w - 16, 2);

        // 3. Draw the Top Highlight (Pure white gleam)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x + w * 0.2, y, w * 0.3, 2);
        ctx.fillRect(x + 4, y + 4, 10, 2);
    }




    generateCityTheme() {
        let bx = 0;
        // 1. CHOOSE YOUR STOP POINT
        // This is the point in the Foreground where you want the buildings to end.
        const foregroundStopPoint = 4700;

        // 2. CALCULATE LIMIT BASED ON PARALLAX
        // City buildings (Level 1) use 0.5 parallax.
        const buildingLimit = foregroundStopPoint * 0.5;

        // 3. GENERATE BUILDINGS
        while (bx < buildingLimit) {
            const isSkyscraper = Math.random() > 0.4;
            const bWidth = isSkyscraper ? 30 + Math.random() * 20 : 20 + Math.random() * 15;
            const bHeight = isSkyscraper ? 80 + Math.random() * 60 : 20 + Math.random() * 30;

            this.scenery.push({
                type: 'building',
                x: bx,
                y: this.groundY - bHeight,
                w: bWidth,
                h: bHeight,
                color: isSkyscraper ? '#4b5563' : '#7c2d12',
                windows: isSkyscraper,
                signals: []
            });

            // Spacing between buildings
            bx += bWidth + (10 + Math.random() * 50);
        }
    }


    generateCarnivalTheme() {
        this.scenery = [];
        let cx = 100;
        const pool = ['tent', 'wheel', 'stand', 'rollercoaster', 'stall', 'carousel', 'swingride', 'elephant', 'juggler'];

        // 1. CHOOSE YOUR STOP POINT
        // This is the point in the "Foreground" (where the player walks) 
        // where you want the background to be completely empty.
        const foregroundStopPoint = 4700;

        // 2. GENERATE BUILDINGS/TENTS (0.8 Parallax)
        // We multiply the stop point by 0.8 so the background ends exactly 
        // when the player reaches that distance.
        const buildingLimit = foregroundStopPoint * 0.8;

        let lastType = null; // Track the previous type to prevent duplicates

        while (cx < buildingLimit) {
            // 1. Create a filtered pool that excludes the last placed type
            const filteredPool = pool.filter(type => type !== lastType);

            // 2. Pick a random type from the remaining options
            const type = filteredPool[Math.floor(Math.random() * filteredPool.length)];

            this.scenery.push({
                type: type,
                x: cx,
                y: this.groundY,
                color: Math.random() > 0.5 ? '#ef4444' : '#ffffff',
                signals: []
            });

            // 3. Update lastType for the next iteration
            lastType = type;

            cx += 110 + Math.random() * 15;
        }

        // 3. GENERATE CHILDREN (0.4 Parallax)
        // Children stay on screen longer, so they need a different limit 
        // to stop at the same time as the buildings.
        const childLimit = foregroundStopPoint * 0.4;

        for (let i = 0; i < 30; i++) {
            this.scenery.push({
                type: 'child',
                x: Math.random() * childLimit,
                y: this.groundY,
                speed: 0.3 + Math.random() * 0.4,
                dir: Math.random() > 0.5 ? 1 : -1,
                size: 3 + Math.random() * 2
            });
        }
    }

    generateSpaceTheme() {
        this.scenery = []; // Clear existing scenery

        // 1. CALCULATE LIMIT FOR FULL COVERAGE
        // The player walks to 3200. At 0.1 parallax, the background camera moves 320px.
        // We add 300px (approx canvas width) to ensure items are on the right side at the end.
        const sceneryLimit = (5000 * 0.1) + 300; // Scales stars to the new 5000px length

        // 2. GENERATE STARS (Spread across the entire background window)
        for (let i = 0; i < 200; i++) {
            this.scenery.push({
                type: 'star',
                x: Math.random() * sceneryLimit,
                y: Math.random() * this.canvasHeight,
                size: Math.random() * 2,
                twinkle: Math.random() > 0.8
            });
        }

        // 3. GENERATE UNIQUE PLANETS
        const planets = ['jupiter', 'saturn', 'moon', 'blackhole'];
        planets.sort(() => Math.random() - 0.5); // Shuffle for unique order

        let px = 60; // Start first planet shortly after level start
        let planetIndex = 0;

        // Spread the 4 unique planets across the 650px background window
        while (px < sceneryLimit && planetIndex < planets.length) {
            this.scenery.push({
                type: planets[planetIndex],
                x: px,
                y: 40 + Math.random() * 100,
                size: 15 + Math.random() * 15
            });

            // Spacing is roughly 140px in background coords
            // This spreads 4 planets evenly over the player's ~3200px walk
            px += 120 + Math.random() * 50;
            planetIndex++;
        }

        // --- FIXED: HIGH DENSITY PULSARS ---
<<<<<<< HEAD
        // We now generate 12 pulsars so there is almost always one near a secret brick
        for (let i = 0; i < 25; i++) {
            this.scenery.push({
                type: 'pulsar',
                x: 20 + (i * 30) + Math.random() * 15,
                y: 20 + Math.random() * 80,
=======
        // We increase parallax to 0.8 for pulsars so they match foreground speed better.
        // We spread 15 pulsars across the level (5000 * 0.8) to cover the walk.
        const pulsarLimit = (5000 * 0.8) + 300;
        for (let i = 0; i < 15; i++) {
            this.scenery.push({
                type: 'pulsar',
                x: 100 + (i * (pulsarLimit / 15)) + Math.random() * 40,
                y: 20 + Math.random() * 70,
>>>>>>> 564f1767a0261af7c0bba26d4dfb5d9636a8ce67
                signals: []
            });
        }
    }

    draw(ctx, cameraX) {
        // 1. Draw Sky
        ctx.fillStyle = this.skyColor;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // 2. Draw Clouds (Slowest parallax)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.clouds.forEach(c => {
            const drawX = (c.x - (cameraX * 0.2)) % 5000;
            // Only draw if within or near the screen bounds (256px wide)
            if (drawX > -c.w && drawX < this.canvasWidth) {
                this.drawCloud(ctx, drawX, c.y, c.w, c.h);
            }
        });

        // 3. Draw "Far" Scenery Layer (Children walk behind buildings)
        this.scenery.forEach(s => {
            if (s.type !== 'child') return;

            const drawX = s.x - (cameraX * 0.4);
            if (drawX + 50 < 0 || drawX > this.canvasWidth) return;

            this.drawChild(ctx, drawX, s);
        });

        // 4. Draw "Main" Scenery Layer (Tents, Ferris Wheel, Stands)
        this.scenery.forEach(s => {
            if (s.type === 'child') return; // Skip children, we already drew them

            // 1. Calculate the correct parallax speed
            let parallax = (this.level === 3) ? 0.1 : (this.level === 2 ? 0.8 : 0.5);

            // Override: Pulsars move faster to match the foreground speed
            if (this.level === 3 && s.type === 'pulsar') parallax = 0.8;

            // 2. Calculate the position on the screen
            const drawX = s.x - (cameraX * parallax);

            // 3. Skip drawing if it's off-screen
            if (drawX + 300 < 0 || drawX > this.canvasWidth) return;

            // DRAWING ROUTER
            if (s.type === 'building') this.drawBuilding(ctx, drawX, s);
            else if (s.type === 'tent') this.drawTent(ctx, drawX, s);
            else if (s.type === 'wheel') this.drawFerrisWheel(ctx, drawX, s);
            else if (s.type === 'stand') this.drawFoodStand(ctx, drawX, s);
            else if (s.type === 'rollercoaster') this.drawRollercoaster(ctx, drawX, s);
            else if (s.type === 'stall') this.drawGameStall(ctx, drawX, s);
            else if (s.type === 'carousel') this.drawCarousel(ctx, drawX, s);
            else if (s.type === 'swingride') this.drawSwingRide(ctx, drawX, s);
            else if (s.type === 'elephant') this.drawElephant(ctx, drawX, s);
            else if (s.type === 'juggler') this.drawJuggler(ctx, drawX, s);
            else if (s.type === 'star') this.drawStar(ctx, drawX, s);
            else if (['jupiter', 'saturn', 'moon'].includes(s.type)) this.drawPlanet(ctx, drawX, s);
            else if (s.type === 'blackhole') this.drawBlackHole(ctx, drawX, s);
            else if (s.type === 'pulsar') this.drawPulsar(ctx, drawX, s);

        });
    }

    // --- ASSET DRAWING HELPERS ---


    drawFerrisWheel(ctx, x, s) {
        // 1. Logic for blinking based on secret count
        const isLit = s.signals && s.signals.some(sig => sig.timer < (sig.count * 40) && (sig.timer % 40 < 20));

        const centerY = s.y - 60;
        const radius = 40;
        const rotation = (Date.now() / 2000);

        // --- Your original drawing code starts here ---
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 30, centerY); ctx.lineTo(x + 10, s.y);
        ctx.moveTo(x + 30, centerY); ctx.lineTo(x + 50, s.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x + 30, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + rotation;
            const bx = x + 30 + Math.cos(angle) * radius;
            const by = centerY + Math.sin(angle) * radius;
            ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#ffffff';
            ctx.fillRect(bx - 4, by, 8, 6);
        }
        // --- Your original drawing code ends here ---

        // 2. Added Hub Blink (identifies the secrets without changing the structure)
        ctx.fillStyle = isLit ? '#fde047' : '#94a3b8';
        if (isLit) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
        }
        ctx.beginPath();
        ctx.arc(x + 30, centerY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset for performance
    }


    drawCarousel(ctx, x, s) {
        const isLit = s.signals && s.signals.some(sig => sig.timer < (sig.count * 40) && (sig.timer % 40 < 20));
        const bottomY = s.y;
        const centerX = x + 30;
        const carouselWidth = 60;
        const time = Date.now() / 1000;

        // 1. THE BASE
        ctx.fillStyle = '#475569';
        ctx.fillRect(x - 5, bottomY - 5, carouselWidth + 10, 5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(x - 5, bottomY - 2, carouselWidth + 10, 2);

        // 2. THE CENTRAL PILLAR
        ctx.fillStyle = '#d1d5db';
        ctx.fillRect(centerX - 4, bottomY - 45, 8, 40);

        // 3. MOVING HORSES & POLES
        // We draw 3 horses at different rotation points
        for (let i = 0; i < 3; i++) {
            const phase = i * (Math.PI * 2 / 3);
            // Horizontal "Rotation" effect using Cosine
            const rotX = Math.cos(time + phase) * 22;
            // Vertical "Bobbing" effect using Sine
            const bobY = Math.sin(time * 2 + phase) * 5;

            const horseX = centerX + rotX;
            const horseY = bottomY - 25 + bobY;

            // Draw the Pole (Silver)
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(horseX, bottomY - 45);
            ctx.lineTo(horseX, bottomY - 5);
            ctx.stroke();

            // Draw the Horse (Only if it's "in front" of or beside the center)
            // This simple depth check makes it look like it's going around
            ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#fde047';

            // Body
            ctx.fillRect(horseX - 5, horseY, 10, 5);
            // Head & Neck
            ctx.fillRect(horseX + (rotX > 0 ? 3 : -7), horseY - 4, 4, 5);
            // Tail
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(horseX + (rotX > 0 ? -7 : 5), horseY, 2, 2);
        }

        // 4. THE ROOF (Striped Peaked Canopy)
        ctx.fillStyle = '#ef4444'; // Red
        ctx.beginPath();
        ctx.moveTo(x - 10, bottomY - 45);
        ctx.lineTo(centerX, bottomY - 65);
        ctx.lineTo(x + carouselWidth + 10, bottomY - 45);
        ctx.fill();

        // Roof Stripes (Yellow)
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(centerX, bottomY - 65);
        ctx.lineTo(centerX - 8, bottomY - 45);
        ctx.lineTo(centerX + 8, bottomY - 45);
        ctx.fill();

        // Decorative Valance (The hanging edge of the roof)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x - 10, bottomY - 45, carouselWidth + 20, 4);

        // Adds a blinking "light" to the very top of your existing roof
        if (isLit) {
            ctx.fillStyle = '#fde047';
            ctx.shadowBlur = 15; ctx.shadowColor = '#ffffff';
            ctx.fillRect(centerX - 2, bottomY - 68, 4, 4);
            ctx.shadowBlur = 0;
        }
    }

    drawSwingRide(ctx, x, s) {
        const isLit = s.signals && s.signals.some(sig => sig.timer < (sig.count * 40) && (sig.timer % 40 < 20));
        const bottomY = s.y;
        const poleX = x + 25;
        const poleHeight = 70;
        const topY = bottomY - poleHeight;

        // 1. THE CENTRAL POLE
        ctx.fillStyle = '#475569'; // Slate grey
        ctx.fillRect(poleX - 4, topY, 8, poleHeight);

        // Add some detail to the pole (stripes)
        ctx.fillStyle = '#64748b';
        ctx.fillRect(poleX - 4, topY + 10, 8, 4);
        ctx.fillRect(poleX - 4, topY + 30, 8, 4);
        ctx.fillRect(poleX - 4, topY + 50, 8, 4);

        // 2. THE TOP CANOPY (The "Cap")
        ctx.fillStyle = '#ef4444'; // Red top
        ctx.beginPath();
        ctx.moveTo(poleX - 25, topY);
        ctx.lineTo(poleX, topY - 15);
        ctx.lineTo(poleX + 25, topY);
        ctx.fill();

        // Yellow trim on the cap
        ctx.fillStyle = isLit ? '#ffffff' : '#fde047';
        if (isLit) { ctx.shadowBlur = 10; ctx.shadowColor = '#ffffff'; }
        ctx.fillRect(poleX - 25, topY - 2, 50, 4);
        ctx.shadowBlur = 0;

        // 3. THE SWINGING SEATS
        const swingRange = 25; // How far they swing out
        const time = Date.now() / 800;

        // Draw 3 seats at different depths/angles
        const seatOffsets = [-1, 0, 1];
        seatOffsets.forEach(offset => {
            // Calculate a slightly staggered swing for each seat
            const swing = Math.sin(time + offset) * swingRange;
            const seatX = poleX + (offset * 15) + swing;
            const seatY = topY + 45;

            // Draw the Chain
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(poleX + (offset * 10), topY);
            ctx.lineTo(seatX, seatY);
            ctx.stroke();

            // Draw the Seat
            ctx.fillStyle = '#1e3a8a'; // Blue seat
            ctx.fillRect(seatX - 4, seatY, 8, 3);

            // Draw a tiny Passenger Head
            ctx.fillStyle = '#ffdbac';
            ctx.fillRect(seatX - 2, seatY - 4, 4, 4);
        });

        // 4. THE BASE
        ctx.fillStyle = '#334155';
        ctx.fillRect(poleX - 12, bottomY - 5, 24, 5);
    }

    drawChild(ctx, x, s) {
        const bob = Math.sin(Date.now() / 150) * 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

        // Use s.size to determine the height/width
        const height = s.size * 1.5;
        const width = s.size * 0.75;

        ctx.fillRect(x, s.y - height + bob, width, height); // Body
        ctx.beginPath();
        ctx.arc(x + width / 2, s.y - height - (width / 2) + bob, width / 2, 0, Math.PI * 2);
        ctx.fill(); // Head
    }

    // ... rest of Background module above ...

    drawBuilding(ctx, x, b) {
        ctx.fillStyle = b.color;
        ctx.fillRect(x, b.y, b.w, b.h);

        if (b.windows) {
            let winIdx = 0;
            for (let wy = b.y + 10; wy < b.y + b.h - 10; wy += 15) {
                for (let wx = x + 5; wx < x + b.w - 8; wx += 10) {
                    ctx.fillStyle = '#111827'; // Frame
                    ctx.fillRect(wx - 1, wy - 1, 5, 6);

                    const isNormallyLit = (Math.sin((wx - x) * wy + b.x) > 0);
                    let blinkActive = false;
                    const sig = b.signals ? b.signals.find(s => s.winIdx === winIdx) : null;

                    if (sig) {
                        if (sig.timer < (sig.count * 40) && (sig.timer % 40 < 20)) {
                            blinkActive = true;
                        }
                    }

                    if (blinkActive) {
                        ctx.save();
                        ctx.fillStyle = '#fde047';
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = '#ffffff';
                        ctx.fillRect(wx, wy, 3, 4);
                        ctx.restore();
                    } else if (isNormallyLit) {
                        ctx.fillStyle = '#fde047';
                        ctx.fillRect(wx, wy, 3, 4);
                    } else {
                        ctx.fillStyle = '#374151'; // Dark
                        ctx.fillRect(wx, wy, 3, 4);
                    }

                    if (isNormallyLit || blinkActive) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.fillRect(wx, wy, 1, 1);
                    }
                    winIdx++;
                }
            }
        }

        // --- Original Building Details (Kept exactly the same) ---
        ctx.fillStyle = b.color;
        ctx.fillRect(x - 2, b.y, b.w + 4, 3);
        if (b.w > 25) {
            ctx.fillStyle = '#9ca3af';
            ctx.fillRect(x + 5, b.y - 6, 12, 6);
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(x + 6, b.y - 4, 3, 3);

            // --- ANTENNA BLINK LOGIC ---
            const antennaSig = b.signals ? b.signals.find(sig => sig.isAntenna) : null;
            const isAntennaLit = antennaSig && (antennaSig.timer < (antennaSig.count * 40) && (antennaSig.timer % 40 < 20));

            // Set color: Yellow when blinking, original Dark Grey (#1f2937) otherwise
            ctx.fillStyle = isAntennaLit ? '#fde047' : '#1f2937';

            if (isAntennaLit) {
                ctx.save();
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffffff';
            }

            // Your original antenna drawing code
            ctx.fillRect(x + b.w - 10, b.y - 15, 1, 15);
            ctx.fillRect(x + b.w - 12, b.y - 12, 5, 1);

            if (isAntennaLit) {
                // Add a small 3x3 glowing tip at the top of your antenna pole
                ctx.fillRect(x + b.w - 11, b.y - 18, 3, 3);
                ctx.restore();
            }
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x, b.y + b.h - 2, b.w, 2);
    }

    updateSignals(cameraX, structures) {
        structures.forEach(s => {
            const structureScreenLeft = s.x - cameraX;
            const structureScreenRight = (s.x + s.width) - cameraX;
            // Calculate where the brick is relative to the screen center (128)
            const structureScreenCenter = structureScreenLeft + (s.width / 2);
            // Trigger the signal assignment only when the brick is near the middle of your screen
            const isVisibleOnScreen = structureScreenCenter > 100 && structureScreenCenter < 156;

            if (isVisibleOnScreen && s.secretCount > 0 && !s.isSignaled) {
                const structureScreenCenter = structureScreenLeft + (s.width / 2);

                const candidates = this.scenery
                    .filter(obj => {
                        let parallax = (this.level === 3) ? 0.1 : (this.level === 2 ? 0.8 : 0.5);
                        if (this.level === 3 && obj.type === 'pulsar') parallax = 0.8;
                        const bSX = obj.x - (cameraX * parallax);

                        // UPDATED: Allow any building (skyscraper or brown) to be a candidate
                        if (this.level === 1) return obj.type === 'building' && bSX > -obj.w && bSX < this.canvasWidth;
                        if (this.level === 2) return !['child', 'star', 'jupiter', 'saturn', 'moon', 'blackhole'].includes(obj.type) && bSX > -100 && bSX < this.canvasWidth;
                        if (this.level === 3) return obj.type === 'pulsar' && bSX > -50 && bSX < this.canvasWidth + 50;
                        return false;
                    })
                    .map(obj => {
                        let parallax = (this.level === 3) ? 0.1 : (this.level === 2 ? 0.8 : 0.5);

                        // Override for pulsars so they move at foreground speed
                        if (this.level === 3 && obj.type === 'pulsar') parallax = 0.8;

                        // YOU WERE MISSING THIS LINE:
                        const bSX = obj.x - (cameraX * parallax);

                        return { obj: obj, dist: Math.abs(bSX - structureScreenCenter) };
                    })
                    .sort((a, b) => a.dist - b.dist);

                if (candidates.length > 0) {
                    const target = candidates[0].obj;
                    if (this.level === 2) {
                        target.signals.push({ count: s.secretCount, timer: 0 });
                        s.isSignaled = true;
                    } else if (this.level === 1) {
                        if (target.windows) {
                            // Existing logic for Skyscraper windows
                            let foundWinIdx = -1;
                            let currentIdx = 0;
                            for (let wy = target.y + 10; wy < target.y + target.h - 10; wy += 15) {
                                for (let wx = 5; wx < target.w - 8; wx += 10) {
                                    if (!(Math.sin(wx * wy + target.x) > 0) && !target.signals.some(sig => sig.winIdx === currentIdx)) {
                                        foundWinIdx = currentIdx;
                                        break;
                                    }
                                    currentIdx++;
                                }
                                if (foundWinIdx !== -1) break;
                            }
                            if (foundWinIdx !== -1) {
                                target.signals.push({ count: s.secretCount, timer: 0, winIdx: foundWinIdx });
                                s.isSignaled = true;
                            }
                        } else if (target.w > 25 && !target.signals.some(sig => sig.isAntenna)) {
                            // NEW: Assign signal to Antenna for brown buildings (if they have one)
                            target.signals.push({ count: s.secretCount, timer: 0, isAntenna: true });
                            s.isSignaled = true;
                        }
                    } else if (this.level === 3) { // Add this block
                        // Signal the pulsar for Level 1-3
                        target.signals.push({ count: s.secretCount, timer: 0 });
                        s.isSignaled = true;
                    }
                }
            }
        });

        // Update timers for all active signals
        this.scenery.forEach(obj => {
            if (obj.signals) {
                obj.signals = obj.signals.filter(sig => {
                    sig.timer++;
                    // Remove the signal after one 200-frame cycle (approx 3 seconds)
                    return sig.timer < 200;
                });
            }
        });
    }
    // --- MISSING DRAWING METHODS FOR LEVELS 2 & 3 ---

    drawTent(ctx, x, s) {
        const isLit = s.signals && s.signals.some(sig => sig.timer < (sig.count * 40) && (sig.timer % 40 < 20));
        const bottomY = s.y;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.moveTo(x, bottomY);
        ctx.lineTo(x + 25, bottomY - 40);
        ctx.lineTo(x + 50, bottomY);
        ctx.fill();
        ctx.fillStyle = s.color === '#ffffff' ? '#ef4444' : '#ffffff';
        ctx.fillRect(x + 20, bottomY - 15, 10, 15);
        if (isLit) {
            ctx.fillStyle = '#fde047'; ctx.shadowBlur = 10; ctx.shadowColor = '#ffffff';
            ctx.beginPath(); ctx.arc(x + 25, bottomY - 42, 4, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    drawFoodStand(ctx, x, s) {
        const isLit = s.signals && s.signals.some(sig => sig.timer < (sig.count * 40) && (sig.timer % 40 < 20));
        const bottomY = s.y;

        // 1. MAIN STRUCTURE (Wooden base)
        ctx.fillStyle = '#8b4513'; // Saddle Brown
        ctx.fillRect(x, bottomY - 30, 40, 30);

        // 2. COUNTER TOP (Slightly wider than the base)
        ctx.fillStyle = '#5d2e0a'; // Darker wood brown
        ctx.fillRect(x - 2, bottomY - 18, 44, 3);

        // 3. SERVICE WINDOW (Dark interior)
        ctx.fillStyle = '#2d1a0a';
        ctx.fillRect(x + 4, bottomY - 28, 32, 10);

        // 4. STRIPED AWNING
        const awningY = bottomY - 35;
        // White base for awning
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 4, awningY, 48, 8);

        // Red Stripes
        ctx.fillStyle = '#ef4444';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(x - 4 + (i * 8), awningY, 4, 8);
        }

        // Awning fringe (The small decorative points at the bottom)
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.moveTo(x - 4 + (i * 4), awningY + 8);
            ctx.lineTo(x - 2 + (i * 4), awningY + 11);
            ctx.lineTo(x + (i * 4), awningY + 8);
            ctx.fill();
        }

        // 5. OVERHEAD SIGN
        // White sign board
        ctx.fillStyle = isLit ? '#fde047' : '#ffffff';
        if (isLit) { ctx.shadowBlur = 15; ctx.shadowColor = '#ffffff'; }
        ctx.fillRect(x + 10, bottomY - 48, 20, 10);
        ctx.shadowBlur = 0;

        // Red "Text" simulation
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + 13, bottomY - 44, 14, 2); // Top line
        ctx.fillRect(x + 15, bottomY - 41, 10, 1); // Bottom line
    }

    drawRollercoaster(ctx, x, s) {
        // 1. Detect if a secret is nearby to trigger the blink
        const isLit = s.signals && s.signals.some(sig => sig.timer < (sig.count * 40) && (sig.timer % 40 < 20));

        const groundY = s.y;
        const loopR = 25; // Radius of the circular loop
        const loopCX = x + 85; // Center X of the loop
        const loopCY = groundY - 60; // Center Y of the loop

        // Path helper function: maps t (0 to 1) to an (x, y) coordinate
        const getPos = (t) => {
            if (t < 0.3) {
                // Segment 1: Approach Path (0.0 - 0.3)
                const tLocal = t / 0.3;
                const p0 = { x: x, y: groundY };
                const p1 = { x: x + 40, y: groundY - 10 };
                const p2 = { x: x + 60, y: groundY - 20 };
                const p3 = { x: loopCX, y: loopCY + loopR }; // Bottom of the loop
                return {
                    x: (1 - tLocal) ** 3 * p0.x + 3 * (1 - tLocal) ** 2 * tLocal * p1.x + 3 * (1 - tLocal) * tLocal ** 2 * p2.x + tLocal ** 3 * p3.x,
                    y: (1 - tLocal) ** 3 * p0.y + 3 * (1 - tLocal) ** 2 * tLocal * p1.y + 3 * (1 - tLocal) * tLocal ** 2 * p2.y + tLocal ** 3 * p3.y
                };
            } else if (t < 0.7) {
                // Segment 2: The Full Circle Loop (0.3 - 0.7)
                const tLocal = (t - 0.3) / 0.4;
                const angle = (Math.PI / 2) + (tLocal * Math.PI * 2);
                return {
                    x: loopCX + Math.cos(angle) * loopR,
                    y: loopCY + Math.sin(angle) * loopR
                };
            } else {
                // Segment 3: Exit Path (0.7 - 1.0)
                const tLocal = (t - 0.7) / 0.3;
                const p0 = { x: loopCX, y: loopCY + loopR }; // Bottom of the loop
                const p1 = { x: x + 110, y: groundY - 20 };
                const p2 = { x: x + 140, y: groundY - 60 };
                const p3 = { x: x + 175, y: groundY - 45 };
                return {
                    x: (1 - tLocal) ** 3 * p0.x + 3 * (1 - tLocal) ** 2 * tLocal * p1.x + 3 * (1 - tLocal) * tLocal ** 2 * p2.x + tLocal ** 3 * p3.x,
                    y: (1 - tLocal) ** 3 * p0.y + 3 * (1 - tLocal) ** 2 * tLocal * p1.y + 3 * (1 - tLocal) * tLocal ** 2 * p2.y + tLocal ** 3 * p3.y
                };
            }
        };

        // 2. DRAW SCAFFOLDING SUPPORTS
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 24; i++) {
            const t = i / 24;
            const pos = getPos(t);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x, groundY);
            ctx.stroke();
            for (let sy = pos.y + 8; sy < groundY; sy += 12) {
                ctx.beginPath();
                ctx.moveTo(pos.x - 2, sy); ctx.lineTo(pos.x + 2, sy);
                ctx.stroke();
            }
        }

        // 3. DRAW THE DUAL TRACK RAILS
        const drawTrack = (offsetY, width, color) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.beginPath();
            let start = getPos(0);
            ctx.moveTo(start.x, start.y + offsetY);
            for (let i = 1; i <= 80; i++) {
                let p = getPos(i / 80);
                ctx.lineTo(p.x, p.y + offsetY);
            }
            ctx.stroke();
        };
        drawTrack(0, 3, '#94a3b8'); // Main Rail
        drawTrack(2, 1, '#64748b'); // Detail Inner Rail

        // 4. ANIMATED CARS (Oscillating back and forth)
        const cycleTime = 7000; // Time for one round trip
        const rawT = (Date.now() % cycleTime) / cycleTime;
        const oscillatingT = rawT < 0.5 ? rawT * 2 : 2 - (rawT * 2);
        const isReversing = rawT >= 0.5;

        for (let i = 0; i < 3; i++) {
            const carSpacing = i * 0.04;
            const t = isReversing ? Math.min(1, oscillatingT + carSpacing) : Math.max(0, oscillatingT - carSpacing);
            const pos = getPos(t);

            ctx.save();
            ctx.translate(pos.x, pos.y);

            // Calculate tangent angle for rotation
            const nextT = isReversing ? Math.max(0, t - 0.01) : Math.min(1, t + 0.01);
            const posNext = getPos(nextT);
            const angle = Math.atan2(posNext.y - pos.y, posNext.x - pos.x);
            ctx.rotate(angle);

            // --- CAR BODY COLOR LOGIC (Blinking cars) ---
            const isLead = (!isReversing && i === 0) || (isReversing && i === 2);

            if (isLit) {
                ctx.fillStyle = '#ffffff'; // The car body flashes white
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffffff';
            } else {
                ctx.fillStyle = isLead ? '#ef4444' : '#fde047'; // Normal Red/Yellow
                ctx.shadowBlur = 0;
            }

            ctx.fillRect(-4, -6, 8, 5); // Car Body
            ctx.shadowBlur = 0; // Reset shadow for passenger heads

            // Tiny Passenger Heads
            ctx.fillStyle = '#ffdbac';
            ctx.fillRect(-2, -8, 2, 2); ctx.fillRect(1, -8, 2, 2);

            // Wheels
            ctx.fillStyle = '#1e2937';
            ctx.fillRect(-4, -1, 3, 2); ctx.fillRect(1, -1, 3, 2);

            ctx.restore();
        }
    }

    drawGameStall(ctx, x, s) {
        const bottomY = s.y;
        const isLit = s.signals && s.signals.some(sig => sig.timer < (sig.count * 40) && (sig.timer % 40 < 20));

        // 1. MAIN STRUCTURE
        ctx.fillStyle = '#4b5563'; // Slate grey base
        ctx.fillRect(x, bottomY - 30, 45, 30);

        // 2. BACK SHELF & STUFFED ANIMALS
        ctx.fillStyle = '#1f2937'; // Dark interior
        ctx.fillRect(x + 4, bottomY - 28, 37, 12);

        // Draw 3 "Stuffed Animals" (Colorful blobs with ears)
        const colors = ['#f472b6', '#60a5fa', '#fbbf24']; // Pink, Blue, Yellow
        colors.forEach((color, i) => {
            const prizeX = x + 8 + (i * 12);
            const prizeY = bottomY - 22;

            ctx.fillStyle = color;
            // Body
            ctx.fillRect(prizeX, prizeY, 6, 6);
            // Ears
            ctx.fillRect(prizeX, prizeY - 2, 2, 2);
            ctx.fillRect(prizeX + 4, prizeY - 2, 2, 2);
            // "Eyes"
            ctx.fillStyle = '#000000';
            ctx.fillRect(prizeX + 1, prizeY + 2, 1, 1);
            ctx.fillRect(prizeX + 4, prizeY + 2, 1, 1);
        });

        // 3. FRONT COUNTER & GAME PIECES
        ctx.fillStyle = '#374151'; // Counter top
        ctx.fillRect(x - 2, bottomY - 16, 49, 3);

        // Draw "Bottles" (Game targets) on the counter
        // Bottles glow when blinking
        ctx.fillStyle = isLit ? '#fde047' : '#ffffff';
        if (isLit) { ctx.shadowBlur = 10; ctx.shadowColor = '#ffffff'; }
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 10 + (i * 10), bottomY - 20, 3, 4);
            ctx.fillRect(x + 11 + (i * 10), bottomY - 22, 1, 2);
        }
        ctx.shadowBlur = 0;

        // 4. BLUE STRIPED AWNING
        const awningY = bottomY - 38;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 4, awningY, 53, 8);

        ctx.fillStyle = '#3b82f6'; // Blue stripes
        for (let i = 0; i < 7; i++) {
            ctx.fillRect(x - 4 + (i * 8), awningY, 4, 8);
        }

        // Scalloped fringe
        for (let i = 0; i < 13; i++) {
            ctx.beginPath();
            ctx.moveTo(x - 4 + (i * 4), awningY + 8);
            ctx.lineTo(x - 2 + (i * 4), awningY + 11);
            ctx.lineTo(x + (i * 4), awningY + 8);
            ctx.fill();
        }
    }

    drawElephant(ctx, x, s) {
        const isLit = s.signals && s.signals.some(sig => sig.timer < (sig.count * 40) && (sig.timer % 40 < 20));
        const bottomY = s.y;
        const mainGrey = '#94a3b8';
        const darkGrey = '#64748b';
        ctx.fillStyle = mainGrey;

        // 1. LEGS (Thicker with toe details)
        ctx.fillRect(x, bottomY - 10, 7, 10);      // Back leg 1
        ctx.fillRect(x + 8, bottomY - 8, 6, 8);    // Back leg 2
        ctx.fillRect(x + 22, bottomY - 10, 7, 10); // Front leg 1
        ctx.fillRect(x + 30, bottomY - 8, 6, 8);   // Front leg 2

        // Add "Toes" and Knee wrinkles
        ctx.fillStyle = darkGrey;
        ctx.fillRect(x, bottomY - 2, 7, 1);       // Back foot shadow
        ctx.fillRect(x + 22, bottomY - 2, 7, 1);  // Front foot shadow
        ctx.fillRect(x + 22, bottomY - 6, 7, 1);  // Front knee wrinkle

        // 2. BODY (Slightly larger and more rounded)
        ctx.fillStyle = mainGrey;
        ctx.beginPath();
        ctx.ellipse(x + 18, bottomY - 22, 24, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. HEAD
        ctx.beginPath();
        ctx.arc(x + 40, bottomY - 30, 12, 0, Math.PI * 2);
        ctx.fill();

        // 4. THE EAR (Refined "Flapped" shape)
        ctx.fillStyle = darkGrey;
        ctx.beginPath();
        ctx.moveTo(x + 35, bottomY - 38);
        ctx.bezierCurveTo(x + 25, bottomY - 40, x + 25, bottomY - 15, x + 38, bottomY - 18);
        ctx.fill();

        // 5. THE TRUNK (With wrinkle texture)
        ctx.strokeStyle = mainGrey;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x + 48, bottomY - 30);
        ctx.quadraticCurveTo(x + 58, bottomY - 30, x + 58, bottomY - 10);
        ctx.quadraticCurveTo(x + 58, bottomY - 2, x + 52, bottomY - 4);
        ctx.stroke();

        // Darker lines for trunk wrinkles
        ctx.strokeStyle = darkGrey;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 54, bottomY - 25); ctx.lineTo(x + 58, bottomY - 25);
        ctx.moveTo(x + 55, bottomY - 18); ctx.lineTo(x + 59, bottomY - 18);
        ctx.stroke();

        // 6. IVORY TUSK
        ctx.fillStyle = '#fefce8'; // Off-white ivory
        ctx.beginPath();
        ctx.moveTo(x + 48, bottomY - 26);
        ctx.lineTo(x + 54, bottomY - 22);
        ctx.lineTo(x + 46, bottomY - 22);
        ctx.fill();

        // 7. EYE

        ctx.fillStyle = isLit ? '#fde047' : '#000000';
        if (isLit) { ctx.shadowBlur = 10; ctx.shadowColor = '#ffffff'; }
        ctx.fillRect(x + 44, bottomY - 34, 3, 3);
        ctx.shadowBlur = 0;

        // 8. TAIL
        ctx.strokeStyle = darkGrey;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 4, bottomY - 25);
        ctx.lineTo(x - 8, bottomY - 12);
        ctx.stroke();
    }

    drawJuggler(ctx, x, s) {
        const isLit = s.signals && s.signals.some(sig => sig.timer < (sig.count * 40) && (sig.timer % 40 < 20));
        const bottomY = s.y;
        const bodyX = x + 10;
        const time = Date.now() / 400;

        // 1. DRAW THE JUGGLER
        ctx.fillStyle = '#312e81';
        ctx.fillRect(bodyX - 3, bottomY - 8, 3, 8);
        ctx.fillRect(bodyX + 2, bottomY - 8, 3, 8);
        ctx.fillRect(bodyX - 4, bottomY - 20, 10, 12);
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(bodyX - 1, bottomY - 26, 6, 6);
        const armWave = Math.sin(time * 2) * 4;
        ctx.fillRect(bodyX - 8, bottomY - 18 + armWave, 4, 3);
        ctx.fillRect(bodyX + 8, bottomY - 18 - armWave, 4, 3);

        // 2. JUGGLING PINS (Blink yellow when secret is nearby)
        ctx.fillStyle = isLit ? '#fde047' : '#ffffff';
        if (isLit) { ctx.shadowBlur = 8; ctx.shadowColor = '#ffffff'; }

        for (let i = 0; i < 3; i++) {
            const t = (time + (i * (Math.PI * 2 / 3))) % (Math.PI * 2);
            const pinX = bodyX + Math.cos(t) * 15;
            const pinY = (bottomY - 35) + Math.sin(t) * 12;
            ctx.save();
            ctx.translate(pinX, pinY);
            ctx.rotate(t * 2);
            ctx.fillRect(-1, -3, 2, 6);
            ctx.beginPath(); ctx.arc(0, -3, 2, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        ctx.shadowBlur = 0;
    }
    drawStar(ctx, x, s) {
        const opacity = s.twinkle ? (0.3 + Math.abs(Math.sin(Date.now() / 500)) * 0.7) : 1;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(x, s.y, s.size, s.size);
    }

    drawPlanet(ctx, x, s) {
        ctx.fillStyle = s.type === 'jupiter' ? '#fb923c' : (s.type === 'saturn' ? '#fde047' : '#94a3b8');
        ctx.beginPath();
        ctx.arc(x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        if (s.type === 'saturn') {
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(x, s.y, s.size * 2, s.size * 0.5, 0.2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawBlackHole(ctx, x, s) {
        const time = Date.now() / 1000;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, s.y, s.size + 5 + Math.sin(time) * 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawPulsar(ctx, x, s) {
        const isLit = s.signals && s.signals.some(sig => sig.timer < (sig.count * 40) && (sig.timer % 40 < 20));
        const centerY = s.y;

        // 1. Draw the Base Star
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 1, centerY - 1, 2, 2);

        // 2. Draw the Signal Rings (Only when lit)
        if (isLit) {
            const time = Date.now() / 500;
            ctx.strokeStyle = '#38bdf8'; // Light Blue / Cyan
            ctx.lineWidth = 1;

            for (let i = 0; i < 2; i++) {
                // Expanding rings
                const radius = ((Date.now() / 10 + (i * 15)) % 30);
                const opacity = 1 - (radius / 30);

                ctx.globalAlpha = opacity;
                ctx.beginPath();
                ctx.arc(x, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Central Glow
            ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.5;
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#38bdf8';
            ctx.beginPath();
            ctx.arc(x, centerY, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        }
    }

}