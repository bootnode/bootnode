"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface DonutData {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutData[]
  width?: number
  height?: number
  innerRadius?: number
  className?: string
  showLegend?: boolean
  prefix?: string
  postfix?: string
  centerLabel?: string
  centerValue?: string
}

export function DonutChart({
  data,
  width = 300,
  height = 300,
  innerRadius = 0.5,
  className,
  showLegend = true,
  prefix = "",
  postfix = "",
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const radius = Math.min(width, height) / 2
    const innerR = radius * innerRadius

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)

    const pie = d3.pie<DonutData>()
      .sort(null)
      .value((d) => d.value)

    const arc = d3.arc<d3.PieArcDatum<DonutData>>()
      .outerRadius(radius * 0.85)
      .innerRadius(innerR)

    const hoverArc = d3.arc<d3.PieArcDatum<DonutData>>()
      .outerRadius(radius * 0.9)
      .innerRadius(innerR)

    const tooltip = d3.select(tooltipRef.current)

    // Draw slices
    const slices = g.selectAll(".slice")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "slice")

    slices.append("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d: d3.PieArcDatum<DonutData>) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("d", hoverArc(d) || "")

        tooltip
          .style("display", "block")
          .style("left", `${event.offsetX + width/2 + 15}px`)
          .style("top", `${event.offsetY + height/2}px`)
          .html(`
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" style="background: ${d.data.color}"></div>
              <span class="font-medium">${d.data.label}</span>
            </div>
            <div class="text-lg font-bold">${prefix}${d.data.value}${postfix}</div>
          `)
      })
      .on("mouseleave", function(event, d: d3.PieArcDatum<DonutData>) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("d", arc(d) || "")

        tooltip.style("display", "none")
      })

    // Initial animation
    slices.select("path")
      .transition()
      .duration(750)
      .attrTween("d", function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
        return (t) => arc(interpolate(t)) || ""
      })

    // Center text
    if (centerValue) {
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", centerLabel ? "-0.2em" : "0.35em")
        .attr("class", "text-2xl font-bold fill-foreground")
        .text(centerValue)

      if (centerLabel) {
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "1.5em")
          .attr("class", "text-sm fill-muted-foreground")
          .text(centerLabel)
      }
    }

  }, [data, width, height, innerRadius, prefix, postfix, centerLabel, centerValue])

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className={`flex flex-col lg:flex-row items-center gap-4 ${className}`}>
      <div className="relative">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="overflow-visible"
        />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none bg-popover border border-border rounded-lg shadow-lg p-3 z-50"
          style={{ display: "none", transform: "translate(-50%, -100%)" }}
        />
      </div>
      {showLegend && (
        <div className="flex flex-col gap-2">
          {data.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm">{item.label}</span>
              <span className="text-sm text-muted-foreground ml-auto">
                {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DonutChart
