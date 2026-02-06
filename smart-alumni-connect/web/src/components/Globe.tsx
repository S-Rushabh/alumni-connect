
import React, { useEffect, useRef } from 'react';
// Import d3 as it is used for globe projection and rendering
import * as d3 from 'd3';

const Globe: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const width = canvas.width;
        const height = canvas.height;
        const projection = d3.geoOrthographic()
            .scale(width / 2.2)
            .translate([width / 2, height / 2])
            .clipAngle(90);

        const path = d3.geoPath(projection, context);

        let world: any;
        let rotation = [0, 0];

        // Simple world data simulation
        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data: any) => {
            world = (window as any).topojson ? (window as any).topojson.feature(data, data.objects.countries) : null;
        });

        const pulses = Array.from({ length: 15 }, () => ({
            coords: [Math.random() * 360 - 180, Math.random() * 180 - 90],
            size: Math.random() * 5 + 2,
            opacity: Math.random()
        }));

        const render = () => {
            context.clearRect(0, 0, width, height);

            // Rotation
            rotation[0] += 0.25;
            projection.rotate(rotation as [number, number]);

            // Ocean - Changed to Deep Slate for a "Midnight" elite feel
            context.beginPath();
            context.arc(width / 2, height / 2, projection.scale(), 0, 2 * Math.PI);
            context.fillStyle = '#0f172a';
            context.fill();

            // Graticule - Changed to Indigo for contrast
            context.beginPath();
            path(d3.geoGraticule()());
            context.strokeStyle = 'rgba(99, 102, 241, 0.15)';
            context.stroke();

            // Pulses - Glowing Indigo/Pink
            pulses.forEach(p => {
                const [x, y] = projection(p.coords as [number, number]) || [0, 0];
                const distance = d3.geoDistance(p.coords as [number, number], [-rotation[0], -rotation[1]]);

                if (distance < Math.PI / 2) {
                    context.beginPath();
                    context.arc(x, y, p.size * (1 + Math.sin(Date.now() / 500) * 0.5), 0, 2 * Math.PI);
                    context.fillStyle = `rgba(129, 140, 248, ${p.opacity * (0.6 + Math.sin(Date.now() / 500) * 0.4)})`;
                    context.fill();

                    // Outer glow for pulses
                    context.beginPath();
                    context.arc(x, y, p.size * 2 * (1 + Math.sin(Date.now() / 500) * 0.3), 0, 2 * Math.PI);
                    context.fillStyle = `rgba(129, 140, 248, 0.1)`;
                    context.fill();
                }
            });

            requestAnimationFrame(render);
        };

        render();
    }, []);

    return <canvas ref={canvasRef} width={800} height={800} className="w-full h-full max-w-2xl mx-auto pointer-events-none" />;
};

export default Globe;
