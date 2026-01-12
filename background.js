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
                windows: isSkyscraper
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

    drawBuilding(ctx, x, b) {
        const shadowColor = 'rgba(0, 0, 0, 0.2)';
        const highlightColor = 'rgba(255, 255, 255, 0.1)';

        // 1. MAIN STRUCTURE
        ctx.fillStyle = b.color;
        ctx.fillRect(x, b.y, b.w, b.h);

        // 2. DEPTH & SHADING
        ctx.fillStyle = shadowColor;
        ctx.fillRect(x + b.w - 4, b.y, 4, b.h);

        ctx.fillStyle = highlightColor;
        ctx.fillRect(x, b.y, b.w, 2);

        // 3. WINDOWS
        if (b.windows) {
            for (let wy = b.y + 10; wy < b.y + b.h - 10; wy += 15) {
                for (let wx = x + 5; wx < x + b.w - 8; wx += 10) {
                    ctx.fillStyle = '#111827';
                    ctx.fillRect(wx - 1, wy - 1, 5, 6);

                    // FIXED: Use the static world coordinate (b.x) and relative offset (wx - x) 
                    // to calculate the lit state instead of the moving screen coordinate (x).
                    const relativeX = wx - x;
                    const isLit = (Math.sin(relativeX * wy + b.x) > 0);

                    ctx.fillStyle = isLit ? '#fde047' : '#374151';
                    ctx.fillRect(wx, wy, 3, 4);

                    if (isLit) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.fillRect(wx, wy, 1, 1);
                    }
                }
            }
        }

        // 4. ROOF DETAILS
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

    drawTent(ctx, x, s) {
        const bottomY = s.y;
        const tentWidth = 80;
        const tentHeight = 60;
        const centerX = x + tentWidth / 2;

        // 1. DRAW MAIN BODY (Red and White Stripes)
        // Base Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, bottomY - 40, tentWidth, 40);

        // Red Stripes
        ctx.fillStyle = '#ef4444';
        for (let i = 0; i < tentWidth; i += 20) {
            ctx.fillRect(x + i, bottomY - 40, 10, 40);
        }

        // 2. DRAW THE ROOF (The "Big Top" Peak)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(x - 5, bottomY - 40);
        ctx.lineTo(centerX, bottomY - tentHeight);
        ctx.lineTo(x + tentWidth + 5, bottomY - 40);
        ctx.fill();

        // Roof Stripes (Darker red for depth)
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(centerX, bottomY - tentHeight);
        ctx.lineTo(centerX - 15, bottomY - 40);
        ctx.lineTo(centerX + 15, bottomY - 40);
        ctx.fill();

        // 3. SCALLOPED EDGES (The decorative trim)
        ctx.fillStyle = '#fde047'; // Yellow trim
        for (let i = -5; i <= tentWidth + 5; i += 10) {
            ctx.beginPath();
            ctx.arc(x + i, bottomY - 40, 5, 0, Math.PI);
            ctx.fill();
        }

        // 4. THE ENTRANCE
        ctx.fillStyle = '#1e1b4b'; // Dark blue interior
        ctx.beginPath();
        ctx.moveTo(centerX - 10, bottomY);
        ctx.lineTo(centerX, bottomY - 25);
        ctx.lineTo(centerX + 10, bottomY);
        ctx.fill();

        // 5. THE FLAG
        // Pole
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, bottomY - tentHeight);
        ctx.lineTo(centerX, bottomY - tentHeight - 15);
        ctx.stroke();

        // Flag Fabric (Waving effect)
        const wave = Math.sin(Date.now() / 300) * 3;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(centerX, bottomY - tentHeight - 15);
        ctx.lineTo(centerX + 12, bottomY - tentHeight - 10 + wave);
        ctx.lineTo(centerX, bottomY - tentHeight - 5);
        ctx.fill();
    }

    drawFoodStand(ctx, x, s) {
        const bottomY = s.y;
        const standWidth = 50;
        const standHeight = 35;
        const woodColor = '#7c2d12';
        const shadowColor = '#451a03';

        // 1. MAIN WOODEN BASE
        ctx.fillStyle = woodColor;
        ctx.fillRect(x, bottomY - standHeight, standWidth, standHeight);

        // Add "Plank" lines for texture
        ctx.fillStyle = shadowColor;
        ctx.fillRect(x, bottomY - 24, standWidth, 1);
        ctx.fillRect(x, bottomY - 12, standWidth, 1);

        // 2. COUNTERTOP
        ctx.fillStyle = '#94a3b8'; // Slate grey counter
        ctx.fillRect(x - 2, bottomY - 28, standWidth + 4, 3);

        // 3. MENU BOARD (On the side)
        ctx.fillStyle = '#111827'; // Black chalkboard
        ctx.fillRect(x + 5, bottomY - 22, 12, 15);
        ctx.fillStyle = '#ffffff'; // White "chalk" lines
        ctx.fillRect(x + 7, bottomY - 19, 8, 1);
        ctx.fillRect(x + 7, bottomY - 16, 6, 1);
        ctx.fillRect(x + 7, bottomY - 13, 7, 1);

        // 4. STRIPED AWNING
        // Awning Supports
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 2, bottomY - standHeight);
        ctx.lineTo(x + 2, bottomY - 50);
        ctx.moveTo(x + standWidth - 2, bottomY - standHeight);
        ctx.lineTo(x + standWidth - 2, bottomY - 50);
        ctx.stroke();

        // Main Awning Body (Yellow and White Stripes)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 5, bottomY - 55, standWidth + 10, 8);
        ctx.fillStyle = '#fbbf24'; // Golden yellow
        for (let i = -5; i < standWidth + 10; i += 12) {
            ctx.fillRect(x + i, bottomY - 55, 6, 8);
        }

        // 5. SIGNAGE
        ctx.fillStyle = '#ef4444'; // Red sign board
        ctx.fillRect(x + 20, bottomY - 52, 25, 10);
        ctx.fillStyle = '#ffffff'; // Simple pixel "text"
        ctx.fillRect(x + 23, bottomY - 48, 19, 2);

        // 6. GROUND SHADOW
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x - 2, bottomY, standWidth + 4, 2);
    }

    drawGameStall(ctx, x, s) {
        const bottomY = s.y;
        // Frame
        ctx.fillStyle = '#451a03';
        ctx.fillRect(x, bottomY - 35, 45, 35);
        // Interior Light
        ctx.fillStyle = '#fde047';
        ctx.fillRect(x + 5, bottomY - 30, 35, 20);
        // Decorative Pillars
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(x, bottomY - 35, 5, 35);
        ctx.fillRect(x + 40, bottomY - 35, 5, 35);
    }

    drawRollercoaster(ctx, x, s) {
        const bottomY = s.y;
        const totalWidth = 220;

        // 1. Path Calculation: A consistent function for track, supports, and carts
        const getTrackY = (relX) => {
            if (relX < 0 || relX > totalWidth) return bottomY;
            let h = 0;
            if (relX < 130) {
                // First Hill (taller)
                h = Math.sin((relX / 130) * Math.PI) * 150;
            } else {
                // Second Hill (shorter)
                h = Math.sin(((relX - 130) / (totalWidth - 130)) * Math.PI) * 70;
            }
            return bottomY - h;
        };

        // 2. Draw Support Lattice
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        for (let sx = 0; sx <= totalWidth; sx += 20) {
            const trackY = getTrackY(sx);
            // Vertical beam
            ctx.beginPath();
            ctx.moveTo(x + sx, bottomY);
            ctx.lineTo(x + sx, trackY);
            ctx.stroke();

            // Diagonal bracing
            if (sx < totalWidth) {
                ctx.beginPath();
                ctx.moveTo(x + sx, bottomY);
                ctx.lineTo(x + sx + 20, getTrackY(sx + 20));
                ctx.stroke();
            }
        }

        // 3. Draw Main Rails
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, bottomY);
        for (let i = 0; i <= totalWidth; i += 5) {
            ctx.lineTo(x + i, getTrackY(i));
        }
        ctx.stroke();

        // 4. Draw Moving Coaster Carts
        const time = Date.now() / 4000; // Speed of the coaster
        const cartsInTrain = 3;

        for (let i = 0; i < cartsInTrain; i++) {
            // Cart progress cycles from 0 to 1.2 (to allow gap between trains)
            const progress = (time - (i * 0.04)) % 1.2;

            if (progress < 1.0) {
                const cartRelX = progress * totalWidth;
                const cartX = x + cartRelX;
                const cartY = getTrackY(cartRelX);

                // Draw Cart Body
                ctx.fillStyle = '#ef4444'; // Red coaster
                ctx.fillRect(cartX - 4, cartY - 7, 8, 6);

                // Draw Little Passenger Heads
                ctx.fillStyle = '#ffdbac';
                ctx.fillRect(cartX - 2, cartY - 9, 2, 2);
                ctx.fillRect(cartX + 1, cartY - 9, 2, 2);

                // Wheel highlight
                ctx.fillStyle = '#000';
                ctx.fillRect(cartX - 3, cartY - 2, 2, 2);
                ctx.fillRect(cartX + 1, cartY - 2, 2, 2);
            }
        }
    }

    drawElephant(ctx, x, s) {
        const bottomY = s.y;
        const bodyColor = '#64748b'; // Slate Grey
        const darkGrey = '#475569';
        const lightGrey = '#94a3b8';

        ctx.save();
        ctx.translate(x, bottomY);

        // --- SCALE ADDED HERE: Makes the whole drawing 25% smaller ---
        ctx.scale(0.75, 0.75);

        // 1. LEGS (Draw back legs first for depth)
        ctx.fillStyle = darkGrey;
        ctx.fillRect(8, -10, 6, 10);  // Back-left
        ctx.fillRect(25, -10, 6, 10); // Back-right

        // 2. TAIL (Behind the body)
        ctx.strokeStyle = darkGrey;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(35, -20);
        ctx.lineTo(40, -8);
        ctx.stroke();

        // 3. MAIN BODY
        ctx.fillStyle = bodyColor;
        ctx.fillRect(0, -28, 35, 20);
        ctx.fillRect(4, -31, 27, 3);
        ctx.fillRect(-2, -25, 2, 14);

        // 4. FRONT LEGS (With toe highlights)
        ctx.fillStyle = bodyColor;
        ctx.fillRect(2, -10, 7, 10);  // Front-left
        ctx.fillRect(20, -10, 7, 10); // Front-right
        ctx.fillStyle = lightGrey;
        ctx.fillRect(2, -2, 3, 2);
        ctx.fillRect(20, -2, 3, 2);

        // 5. THE HEAD
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-14, -32, 16, 15);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-10, -26, 2, 2);

        // 6. THE TRUNK (Detailed curve)
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-18, -25, 6, 10); // Upper
        ctx.fillRect(-22, -16, 6, 10); // Middle
        ctx.fillRect(-24, -8, 4, 4);   // Tip

        // 7. TUSK (White)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-16, -19, 4, 2);
        ctx.fillRect(-18, -17, 2, 2);

        // 8. THE EAR (Large and layered)
        ctx.fillStyle = darkGrey;
        ctx.fillRect(-5, -34, 14, 20); // Shadow/Back
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-3, -32, 12, 16); // Main flap
        ctx.fillStyle = lightGrey;
        ctx.fillRect(-3, -32, 10, 2);  // Top highlight

        ctx.restore();
    }

    drawPopcorn(ctx, x, s) {
        const bottomY = s.y;
        // Cart Body
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x, bottomY - 20, 15, 15);
        // Popcorn Top (Yellow fluff)
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(x + 4, bottomY - 20, 4, 0, Math.PI * 2);
        ctx.arc(x + 8, bottomY - 22, 4, 0, Math.PI * 2);
        ctx.arc(x + 12, bottomY - 20, 4, 0, Math.PI * 2);
        ctx.fill();
        // Wheels
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(x + 3, bottomY - 3, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 12, bottomY - 3, 3, 0, Math.PI * 2); ctx.fill();
    }

    drawStar(ctx, x, s) {
        let opacity = s.twinkle ? (0.3 + Math.abs(Math.sin(Date.now() / 500)) * 0.7) : 1;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(x, s.y, s.size, s.size);
    }

    drawPlanet(ctx, x, s) {
        const pColor = s.type === 'jupiter' ? '#eab308' : (s.type === 'saturn' ? '#fde68a' : '#cbd5e1');

        // 1. Draw the Planet Body
        ctx.fillStyle = pColor;
        ctx.beginPath();
        ctx.arc(x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        // 2. Add Specific Details
        if (s.type === 'saturn') {
            // Draw Saturn's Rings
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            // An ellipse tilted slightly for the ring effect
            ctx.ellipse(x, s.y, s.size * 2.2, s.size * 0.5, Math.PI / 6, 0, Math.PI * 2);
            ctx.stroke();
        } else if (s.type === 'jupiter') {
            // Draw Jupiter's Stripes
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(x - s.size, s.y - (s.size * 0.4), s.size * 2, 3);
            ctx.fillRect(x - s.size, s.y + (s.size * 0.2), s.size * 2, 2);
        } else if (s.type === 'moon') {
            // Draw Moon Craters
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath(); ctx.arc(x - (s.size * 0.3), s.y - (s.size * 0.2), s.size * 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + (s.size * 0.4), s.y + (s.size * 0.3), s.size * 0.15, 0, Math.PI * 2); ctx.fill();
        }
    }

    drawBlackHole(ctx, x, s) {
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6366f1'; ctx.beginPath(); ctx.arc(x, s.y, s.size + 2, 0, Math.PI * 2); ctx.stroke();
    }


}