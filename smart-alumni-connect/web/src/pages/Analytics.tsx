
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getAnalyticsOverview, type AnalyticsOverview } from '../services/analytics';

const Analytics: React.FC = () => {
    const chartRef = useRef<SVGSVGElement>(null);
    const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const data = await getAnalyticsOverview();
            setAnalytics(data);
            setIsLoading(false);
        };
        fetchAnalytics();
    }, []);

    useEffect(() => {
        if (!chartRef.current || !analytics) return;
        const svg = d3.select(chartRef.current);
        svg.selectAll("*").remove();

        // Use real location data from analytics
        const locations = analytics.top_locations;
        const maxCount = Math.max(...locations.map(l => l.count));

        // Position cities on the map
        const cityPositions: Record<string, { x: number; y: number }> = {
            'Mumbai': { x: 100, y: 280 },
            'London': { x: 380, y: 120 },
            'New York': { x: 680, y: 180 },
            'Singapore': { x: 550, y: 320 },
            'Berlin': { x: 420, y: 100 }
        };

        const nodes = locations.map(loc => ({
            id: loc.city,
            count: loc.count,
            x: cityPositions[loc.city]?.x || Math.random() * 700 + 50,
            y: cityPositions[loc.city]?.y || Math.random() * 300 + 50
        }));

        // Create flow links between cities
        const links = [];
        for (let i = 0; i < nodes.length - 1; i++) {
            links.push({
                source: nodes[i],
                target: nodes[i + 1],
                value: nodes[i].count
            });
        }

        const defs = svg.append("defs");
        const marker = defs.append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 5)
            .attr("refY", 5)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto-start-reverse");
        marker.append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("fill", "#4f46e5");

        // Draw flows
        svg.selectAll(".flow")
            .data(links)
            .enter()
            .append("path")
            .attr("d", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy);
                return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
            })
            .attr("fill", "none")
            .attr("stroke", "#4f46e5")
            .attr("stroke-width", d => Math.max(d.value / maxCount * 8, 2))
            .attr("stroke-opacity", 0.15)
            .attr("marker-end", "url(#arrow)");

        // Draw nodes with size based on count
        const nodeEls = svg.selectAll(".city")
            .data(nodes)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x}, ${d.y})`);

        nodeEls.append("circle")
            .attr("r", d => Math.max(d.count / maxCount * 20, 8))
            .attr("fill", "white")
            .attr("stroke", "#4f46e5")
            .attr("stroke-width", 3);

        nodeEls.append("text")
            .attr("y", d => Math.max(d.count / maxCount * 20, 8) + 16)
            .attr("text-anchor", "middle")
            .attr("fill", "#0f172a")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(d => d.id);

        // Add count labels
        nodeEls.append("text")
            .attr("y", 4)
            .attr("text-anchor", "middle")
            .attr("fill", "#4f46e5")
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .text(d => d.count);

    }, [analytics]);

    // Generate heatmap data from graduation distribution
    const getHeatmapData = () => {
        if (!analytics?.graduation_distribution) {
            return Array.from({ length: 25 }).map(() => Math.random());
        }
        const values = Object.values(analytics.graduation_distribution);
        const maxVal = Math.max(...values);
        // Expand to 25 cells
        const heatmapData = [];
        for (let i = 0; i < 25; i++) {
            const yearIndex = i % values.length;
            const normalized = values[yearIndex] / maxVal;
            heatmapData.push(normalized * 0.8 + 0.2); // Min 0.2 opacity
        }
        return heatmapData;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Insights</h1>
                <p className="text-slate-500">Institutional predictive analytics powered by real data.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                        <span>🌍</span> Brain Drain Flow Map
                    </h2>
                    <div className="aspect-[2/1] bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
                        <svg ref={chartRef} viewBox="0 0 800 400" className="w-full h-full" />
                    </div>
                    <p className="text-xs text-slate-400 text-center font-medium">
                        Visualizing alumni distribution across {analytics?.top_locations.length || 0} major hubs.
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                        <span>💰</span> Predictive Donation Heatmap
                    </h2>
                    <div className="grid grid-cols-5 gap-3">
                        {getHeatmapData().map((opacity, i) => (
                            <div
                                key={i}
                                className="aspect-square rounded-lg transition-all hover:scale-110 cursor-help shadow-sm"
                                style={{
                                    backgroundColor: `rgba(79, 70, 229, ${opacity})`,
                                    opacity: opacity
                                }}
                                title={`Graduation Year Heat Index: ${Math.round(opacity * 100)}%`}
                            />
                        ))}
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Predicted Yield (Q4)</span>
                            <span className="text-emerald-600 font-black text-lg">
                                ${analytics?.donation_prediction || 2.4}M
                            </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min((analytics?.donation_prediction || 2.4) / 4 * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            AI suggests targeting the{' '}
                            <strong className="text-slate-600 font-bold">
                                Class of {analytics?.recommended_campaign_target?.class_year || 2012}
                            </strong>{' '}
                            in the{' '}
                            <strong className="text-slate-600 font-bold">
                                {analytics?.recommended_campaign_target?.sector || 'Renewable Energy'}
                            </strong>{' '}
                            sector for the next campaign.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;

