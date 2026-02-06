
import React, { useEffect, useRef } from 'react';
// Import d3 for SVG data visualization
import * as d3 from 'd3';

const Analytics: React.FC = () => {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 400;
    
    // Draw a basic "Brain Drain" Flow Map simulation
    const nodes = [
      { id: 'Mumbai', x: 100, y: 300 },
      { id: 'London', x: 400, y: 150 },
      { id: 'New York', x: 700, y: 200 }
    ];

    const links = [
      { source: nodes[0], target: nodes[1], value: 40 },
      { source: nodes[0], target: nodes[2], value: 25 },
      { source: nodes[1], target: nodes[2], value: 15 }
    ];

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
      .attr("stroke-width", d => d.value / 5)
      .attr("stroke-opacity", 0.15)
      .attr("marker-end", "url(#arrow)");

    // Draw nodes
    const nodeEls = svg.selectAll(".city")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x}, ${d.y})`);

    nodeEls.append("circle")
      .attr("r", 12)
      .attr("fill", "white")
      .attr("stroke", "#4f46e5")
      .attr("stroke-width", 3);

    nodeEls.append("text")
      .attr("y", 28)
      .attr("text-anchor", "middle")
      .attr("fill", "#0f172a")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text(d => d.id);

  }, []);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Insights</h1>
        <p className="text-slate-500">Institutional predictive analytics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <span>🌍</span> Brain Drain Flow Map
          </h2>
          <div className="aspect-[2/1] bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
            <svg ref={chartRef} viewBox="0 0 800 400" className="w-full h-full" />
          </div>
          <p className="text-xs text-slate-400 text-center font-medium">Visualizing global mobility of the last 10 graduating classes.</p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <span>💰</span> Predictive Donation Heatmap
          </h2>
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 25 }).map((_, i) => (
              <div 
                key={i} 
                className="aspect-square rounded-lg transition-all hover:scale-110 cursor-help shadow-sm" 
                style={{ 
                  backgroundColor: `rgba(79, 70, 229, ${Math.random()})`,
                  opacity: Math.random() * 0.8 + 0.2
                }}
              />
            ))}
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Predicted Yield (Q4)</span>
              <span className="text-emerald-600 font-black text-lg">$2.4M</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[78%] rounded-full" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI suggests targeting the <strong className="text-slate-600 font-bold">Class of 2012</strong> in the <strong className="text-slate-600 font-bold">Renewable Energy</strong> sector for the next campaign.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
