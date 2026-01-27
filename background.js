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
        const foregroundStopPoint = 2900;

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
        const pool = ['tent', 'wheel', 'stand', 'rollercoaster', 'stall', 'carousel', 'swingride', 'elephant', 'popcorn'];

        // 1. CHOOSE YOUR STOP POINT
        // This is the point in the "Foreground" (where the player walks) 
        // where you want the background to be completely empty.
        const foregroundStopPoint = 2900;

        // 2. GENERATE BUILDINGS/TENTS (0.8 Parallax)
        // We multiply the stop point by 0.8 so the background ends exactly 
        // when the player reaches that distance.
        const buildingLimit = foregroundStopPoint * 0.8;

        while (cx < buildingLimit) {
            const type = pool[Math.floor(Math.random() * pool.length)];
            this.scenery.push({
                type: type,
                x: cx,
                y: this.groundY,
                color: Math.random() > 0.5 ? '#ef4444' : '#ffffff'
            });
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
        const sceneryLimit = 650;

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

            const parallax = (this.level === 3) ? 0.1 : (this.level === 2 ? 0.8 : 0.5);
            const drawX = s.x - (cameraX * parallax);

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
            else if (s.type === 'popcorn') this.drawPopcorn(ctx, drawX, s);
            else if (s.type === 'star') this.drawStar(ctx, drawX, s);
            else if (['jupiter', 'saturn', 'moon'].includes(s.type)) this.drawPlanet(ctx, drawX, s);
            else if (s.type === 'blackhole') this.drawBlackHole(ctx, drawX, s);


        });
    }

    // --- ASSET DRAWING HELPERS ---


    drawFerrisWheel(ctx, x, s) {
        const centerY = s.y - 60;
        const radius = 40;
        const rotation = (Date.now() / 2000);
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
    }



    drawCarousel(ctx, x, s) {
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
    }

    drawSwingRide(ctx, x, s) {
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
        ctx.fillStyle = '#fde047';
        ctx.fillRect(poleX - 25, topY - 2, 50, 4);

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

                    // 1. Calculate if this window is normally lit yellow
                    const isNormallyLit = (Math.sin((wx - x) * wy + b.x) > 0);

                    // 2. Find if this specific window index is assigned to an active signal
                    let blinkActive = false;
                    const sig = b.signals ? b.signals.find(s => s.winIdx === winIdx) : null;

                    if (sig) {
                        const blinkDuration = sig.count * 40;
                        if (sig.timer < (sig.count * 40) && (sig.timer % 40 < 20)) {
                            blinkActive = true;
                        }
                    }

                    // 3. Final Drawing logic
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

        // --- Building Details (Unchanged) ---
        ctx.fillStyle = b.color;
        ctx.fillRect(x - 2, b.y, b.w + 4, 3);
        if (b.w > 25) {
            ctx.fillStyle = '#9ca3af';
            ctx.fillRect(x + 5, b.y - 6, 12, 6);
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(x + 6, b.y - 4, 3, 3);
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(x + b.w - 10, b.y - 15, 1, 15);
            ctx.fillRect(x + b.w - 12, b.y - 12, 5, 1);
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x, b.y + b.h - 2, b.w, 2);
    }

    updateSignals(cameraX, structures) {
        if (this.level !== 1) return;

        structures.forEach(s => {
            // 1. IMPROVED VISIBILITY: Trigger when the structure is mostly on screen (10px buffer)
            const structureScreenLeft = s.x - cameraX;
            const structureScreenRight = (s.x + s.width) - cameraX;
            const isVisibleOnScreen = structureScreenLeft >= -10 && structureScreenRight <= this.canvasWidth + 10;

            if (isVisibleOnScreen && s.secretCount > 0 && !s.isSignaled) {
                const structureScreenCenter = structureScreenLeft + (s.width / 2);

                const sMinY = Math.min(...s.platforms.map(p => p.y));
                const sMaxY = Math.max(...s.platforms.map(p => p.y + 16));

                // 2. WIDER SEARCH: Look at all buildings currently visible to find a Safe Y
                const candidates = this.scenery
                    .filter(obj => {
                        const bSX = obj.x - (cameraX * 0.5);
                        return obj.type === 'building' && obj.windows && bSX > -obj.w && bSX < this.canvasWidth;
                    })
                    .map(obj => {
                        const bSX = obj.x - (cameraX * 0.5);
                        return { building: obj, dist: Math.abs((bSX + obj.w / 2) - structureScreenCenter) };
                    })
                    .sort((a, b) => a.dist - b.dist);

                for (let cand of candidates) {
                    const b = cand.building;
                    let foundWinIdx = -1;
                    let currentIdx = 0;

                    for (let wy = b.y + 10; wy < b.y + b.h - 10; wy += 15) {
                        for (let wx = 5; wx < b.w - 8; wx += 10) {
                            const isNormallyLit = (Math.sin(wx * wy + b.x) > 0);

                            // Safe Y: Ensures the window is vertically above or below the brick cluster
                            const isSafeY = (wy + 4 < sMinY || wy > sMaxY);

                            const isAvailable = !b.signals.some(sig => sig.winIdx === currentIdx);

                            if (!isNormallyLit && isSafeY && isAvailable) {
                                foundWinIdx = currentIdx;
                                break;
                            }
                            currentIdx++;
                        }
                        if (foundWinIdx !== -1) break;
                    }

                    if (foundWinIdx !== -1) {
                        b.signals.push({ count: s.secretCount, timer: 0, winIdx: foundWinIdx });
                        s.isSignaled = true;
                        break; // Stop searching once a building is assigned
                    }
                }
            }
        });

        this.scenery.forEach(obj => {
            if (obj.signals) {
                obj.signals.forEach(sig => {
                    sig.timer++;

                    // Use a fixed 300 frames (5 seconds at 60fps) for the entire loop
                    const sequenceEnd = 300;

                    if (sig.timer >= sequenceEnd) {
                        sig.timer = 0; // Restarts the loop every 5 seconds exactly
                    }
                });
            }
        });
    }

    // --- MISSING DRAWING METHODS FOR LEVELS 2 & 3 ---

    drawTent(ctx, x, s) {
        const bottomY = s.y;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.moveTo(x, bottomY);
        ctx.lineTo(x + 25, bottomY - 40);
        ctx.lineTo(x + 50, bottomY);
        ctx.fill();
        ctx.fillStyle = s.color === '#ffffff' ? '#ef4444' : '#ffffff';
        ctx.fillRect(x + 20, bottomY - 15, 10, 15);
    }

    drawFoodStand(ctx, x, s) {
        const bottomY = s.y;
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(x, bottomY - 20, 30, 20);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x - 5, bottomY - 25, 40, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 5, bottomY - 15, 20, 10);
    }

    drawRollercoaster(ctx, x, s) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, s.y);
        ctx.bezierCurveTo(x + 50, s.y - 100, x + 100, s.y + 50, x + 150, s.y - 50);
        ctx.stroke();
    }

    drawGameStall(ctx, x, s) {
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(x, s.y - 30, 40, 30);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(x + 5, s.y - 25, 30, 15);
    }

    drawElephant(ctx, x, s) {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x, s.y - 20, 25, 15);
        ctx.fillRect(x - 5, s.y - 18, 8, 8);
        ctx.fillRect(x - 8, s.y - 12, 5, 2);
    }

    drawPopcorn(ctx, x, s) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x, s.y - 15, 10, 15);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, s.y - 18, 6, 6);
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

}