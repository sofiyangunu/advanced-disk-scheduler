import React, { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default function TimelineChart({ trace, currentStepIndex }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d')
    
    // Create Gradient for the line fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)') // Blue
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)') // Transparent


    const dataPoints = trace.map((t, i) => ({ x: i + 1, y: t.to }))
    if (trace.length > 0) {
      dataPoints.unshift({ x: 0, y: trace[0].from })
    }

    const traveledPoints = dataPoints.slice(0, currentStepIndex + 2) // +2 because of 0-index and start point

    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          // 1. The Full Predicted Path (Background Guide)
          {
            label: 'Predicted Path',
            data: dataPoints,
            borderColor: '#334155', // Dark Grey
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0, // Hide points for the guide
            fill: false,
            tension: 0.1
          },
          // 2. The Active Traveled Path
          {
            label: 'Head Movement',
            data: traveledPoints,
            borderColor: '#3b82f6', // Primary Blue
            backgroundColor: gradient,
            borderWidth: 3,
            pointBackgroundColor: '#06b6d4', // Cyan points
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.1 // Slight smoothing, but mostly straight for seek accuracy
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Performance: Disable chart animation (we animate via React state)
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            labels: { color: '#94a3b8', font: { size: 10 } }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => `Track: ${ctx.raw.y}`
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Time Step', color: '#64748b', font: { size: 10 } },
            grid: { color: '#1e293b' },
            ticks: { color: '#64748b', stepSize: 1 }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Cylinder #', color: '#64748b', font: { size: 10 } },
            grid: { color: '#334155' },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    })

    return () => chartRef.current?.destroy()
  }, [trace, currentStepIndex])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  )
}