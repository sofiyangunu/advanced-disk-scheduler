// import React, { useEffect, useRef, useState } from 'react'
// import { Chart } from 'chart.js'
// import { 
//   simulateFCFS, simulateSSTF, simulateSCAN, simulateCSCAN, simulateLOOK, simulateCLOOK 
// } from '../simEngine' //

// export default function ComparisonModal({ requests, config, onClose }) {
//   const canvasRef = useRef(null)
//   const chartRef = useRef(null)
  
//   // State to track the "Race"
//   const [isFinished, setIsFinished] = useState(false)
//   const [winner, setWinner] = useState(null)
//   const [leaderboard, setLeaderboard] = useState([])

//   useEffect(() => {
//     const algos = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK']
    
//     // 1. PRE-CALCULATION PHASE
//     // We calculate the FULL path for everyone before the animation starts
//     const raceData = algos.map(name => {
//       let trace = []
//       const { diskMax, headStart, direction } = config
      
//       switch(name) {
//         case 'FCFS': trace = simulateFCFS(requests, headStart); break;
//         case 'SSTF': trace = simulateSSTF(requests, headStart); break;
//         case 'SCAN': trace = simulateSCAN(requests, headStart, diskMax, direction, true); break;
//         case 'C-SCAN': trace = simulateCSCAN(requests, headStart, diskMax, direction, false); break;
//         case 'LOOK': trace = simulateLOOK(requests, headStart, direction); break;
//         case 'C-LOOK': trace = simulateCLOOK(requests, headStart, direction); break;
//         default: trace = []
//       }

//       // Create a "Cumulative Distance" array
//       // e.g. [0, 10, 25, 30, ...]
//       let total = 0
//       const cumulative = trace.map(t => {
//         total += t.distance
//         return total
//       })

//       return { 
//         name, 
//         cumulative, 
//         finalTotal: total,
//         totalSteps: trace.length 
//       }
//     })

//     // Determine the max number of steps in the longest simulation
//     const maxSteps = Math.max(...raceData.map(d => d.totalSteps))

//     // 2. CHART SETUP
//     const ctx = canvasRef.current.getContext('2d')
//     chartRef.current = new Chart(ctx, {
//       type: 'bar',
//       data: {
//         labels: raceData.map(r => r.name),
//         datasets: [{
//           label: 'Seek Distance (Growing...)',
//           data: raceData.map(() => 0), // Start at 0
//           backgroundColor: '#60a5fa',
//           borderRadius: 4
//         }]
//       },
//       options: {
//         indexAxis: 'y', // Horizontal bars look more like a "Race"
//         responsive: true,
//         maintainAspectRatio: false,
//         animation: false, // CRITICAL: We handle animation manually for performance
//         scales: {
//           x: { 
//             beginAtZero: true, 
//             grid: { color: '#334155' },
//             ticks: { color: '#94a3b8' },
//             title: { display: true, text: 'Total Head Movement (Lower is Better)', color: '#64748b' }
//           },
//           y: { 
//             grid: { display: false },
//             ticks: { color: '#f8fafc', font: { weight: 'bold' } }
//           }
//         },
//         plugins: {
//           legend: { display: false },
//           tooltip: { enabled: false } // Disable tooltips during race
//         }
//       }
//     })

//     // 3. ANIMATION LOOP (The "Race")
//     let frame = 0
//     let raceStep = 0
//     let animationId

//     const animate = () => {
//       // Speed control: update every frame
//       raceStep++ 
      
//       // Update data for this frame
//       const currentValues = raceData.map(algo => {
//         // If the algorithm finished, return its final total
//         if (raceStep >= algo.totalSteps) return algo.finalTotal
//         // Otherwise return the distance at the current step
//         return algo.cumulative[raceStep]
//       })

//       // Update Chart
//       if (chartRef.current) {
//         chartRef.current.data.datasets[0].data = currentValues
        
//         // Color coding: If an algo has finished, turn it Dark Blue. 
//         // If it's the current leader (lowest distance), turn it Green.
//         const finishedAlgos = raceData.filter(a => raceStep >= a.totalSteps)
//         const isRaceOver = finishedAlgos.length === raceData.length

//         // Visualization Logic for Colors
//         const colors = raceData.map((algo, index) => {
//           if (raceStep >= algo.totalSteps) {
//              // If finished, is it the winner?
//              const minTotal = Math.min(...raceData.map(r => r.finalTotal))
//              return algo.finalTotal === minTotal ? '#34d399' : '#475569' // Green if win, Grey if lose
//           }
//           return '#60a5fa' // Blue while running
//         })

//         chartRef.current.data.datasets[0].backgroundColor = colors
//         chartRef.current.update()

//         if (isRaceOver) {
//           // RACE FINISHED
//           setIsFinished(true)
          
//           // Calculate Leaderboard
//           const sorted = [...raceData].sort((a,b) => a.finalTotal - b.finalTotal)
//           setWinner(sorted[0])
//           setLeaderboard(sorted)
//         } else {
//           animationId = requestAnimationFrame(animate)
//         }
//       }
//     }

//     animationId = requestAnimationFrame(animate)

//     return () => {
//       cancelAnimationFrame(animationId)
//       chartRef.current?.destroy()
//     }
//   }, [requests, config])

//   return (
//     <div style={{
//       position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
//       background: 'rgba(15, 23, 42, 0.95)', 
//       backdropFilter: 'blur(5px)',
//       display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
//     }}>
//       <div className="card" style={{ 
//         width: '900px', height: '600px', 
//         display: 'flex', flexDirection: 'column',
//         boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
//         border: '1px solid var(--primary)',
//         background: '#0f172a'
//       }}>
        
//         {/* Header */}
//         <div style={{ display:'flex', justifyContent:'space-between', padding:'20px', borderBottom:'1px solid #334155' }}>
//           <div>
//             <h2 style={{margin:0, color:'#f8fafc'}}>
//               {isFinished ? '🏁 Race Finished!' : '🏎️ Algorithm Race in Progress...'}
//             </h2>
//             <p style={{margin:'5px 0 0 0', color:'#94a3b8', fontSize:'0.9rem'}}>
//               Visualizing how fast each algorithm accumulates "Seek Cost". Shorter bars = Better Efficiency.
//             </p>
//           </div>
//           <button onClick={onClose} className="btn" style={{background:'#ef4444', color:'white', height:'40px'}}>
//             Close
//           </button>
//         </div>
        
//         {/* Main Content: Chart + Leaderboard */}
//         <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', padding: '20px', overflow:'hidden' }}>
          
//           {/* Left: The Race Chart */}
//           <div style={{ position: 'relative', height: '100%' }}>
//             <canvas ref={canvasRef} />
//           </div>

//           {/* Right: The Leaderboard (Appears when finished) */}
//           <div style={{ 
//             background: '#1e293b', borderRadius: '8px', padding: '15px', 
//             overflowY: 'auto', border: '1px solid #334155',
//             opacity: isFinished ? 1 : 0.5, transition: 'opacity 0.5s'
//           }}>
//             <h3 style={{marginTop:0, borderBottom:'1px solid #334155', paddingBottom:'10px'}}>
//               🏆 Results
//             </h3>
//             {leaderboard.map((algo, i) => (
//               <div key={algo.name} style={{ 
//                 display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                 padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
//                 color: i === 0 ? '#34d399' : '#cbd5e1',
//                 fontWeight: i === 0 ? 'bold' : 'normal'
//               }}>
//                 <div style={{display:'flex', gap:'10px'}}>
//                   <span>{i+1}.</span>
//                   <span>{algo.name}</span>
//                 </div>
//                 <span style={{ fontFamily: 'monospace' }}>{algo.finalTotal} cyl</span>
//               </div>
//             ))}
//             {!isFinished && <div style={{textAlign:'center', marginTop:'50px', color:'#64748b'}}>Running Simulations...</div>}
//           </div>

//         </div>
//       </div>
//     </div>
//   )
// }



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