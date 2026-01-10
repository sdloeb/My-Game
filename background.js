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
        this.skyColor = this.level === 3 ? '#000000' : (this.level === 2 ? '#1e1b4b' : '#5c94fc');

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
        while (bx < 5000) {
            const isSkyscraper = Math.random() > 0.4;
            const bWidth = isSkyscraper ? 30 + Math.random() * 20 : 20 + Math.random() * 15;
            const bHeight = isSkyscraper ? 80 + Math.random() * 60 : 20 + Math.random() * 30;
            this.scenery.push({
                type: 'building', x: bx, y: this.groundY - bHeight, w: bWidth, h: bHeight,
                color: isSkyscraper ? '#4b5563' : '#7c2d12', windows: isSkyscraper
            });
            bx += bWidth + (10 + Math.random() * 50);
        }
    }

    generateCarnivalTheme() {
        this.scenery = [];
        let cx = 100;
        // Guaranteed pool of every unique asset you created
        const pool = ['tent', 'wheel', 'stand', 'rollercoaster', 'stall', 'carousel', 'swingride', 'elephant', 'popcorn'];

        // Loop twice to ensure the level feels full
        for (let i = 0; i < 2; i++) {
            pool.forEach(type => {
                this.scenery.push({
                    type: type,
                    x: cx,
                    y: this.groundY, // Baseline exactly at grass level
                    color: Math.random() > 0.5 ? '#ef4444' : '#ffffff',
                    hasLights: true
                });
                cx += 280; // Enough space so they don't overlap
            });
        }

        for (let i = 0; i < 30; i++) {
            this.scenery.push({
                type: 'child', x: Math.random() * 5000, y: this.groundY,
                speed: 0.3 + Math.random() * 0.4, dir: Math.random() > 0.5 ? 1 : -1,
                size: 6 + Math.random() * 4
            });
        }
    }

    generateSpaceTheme() {
        for (let i = 0; i < 150; i++) {
            this.scenery.push({
                type: 'star', x: Math.random() * 5000, y: Math.random() * this.canvasHeight,
                size: Math.random() * 2, twinkle: Math.random() > 0.8
            });
        }
        const planets = ['jupiter', 'saturn', 'moon', 'blackhole'];
        let px = 200;
        while (px < 5000) {
            this.scenery.push({
                type: planets[Math.floor(Math.random() * planets.length)],
                x: px, y: 40 + Math.random() * 100, size: 20 + Math.random() * 30
            });
            px += 600 + Math.random() * 800;
        }
    }

    draw(ctx, cameraX) {
        // 1. Draw Sky
        ctx.fillStyle = this.skyColor;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // 2. Draw Clouds (Slowest parallax)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.clouds.forEach(c => {
            const drawX = (c.x - (cameraX * 0.2)) % 1000;
            // Only draw if within or near the screen bounds (256px wide)
            if (drawX > -c.w && drawX < this.canvasWidth) {
                this.drawCloud(ctx, drawX, c.y, c.w, c.h);
            }
        });

        // 3. Draw "Far" Scenery Layer (Children walk behind buildings)
        this.scenery.forEach(s => {
            if (s.type !== 'child') return; // Skip everything except children for now

            const drawX = s.x - (cameraX * 0.4); // Children move at 0.4 parallax
            if (drawX + 50 < 0 || drawX > this.canvasWidth) return;

            this.drawChild(ctx, drawX, s);
        });

        // 4. Draw "Main" Scenery Layer (Tents, Ferris Wheel, Stands)
        this.scenery.forEach(s => {
            if (s.type === 'child') return; // Skip children, we already drew them

            const parallax = (this.level === 3) ? 0.1 : 0.5;
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

            // Blinking lights for buildings and carnival stalls
            if (s.hasLights && Math.random() > 0.1) {
                this.drawLights(ctx, drawX, s);
            }
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
        ctx.fillStyle = s.color;
        ctx.fillRect(x, s.y - 5, 50, 5); // Base
        ctx.beginPath(); // Roof
        ctx.moveTo(x - 5, s.y - 35); ctx.lineTo(x + 25, s.y - 50); ctx.lineTo(x + 55, s.y - 35);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.strokeRect(x + 10, s.y - 35, 2, 30); ctx.strokeRect(x + 40, s.y - 35, 2, 30);
    }

    drawSwingRide(ctx, x, s) {
        const swing = Math.sin(Date.now() / 800) * 15;
        ctx.fillStyle = '#475569';
        ctx.fillRect(x + 20, s.y - 60, 8, 60);
        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(x + 24, s.y - 60); ctx.lineTo(x + 10 + swing, s.y - 25);
        ctx.moveTo(x + 24, s.y - 60); ctx.lineTo(x + 40 + swing, s.y - 25);
        ctx.stroke();
    }

    drawChild(ctx, x, s) {
        const bob = Math.sin(Date.now() / 150) * 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, s.y - 12 + bob, 6, 12); // Body
        ctx.beginPath(); ctx.arc(x + 3, s.y - 15 + bob, 3, 0, Math.PI * 2); ctx.fill(); // Head
    }

    drawBuilding(ctx, x, b) {
        ctx.fillStyle = b.color;
        ctx.fillRect(x, b.y, b.w, b.h);
        if (b.windows) {
            ctx.fillStyle = '#fde047';
            for (let wy = b.y + 10; wy < b.y + b.h - 10; wy += 15) {
                for (let wx = x + 5; wx < x + b.w - 5; wx += 10) {
                    ctx.fillRect(wx, wy, 3, 4);
                }
            }
        }
    }

    drawTent(ctx, x, s) {
        const bottomY = s.y;
        // Main Tent Body
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.moveTo(x, bottomY);
        ctx.lineTo(x + 30, bottomY - 50);
        ctx.lineTo(x + 60, bottomY);
        ctx.fill();

        // Add a "Flag" on top to make it look like a carnival tent
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x + 30, bottomY - 60, 8, 5);
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x + 30, bottomY - 50);
        ctx.lineTo(x + 30, bottomY - 60);
        ctx.stroke();

        // Stripes (To add 8-bit detail)
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 15, bottomY - 25, 5, 25);
        ctx.fillRect(x + 40, bottomY - 25, 5, 25);
    }

    drawFoodStand(ctx, x, s) {
        const bottomY = s.y;
        // Main Wood Frame
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(x, bottomY - 30, 50, 30);
        // The Red "Counter" Area
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + 5, bottomY - 25, 40, 15);
        // Yellow Awning (Top edge)
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x - 5, bottomY - 30, 60, 6);
        // Ground Shadow (Prevents the "hidden in dirt" look)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x, bottomY, 50, 2);
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
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, bottomY);
        // Increased the height significantly so the "arch" is high in the sky
        ctx.bezierCurveTo(x + 60, bottomY - 200, x + 120, bottomY - 200, x + 180, bottomY);
        ctx.stroke();

        // Add structural support beams so it doesn't look like a floating line
        ctx.lineWidth = 1;
        for (let i = 30; i < 160; i += 30) {
            ctx.beginPath();
            ctx.moveTo(x + i, bottomY);
            ctx.lineTo(x + i, bottomY - 40); // Beams connecting to the ground
            ctx.stroke();
        }
    }

    drawElephant(ctx, x, s) {
        const bottomY = s.y;
        ctx.fillStyle = '#64748b'; // Slate Grey
        // Body - Lifted 15px so it sits ON the grass
        ctx.beginPath();
        ctx.ellipse(x + 20, bottomY - 15, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(x + 5, bottomY - 18, 8, 0, Math.PI * 2);
        ctx.fill();
        // Trunk - Added this to make it recognizable as an elephant
        ctx.fillRect(x - 5, bottomY - 18, 4, 12);
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
        ctx.fillStyle = s.type === 'jupiter' ? '#eab308' : (s.type === 'saturn' ? '#fde68a' : '#cbd5e1');
        ctx.beginPath(); ctx.arc(x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
    }

    drawBlackHole(ctx, x, s) {
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6366f1'; ctx.beginPath(); ctx.arc(x, s.y, s.size + 2, 0, Math.PI * 2); ctx.stroke();
    }

    drawLights(ctx, x, s) {
        ctx.fillStyle = (Date.now() % 400 < 200) ? '#ffff00' : '#ff0000';
        ctx.fillRect(x + 5, s.y - 32, 2, 2);
    }
}