
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { heatmapService } from '../../services/heatmap';
import type { LocationData } from '../../types';

interface HeatMapProps {
    type?: 'distribution' | 'donation';
    className?: string;
}

export function AlumniHeatMap({ type = 'distribution', className = '' }: HeatMapProps) {
    const mapRef = useRef<SVGSVGElement>(null);
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [loading, setLoading] = useState(true);

    const isDonation = type === 'donation';
    const primaryColor = isDonation ? '#10b981' : '#6366f1'; // Emerald-500 vs Indigo-500
    const secondaryColor = isDonation ? '#34d399' : '#818cf8'; // Emerald-400 vs Indigo-400
    const linkColor = isDonation ? '#10b981' : '#6366f1';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await heatmapService.getAlumniByLocation();
                setLocations(data);
            } catch (e) {
                console.error("Failed to fetch heatmap data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!mapRef.current || locations.length === 0) return;

        const width = 800;
        const height = 450;
        const svg = d3.select(mapRef.current);
        svg.selectAll("*").remove();

        // 1. Map Projection
        const projection = d3.geoMercator()
            .scale(130)
            .translate([width / 2, height / 1.4]);

        // Background (Transparent to let parent show, or dark)
        // svg.append("rect")
        //     .attr("width", width)
        //     .attr("height", height)
        //     .attr("fill", "transparent");

        // Grid lines (Subtle on dark)
        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
            svg.append("line").attr("x1", x).attr("y1", 0).attr("x2", x).attr("y2", height).attr("stroke", "#334155").attr("stroke-width", 0.5).attr("opacity", 0.3);
        }
        for (let y = 0; y < height; y += gridSize) {
            svg.append("line").attr("x1", 0).attr("y1", y).attr("x2", width).attr("y2", y).attr("stroke", "#334155").attr("stroke-width", 0.5).attr("opacity", 0.3);
        }

        const cityCoords: { [key: string]: [number, number] } = {
            'Mumbai': [72.8777, 19.0760], 'Bangalore': [77.5946, 12.9716], 'New York': [-74.0060, 40.7128],
            'London': [-0.1276, 51.5074], 'San Francisco': [-122.4194, 37.7749], 'Singapore': [103.8198, 1.3521],
            'Dubai': [55.2708, 25.2048], 'Sydney': [151.2093, -33.8688], 'Tokyo': [139.6917, 35.6895],
            'Toronto': [-79.3832, 43.6532], 'Berlin': [13.4050, 52.5200], 'Paris': [2.3522, 48.8566],
            'Delhi': [77.1025, 28.7041], 'Seattle': [-122.3321, 47.6062], 'Austin': [-97.7431, 30.2672]
        };

        const nodes = locations
            .map(loc => {
                const cityKey = Object.keys(cityCoords).find(k => k.toLowerCase() === loc.city.toLowerCase());
                const coords = cityKey ? cityCoords[cityKey] : null;

                if (coords) {
                    const [x, y] = projection(coords) || [0, 0];
                    return { ...loc, x, y };
                }
                return null;
            })
            .filter((n): n is LocationData & { x: number; y: number } => n !== null);

        // Connecting Arcs (Only for Distribution/Topology view)
        if (!isDonation && nodes.length > 1) {
            const hub = nodes[0]; // Connect to first node as hub, or use Mumbai/Bangalore as hub
            const links = nodes.slice(1).map(Target => ({ source: hub, target: Target }));

            // Draw links
            svg.selectAll(".link")
                .data(links)
                .enter().append("path")
                .attr("d", d => {
                    const dx = d.target.x - d.source.x,
                        dy = d.target.y - d.source.y,
                        dr = Math.sqrt(dx * dx + dy * dy);
                    return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
                })
                .attr("fill", "none")
                .attr("stroke", linkColor) // Indigo or Emerald
                .attr("stroke-width", 1.5)
                .attr("opacity", 0.4)
                .attr("stroke-dasharray", "4 4"); // Dotted lines for network feel
        }

        // Nodes
        const nodeGroup = svg.selectAll(".city")
            .data(nodes)
            .enter().append("g")
            .attr("transform", d => `translate(${d.x}, ${d.y})`);

        // Radius logic
        const getRadius = (d: LocationData) => {
            if (isDonation) {
                const donations = d.totalDonations || 0;
                return Math.min(Math.max(donations / 200, 5), 35);
            }
            return Math.min(d.alumniCount * 1.5, 20) + 5;
        };

        // Pulse Effect (Underlay)
        nodeGroup.append("circle")
            .attr("r", d => getRadius(d))
            .attr("fill", primaryColor)
            .attr("opacity", 0.6)
            .append("animate")
            .attr("attributeName", "r") // Animate radius too
            .attr("values", d => `${getRadius(d)};${getRadius(d) * 1.5}`)
            .attr("dur", "2s")
            .attr("repeatCount", "indefinite")
            .append("animate") // Fade out
            .attr("attributeName", "opacity")
            .attr("values", "0.6;0")
            .attr("dur", "2s")
            .attr("repeatCount", "indefinite");

        // Core Node
        nodeGroup.append("circle")
            .attr("r", d => getRadius(d) * 0.4)
            .attr("fill", isDonation ? '#10b981' : '#818cf8') // Solid center
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0.8)
            .attr("filter", "drop-shadow(0 0 8px rgba(99,102,241,0.5))"); // Glow

        // Labels
        nodeGroup.append("text")
            .text(d => d.city)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .attr("fill", "#cbd5e1") // Slate-300
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .attr("font-family", "sans-serif")
            .style("pointer-events", "none")
            .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8)"); // Shadow for readability

    }, [locations, isDonation, primaryColor, secondaryColor, linkColor]);

    if (loading) return (
        <div className={`w-full h-full aspect-video bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500 ${className}`}>
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs uppercase tracking-wider font-bold">Initializing Uplink...</span>
            </div>
        </div>
    );

    return (
        <div className={`w-full aspect-video bg-transparent rounded-2xl overflow-hidden ${className}`}>
            {/* No border on SVG container itself, let parent handle it */}
            <svg ref={mapRef} viewBox="0 0 800 450" className="w-full h-full" />
        </div>
    );
}
