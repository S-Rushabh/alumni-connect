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

    // Helper for city coordinates (Rough Equirectangular Projection on 800x400)
    const getCityCoordinates = (city: string): { x: number, y: number } | null => {
        const mapping: Record<string, { x: number, y: number }> = {
            // India
            'Mumbai': { x: 555, y: 160 },
            'Bangalore': { x: 565, y: 175 },
            'Bengaluru': { x: 565, y: 175 },
            'Delhi': { x: 560, y: 140 },
            'New Delhi': { x: 560, y: 140 },
            'Hyderabad': { x: 565, y: 165 },
            'Chennai': { x: 570, y: 175 },
            'Pune': { x: 558, y: 162 },
            'Kolkata': { x: 590, y: 155 },
            // USA
            'New York': { x: 235, y: 115 },
            'San Francisco': { x: 130, y: 125 },
            'Seattle': { x: 135, y: 105 },
            'Austin': { x: 180, y: 140 },
            'Boston': { x: 240, y: 110 },
            'Chicago': { x: 210, y: 115 },
            'Los Angeles': { x: 135, y: 135 },
            // Europe
            'London': { x: 395, y: 100 },
            'Berlin': { x: 420, y: 95 },
            'Paris': { x: 405, y: 105 },
            'Amsterdam': { x: 410, y: 98 },
            'Dublin': { x: 385, y: 100 },
            // Asia/Pacific
            'Singapore': { x: 620, y: 200 },
            'Dubai': { x: 500, y: 150 },
            'Tokyo': { x: 700, y: 120 },
            'Sydney': { x: 720, y: 300 },
            'Hong Kong': { x: 640, y: 160 },
            // Canada
            'Toronto': { x: 230, y: 110 },
            'Vancouver': { x: 135, y: 100 },
        };

        // Simple case-insensitive match
        const key = Object.keys(mapping).find(k => k.toLowerCase() === city.toLowerCase());
        return key ? mapping[key] : null;
    };

    useEffect(() => {
        if (!chartRef.current || !analytics) return;
        const svg = d3.select(chartRef.current);
        svg.selectAll("*").remove();

        // Background Map (Simplified outlines can be added here, for now just a box or implicit)
        svg.append("rect")
            .attr("width", 800)
            .attr("height", 400)
            .attr("fill", "#f8fafc")
            .attr("rx", 16);

        // Map simplified continents (Optional: could load geojson, but keeping it simple/no-dummy)
        // Just drawing bubbles based on data. 

        const dataNodes = analytics.top_locations
            .map(loc => {
                const coords = getCityCoordinates(loc.city);
                return coords ? { ...loc, x: coords.x, y: coords.y } : null;
            })
            .filter((n): n is { city: string; count: number; x: number; y: number } => n !== null);

        if (dataNodes.length === 0) {
            svg.append("text")
                .attr("x", 400)
                .attr("y", 200)
                .attr("text-anchor", "middle")
                .attr("fill", "#94a3b8")
                .text("No location data available yet");
            return;
        }

        const maxCount = Math.max(...dataNodes.map(n => n.count));

        // Draw nodes
        const nodeEls = svg.selectAll(".city")
            .data(dataNodes)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x}, ${d.y})`);

        // Ripple effect for top hubs
        nodeEls.append("circle")
            .attr("r", d => Math.max(d.count / maxCount * 25, 10))
            .attr("fill", "#4f46e5")
            .attr("opacity", 0.2)
            .append("animate")
            .attr("attributeName", "r")
            .attr("from", d => Math.max(d.count / maxCount * 25, 10))
            .attr("to", d => Math.max(d.count / maxCount * 25, 10) + 10)
            .attr("dur", "1.5s")
            .attr("begin", "0s")
            .attr("repeatCount", "indefinite")
            .attr("opacity", "0");

        nodeEls.append("circle")
            .attr("r", d => Math.max(d.count / maxCount * 25, 10))
            .attr("fill", "white")
            .attr("stroke", "#4f46e5")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .append("title")
            .text(d => `${d.city}: ${d.count} Alumni`);

        nodeEls.append("text")
            .attr("y", 4)
            .attr("text-anchor", "middle")
            .attr("fill", "#4f46e5")
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .text(d => d.count);

        nodeEls.append("text")
            .attr("y", d => Math.max(d.count / maxCount * 25, 10) + 14)
            .attr("text-anchor", "middle")
            .attr("fill", "#0f172a")
            .attr("font-size", "10px")
            .attr("font-weight", "600")
            .text(d => d.city);

    }, [analytics]);

    // Generate heatmap data from graduation distribution
    const getHeatmapData = () => {
        if (!analytics?.graduation_distribution || Object.keys(analytics.graduation_distribution).length === 0) {
            return [];
        }
        const values = Object.values(analytics.graduation_distribution);
        const maxVal = Math.max(...values, 1);

        // Create 25 cells (5x5 grid) representing last 25 years or relevant spread?
        // Or just map distribution buckets. 
        // Let's simpler: Map sorted years to grid.
        // Actually, just showing activity for available years is better.
        // Let's create a 5x5 grid where opacity = relative density of grad years.

        const sortedYears = Object.entries(analytics.graduation_distribution)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

        // If we have data, we fill grid. If not enough data, we repeat or leave empty.
        // Let's fill 25 slots with relevant data or 0.
        // We'll take last 25 years roughly? Or just map the existing data to slots.

        const cells = Array(25).fill(0);
        sortedYears.forEach((item, index) => {
            if (index < 25) {
                cells[index] = item[1] / maxVal;
            }
        });

        return cells;
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
                <p className="text-slate-500">Institutional predictive analytics powered by live alumni data.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                        <span>🌍</span> Alumni Distribution Map
                    </h2>
                    <div className="aspect-[2/1] bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 relative">
                        <svg ref={chartRef} viewBox="0 0 800 400" className="w-full h-full" />
                        {!analytics?.top_locations.length && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                                No location data derived from user profiles.
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 text-center font-medium">
                        Visualizing alumni density across major global hubs based on profile locations.
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                        <span>💰</span> Donation Potential Heatmap
                    </h2>

                    {analytics && Object.keys(analytics.graduation_distribution).length > 0 ? (
                        <div className="grid grid-cols-5 gap-3">
                            {getHeatmapData().map((opacity, i) => (
                                <div
                                    key={i}
                                    className="aspect-square rounded-lg transition-all hover:scale-105 cursor-help shadow-sm border border-indigo-100"
                                    style={{
                                        backgroundColor: `rgba(79, 70, 229, ${Math.max(opacity, 0.1)})`, // Min opacity 0.1 for visibility
                                        opacity: opacity > 0 ? 1 : 0.3 // Dim empty slots
                                    }}
                                    title={`Cohort Density Index`}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 text-sm">
                            Not enough graduation data to generate heatmap.
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Predicted Annual Yield</span>
                            <span className="text-emerald-600 font-black text-lg">
                                ${analytics?.donation_prediction || 0}M
                            </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min((analytics?.donation_prediction || 0) / 10 * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Based on {analytics?.total_users || 0} active profiles. AI suggests targeting the{' '}
                            <strong className="text-slate-600 font-bold">
                                Class of {analytics?.recommended_campaign_target?.class_year || '...'}
                            </strong>{' '}
                            in the{' '}
                            <strong className="text-slate-600 font-bold">
                                {analytics?.recommended_campaign_target?.sector || '...'}
                            </strong>{' '}
                            sector.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-indigo-50 p-6 rounded-2xl">
                    <p className="text-indigo-600 font-bold text-sm">Total Alumni</p>
                    <p className="text-3xl font-black text-indigo-900">{analytics?.total_users}</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl">
                    <p className="text-emerald-600 font-bold text-sm">Active Weekly</p>
                    <p className="text-3xl font-black text-emerald-900">{analytics?.active_this_week}</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl">
                    <p className="text-blue-600 font-bold text-sm">Locations</p>
                    <p className="text-3xl font-black text-blue-900">{Object.keys(analytics?.top_locations || {}).length}</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-2xl">
                    <p className="text-purple-600 font-bold text-sm">Top Sector</p>
                    <p className="text-lg font-black text-purple-900 truncate" title={analytics?.recommended_campaign_target.sector}>
                        {analytics?.recommended_campaign_target.sector || 'N/A'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
