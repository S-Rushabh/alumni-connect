
import React, { useEffect, useRef } from 'react';
import { CareerNode } from '../types';
// Import d3 as it is used for SVG path generation and scaling
import * as d3 from 'd3';

interface Props {
  path: CareerNode[];
}

const CareerPath: React.FC<Props> = ({ path }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 150;
    const margin = { left: 50, right: 50, top: 20, bottom: 20 };

    const xScale = d3.scaleLinear()
      .domain([0, path.length - 1])
      .range([margin.left, width - margin.right]);

    // Draw lines
    svg.append("path")
      .datum(path)
      .attr("fill", "none")
      .attr("stroke", "url(#line-grad-light)")
      .attr("stroke-width", 3)
      .attr("d", d3.line<CareerNode>()
        .x((_, i) => xScale(i))
        .y(height / 2)
      );

    // Definitions
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient")
      .attr("id", "line-grad-light")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", margin.left).attr("x2", width - margin.right);
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#4f46e5");
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#db2777");

    // Draw nodes
    const nodeGroups = svg.selectAll(".node")
      .data(path)
      .enter()
      .append("g")
      .attr("transform", (_, i) => `translate(${xScale(i)}, ${height / 2})`);

    nodeGroups.append("circle")
      .attr("r", 8)
      .attr("fill", "white")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2)
      .attr("class", "shadow-sm");

    nodeGroups.append("text")
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("fill", "#0f172a")
      .attr("font-size", "12px")
      .attr("font-weight", "700")
      .text(d => d.title);

    nodeGroups.append("text")
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .text(d => `${d.org} (${d.year})`);

  }, [path]);

  return <svg ref={svgRef} width="100%" height="150" viewBox="0 0 600 150" className="overflow-visible" />;
};

export default CareerPath;
