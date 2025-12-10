import React, { useEffect, useRef, useState } from 'react'
import { Chart } from 'chart.js'
import { 
  simulateFCFS, simulateSSTF, simulateSCAN, simulateCSCAN, simulateLOOK, simulateCLOOK 
} from '../simEngine'

export default function ComparisonModal({ requests, config, onClose }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)
  const [isFinished, setIsFinished] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    const algos = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK']
    
    // 1. Pre-calculate traces
    const raceData = algos.map(name => {
      let trace = []
      // Use standard settings for fair comparison
      const { diskMax, headStart } = config 
      switch(name) {
        case 'FCFS': trace = simulateFCFS(requests, headStart); break;
        case 'SSTF': trace = simulateSSTF(requests, headStart); break;
        case 'SCAN': trace = simulateSCAN(requests, headStart, diskMax, 'up', true); break;
        case 'C-SCAN': trace = simulateCSCAN(requests, headStart, diskMax, 'up', false); break;
        case 'LOOK': trace = simulateLOOK(requests, headStart, 'up'); break;
        case 'C-LOOK': trace = simulateCLOOK(requests, headStart, 'up'); break;
        default: trace = []
      }
      // Calculate cumulative distance per step
      let total = 0
      const cumulative = trace.map(t => { total += t.distance; return total })
      return { name, cumulative, finalTotal: total, totalSteps: trace.length }
    })

    const ctx = canvasRef.current.getContext('2d')
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: raceData.map(r => r.name),
        datasets: [{
          label: 'Total Seek Distance',
          data: raceData.map(() => 0),
          backgroundColor: '#38bdf8',
          borderRadius: 4,
          barPercentage: 0.6
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Manual animation
        scales: {
          x: { 
            beginAtZero: true, 
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8' } 
          },
          y: { 
            grid: { display: false },
            ticks: { color: '#f1f5f9', font: { weight: 'bold' } } 
          }
        },
        plugins: { legend: { display: false } }
      }
    })

    // Animation Loop
    let step = 0
    let animationId
    const maxSteps = Math.max(...raceData.map(d => d.totalSteps)) + 5 // slightly longer buffer

    const animate = () => {
      step++
      const currentValues = raceData.map(d => {
        if (step >= d.totalSteps) return d.finalTotal
        return d.cumulative[step] || d.cumulative[d.cumulative.length-1]
      })

      // Update Colors: Green for winner, Grey for finished, Blue for running
      const bgColors = raceData.map(d => {
        if (step < d.totalSteps) return '#38bdf8' // Running
        const minTotal = Math.min(...raceData.map(x => x.finalTotal))
        return d.finalTotal === minTotal ? '#34d399' : '#475569' // Win/Lose
      })

      if (chartRef.current) {
        chartRef.current.data.datasets[0].data = currentValues
        chartRef.current.data.datasets[0].backgroundColor = bgColors
        chartRef.current.update()
      }

      if (step < maxSteps) {
        animationId = requestAnimationFrame(animate)
      } else {
        setIsFinished(true)
        setLeaderboard([...raceData].sort((a,b) => a.finalTotal - b.finalTotal))
      }
    }

    animationId = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(animationId); chartRef.current?.destroy() }
  }, [requests, config])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '900px', height: '600px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-between' }}>
          <h2 style={{ margin: 0, color: '#fff' }}>🏆 Algorithm Race Mode</h2>
          <button className="btn btn-danger" onClick={onClose} style={{flex:'initial', padding:'8px 24px'}}>Close</button>
        </div>
        
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', padding: '20px' }}>
          <div style={{ position: 'relative' }}><canvas ref={canvasRef} /></div>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase' }}>Leaderboard</h3>
            {leaderboard.map((a, i) => (
              <div key={a.name} style={{ 
                display: 'flex', justifyContent: 'space-between', padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                color: i===0 ? '#34d399' : '#fff', fontWeight: i===0 ? 'bold' : 'normal'
              }}>
                <span>#{i+1} {a.name}</span>
                <span>{a.finalTotal}</span>
              </div>
            ))}
            {!isFinished && <div style={{textAlign:'center', padding:'20px', color:'#94a3b8'}}>Computing...</div>}
          </div>
        </div>
      </div>
    </div>
  )
}