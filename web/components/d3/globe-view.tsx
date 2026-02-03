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

interface GlobeViewProps {
  data: NodePoint[]
  width?: number
  height?: number
  className?: string
}

const statusColors = {
  running: "#22c55e",
  syncing: "#eab308",
  stopped: "#6b7280",
  error: "#ef4444",
}

export function GlobeView({ data, width = 500, height = 500, className }: GlobeViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [geoData, setGeoData] = useState<any>(null)
  const [rotation, setRotation] = useState<[number, number]>([0, 0])

  useEffect(() => {
    d3.json("/geo.json").then((data) => {
      setGeoData(data)
    }).catch(err => {
      console.error("Failed to load geo.json:", err)
    })
  }, [])

  // Calculate center and zoom based on node distribution
  useEffect(() => {
    if (data.length === 0) return

    // Calculate centroid of all nodes
    const avgLon = data.reduce((sum, d) => sum + d.point[0], 0) / data.length
    const avgLat = data.reduce((sum, d) => sum + d.point[1], 0) / data.length

    // Set rotation to center on the average position
    setRotation([-avgLon, -avgLat])
  }, [data])

  useEffect(() => {
    if (!svgRef.current || !geoData) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const sensitivity = 75
    const size = Math.min(width, height)
    const scale = size / 2.5

    // Create orthographic projection (3D globe)
    const projection = d3.geoOrthographic()
      .scale(scale)
      .center([0, 0])
      .rotate(rotation)
      .translate([width / 2, height / 2])

    const path = d3.geoPath().projection(projection)

    // Globe outline (ocean)
    svg.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", scale)
      .attr("fill", "hsl(var(--background))")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 1)

    // Graticule (grid lines)
    const graticule = d3.geoGraticule()
    svg.append("path")
      .datum(graticule())
      .attr("d", path as any)
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 0.3)
      .attr("opacity", 0.5)

    // Countries
    svg.append("path")
      .datum(geoData)
      .attr("d", path as any)
      .attr("fill", "hsl(var(--muted))")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 0.5)

    // Create tooltip
    const tooltip = d3.select(tooltipRef.current)

    // Draw node points
    data.forEach((d) => {
      const coords = projection(d.point)
      if (!coords) return

      // Check if point is on visible side of globe
      const [x, y] = coords
      const isVisible = d3.geoDistance(d.point, [-rotation[0], -rotation[1]]) < Math.PI / 2

      if (!isVisible) return

      const nodeGroup = svg.append("g")
        .attr("transform", `translate(${x}, ${y})`)
        .style("cursor", "pointer")

      // Outer glow ring
      nodeGroup.append("circle")
        .attr("r", 0)
        .attr("fill", "none")
        .attr("stroke", statusColors[d.status])
        .attr("stroke-width", 2)
        .attr("opacity", 0.3)
        .transition()
        .duration(500)
        .attr("r", 15)

      // Main node circle
      const mainCircle = nodeGroup.append("circle")
        .attr("r", 0)
        .attr("fill", statusColors[d.status])
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("opacity", 0.9)

      mainCircle.transition()
        .duration(500)
        .attr("r", 8)

      // Pulse animation for running nodes
      if (d.status === "running") {
        function pulse() {
          mainCircle
            .transition()
            .duration(1000)
            .attr("r", 10)
            .attr("opacity", 1)
            .transition()
            .duration(1000)
            .attr("r", 8)
            .attr("opacity", 0.9)
            .on("end", pulse)
        }
        setTimeout(pulse, Math.random() * 1000)
      }

      // Tooltip interaction
      nodeGroup
        .on("mouseenter", function(event) {
          tooltip
            .style("display", "block")
            .style("left", `${event.offsetX + 15}px`)
            .style("top", `${event.offsetY - 10}px`)
            .html(`
              <div class="font-medium">${d.name}</div>
              <div class="text-sm text-muted-foreground">${d.chain || "Local"}</div>
              <div class="text-sm">
                <span class="inline-block w-2 h-2 rounded-full mr-1" style="background: ${statusColors[d.status]}"></span>
                ${d.status.charAt(0).toUpperCase() + d.status.slice(1)}
              </div>
            `)
        })
        .on("mouseleave", function() {
          tooltip.style("display", "none")
        })
    })

    // Add drag to rotate globe
    const drag = d3.drag<SVGSVGElement, unknown>()
      .on("drag", (event) => {
        const k = sensitivity / projection.scale()
        setRotation(([x, y]) => [
          x + event.dx * k,
          Math.max(-90, Math.min(90, y - event.dy * k))
        ])
      })

    svg.call(drag)

  }, [data, geoData, width, height, rotation])

  if (!geoData) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="animate-pulse text-muted-foreground">Loading globe...</div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible cursor-grab active:cursor-grabbing"
      />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none bg-popover border border-border rounded-lg shadow-lg p-3 z-50"
        style={{ display: "none" }}
      />
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
        Drag to rotate
      </div>
    </div>
  )
}

export default GlobeView
