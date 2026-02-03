"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

interface NodePoint {
  id: string
  name: string
  point: [number, number] // [longitude, latitude]
  count: number
  status: "running" | "stopped" | "syncing" | "error"
  chain?: string
}

interface NodeMapProps {
  data: NodePoint[]
  width?: number
  height?: number
  className?: string
}

const statusColors = {
  running: "#22c55e",  // green-500
  syncing: "#eab308",  // yellow-500
  stopped: "#6b7280",  // gray-500
  error: "#ef4444",    // red-500
}

export function NodeMap({ data, width = 800, height = 400, className }: NodeMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [geoData, setGeoData] = useState<any>(null)

  useEffect(() => {
    d3.json("/geo.json").then((data) => {
      setGeoData(data)
    }).catch(err => {
      console.error("Failed to load geo.json:", err)
    })
  }, [])

  useEffect(() => {
    if (!svgRef.current || !geoData) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const projection = d3.geoMercator()
      .translate([width * 0.49, height * 0.63])
      .scale(width / 6)

    const path = d3.geoPath().projection(projection)

    // Draw world map
    svg.append("path")
      .datum(geoData)
      .attr("d", path as any)
      .attr("fill", "hsl(var(--muted))")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 0.5)

    // Create tooltip
    const tooltip = d3.select(tooltipRef.current)

    // Draw node points
    const circles = svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => projection(d.point)?.[0] ?? 0)
      .attr("cy", (d) => projection(d.point)?.[1] ?? 0)
      .attr("r", 0)
      .attr("fill", (d) => statusColors[d.status])
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.85)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", Math.sqrt(d.count * 10 + 10) + 4)
          .attr("opacity", 1)

        tooltip
          .style("display", "block")
          .style("left", `${event.offsetX + 15}px`)
          .style("top", `${event.offsetY - 10}px`)
          .html(`
            <div class="font-medium">${d.name}</div>
            <div class="text-sm text-muted-foreground">${d.chain || "Multi-chain"}</div>
            <div class="text-sm">
              <span class="inline-block w-2 h-2 rounded-full mr-1" style="background: ${statusColors[d.status]}"></span>
              ${d.status.charAt(0).toUpperCase() + d.status.slice(1)}
            </div>
            <div class="text-sm">${d.count} node${d.count !== 1 ? "s" : ""}</div>
          `)
      })
      .on("mouseleave", function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", Math.sqrt(d.count * 10 + 10))
          .attr("opacity", 0.85)

        tooltip.style("display", "none")
      })

    // Animate circles in
    circles.transition()
      .delay((_, i) => i * 100)
      .duration(500)
      .attr("r", (d) => Math.sqrt(d.count * 10 + 10))

    // Add pulse animation for running nodes
    svg.selectAll("circle")
      .filter((d: any) => d.status === "running")
      .each(function() {
        const circle = d3.select(this)
        const originalR = parseFloat(circle.attr("r") || "0")

        function pulse() {
          circle
            .transition()
            .duration(1500)
            .attr("r", originalR + 3)
            .transition()
            .duration(1500)
            .attr("r", originalR)
            .on("end", pulse)
        }
        setTimeout(pulse, Math.random() * 2000)
      })

  }, [data, geoData, width, height])

  if (!geoData) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="animate-pulse text-muted-foreground">Loading map...</div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible"
      />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none bg-popover border border-border rounded-lg shadow-lg p-3 z-50"
        style={{ display: "none" }}
      />
    </div>
  )
}

export default NodeMap
