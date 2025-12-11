// import React, { useRef, useEffect } from 'react'

// export default function TrackView({ diskMax, headStart, trace, currentStepIndex, mode = 'rotating', requests = [] }) {
  
//   // 1. Calculate Current Head Position
//   const currentPos = (currentStepIndex >= 0 && trace[currentStepIndex]) 
//     ? trace[currentStepIndex].to 
//     : headStart

//   // 2. Identification of Served Requests
//   const servedIndices = new Set()
//   if (trace && trace.length > 0) {
//     for (let i = 0; i <= currentStepIndex; i++) {
//       if (trace[i].servedIndex !== -1) {
//         servedIndices.add(trace[i].servedIndex)
//       }
//     }
//   }

//   // --- NEW FEATURE: STARVATION COLOR LOGIC ---
//   // Returns a color based on how "old" the request is relative to the current step
//   const getRequestColor = (index, isServed) => {
//     if (isServed) return '#34d399' // Green (Done)
    
//     // If simulation hasn't started, everyone is neutral
//     if (currentStepIndex === -1) return '#60a5fa' // Blue
    
//     // Calculate "Wait Time"
//     // Since we don't have arrival times, we use step index as a proxy for time
//     const waitTime = currentStepIndex 
    
//     // Thresholds for starvation (customizable)
//     if (waitTime > 10) return '#ef4444' // RED (Starving)
//     if (waitTime > 5) return '#f59e0b' // ORANGE (Waiting Long)
//     return '#60a5fa' // BLUE (Fresh)
//   }

//   // Helpers
//   const toPct = (val) => (val / diskMax) * 100
//   const toDeg = (val) => (val / diskMax) * 360

//   return (
//     <div style={{ width: '100%', height: '240px', background: 'var(--surface)', borderRadius: '12px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
//       {/* ROTATING PLATTER */}
//       {mode === 'rotating' && (
//         <div style={{ position: 'relative', width: '220px', height: '220px' }}>
//           {/* Platter Background */}
//           <div style={{
//             position: 'absolute', inset: 0, borderRadius: '50%',
//             background: 'conic-gradient(from 0deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
//             boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)',
//             border: '4px solid #334155'
//           }}>
//             <div style={{ position: 'absolute', inset: '30px', borderRadius: '50%', border: '1px dashed #334155', opacity: 0.5 }}></div>
//             <div style={{ position: 'absolute', inset: '70px', borderRadius: '50%', border: '1px dashed #334155', opacity: 0.5 }}></div>

//             {/* Request Markers */}
//             {requests.map((r, i) => {
//               const deg = toDeg(r)
//               const isServed = servedIndices.has(i)
//               const color = getRequestColor(i, isServed)
              
//               return (
//                 <div key={i} style={{
//                   position: 'absolute', top: '50%', left: '50%',
//                   width: '100%', height: '2px',
//                   transform: `translate(-50%, -1px) rotate(${deg}deg)`,
//                   pointerEvents: 'none'
//                 }}>
//                   <div style={{
//                     position: 'absolute', right: '10px', width: '8px', height: '8px', borderRadius: '50%',
//                     background: color,
//                     boxShadow: isServed ? `0 0 6px ${color}` : 'none',
//                     transition: 'background 0.5s ease', // Smooth color transition
//                   }} />
//                 </div>
//               )
//             })}
//           </div>

//           {/* Spindle */}
//           <div style={{
//             position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
//             width: '40px', height: '40px', borderRadius: '50%',
//             background: 'radial-gradient(circle, #94a3b8 0%, #475569 100%)',
//             boxShadow: '0 4px 6px rgba(0,0,0,0.5)', zIndex: 10
//           }} />

//           {/* Actuator Arm */}
//           <div style={{
//             position: 'absolute', top: '50%', left: '50%', width: '100%', height: '4px',
//             transformOrigin: 'center',
//             transform: `translate(-50%, -2px) rotate(${toDeg(currentPos)}deg)`,
//             transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
//             zIndex: 20
//           }}>
//             <div style={{
//               position: 'absolute', right: '50%', width: '130px', height: '6px',
//               background: 'linear-gradient(90deg, #64748b, #94a3b8)', borderRadius: '4px'
//             }} />
//             <div style={{
//               position: 'absolute', right: '10px', top: '-4px', width: '12px', height: '12px',
//               background: '#3b82f6', border: '2px solid #fff', borderRadius: '50%',
//               boxShadow: '0 0 10px #3b82f6'
//             }} />
//           </div>
          
//           <div style={{ position: 'absolute', bottom: '-25px', width: '100%', textAlign: 'center', color: '#64748b', fontSize: '10px' }}>
//             <span style={{color:'#ef4444'}}>●</span> Starving &nbsp;
//             <span style={{color:'#f59e0b'}}>●</span> Waiting &nbsp;
//             <span style={{color:'#34d399'}}>●</span> Done
//           </div>
//         </div>
//       )}

//       {/* LINEAR RULER */}
//       {mode === 'linear' && (
//         <div style={{ width: '90%', height: '80px', position: 'relative', marginTop: '20px' }}>
//           <div style={{ 
//             width: '100%', height: '40px', background: '#0f172a', 
//             border: '1px solid #334155', borderRadius: '6px', position: 'relative' 
//           }}>
//             {/* Grid */}
//             {Array.from({length: 11}).map((_, i) => (
//               <div key={i} style={{ 
//                 position: 'absolute', left: `${i*10}%`, bottom: 0, height: '10px', width: '1px', background: '#334155' 
//               }}></div>
//             ))}

//             {/* Request Dots */}
//             {requests.map((r, i) => {
//               const pct = toPct(r)
//               const isServed = servedIndices.has(i)
//               const color = getRequestColor(i, isServed)
              
//               return (
//                 <div key={i} style={{
//                   position: 'absolute', left: `${pct}%`, top: '50%',
//                   width: '12px', height: '12px', borderRadius: '50%',
//                   background: color,
//                   transform: 'translate(-50%, -50%)',
//                   boxShadow: isServed ? `0 0 5px ${color}` : 'none',
//                   transition: 'all 0.5s ease',
//                   zIndex: 2,
//                   border: '1px solid rgba(0,0,0,0.5)'
//                 }} title={`Req: ${r} (${isServed ? 'Served' : 'Pending'})`} />
//               )
//             })}
//           </div>

//           {/* Sliding Head */}
//           <div style={{
//             position: 'absolute', top: '-10px', left: `${toPct(currentPos)}%`,
//             width: '2px', height: '60px', background: '#3b82f6',
//             transform: 'translateX(-50%)',
//             transition: 'left 0.4s cubic-bezier(0.25, 1, 0.5, 1)', zIndex: 10
//           }}>
//             <div style={{
//               position: 'absolute', top: 0, left: '-12px', padding: '2px 6px',
//               background: '#3b82f6', borderRadius: '4px', color: '#fff', 
//               fontSize: '10px', fontWeight: 'bold'
//             }}>{currentPos}</div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }




import React from 'react'

export default function TrackView({ diskMax, headStart, trace, currentStepIndex, mode = 'rotating', requests = [] }) {
  
  const currentPos = (currentStepIndex >= 0 && trace[currentStepIndex]) 
    ? trace[currentStepIndex].to 
    : headStart

  const servedIndices = new Set()
  if (trace && trace.length > 0) {
    for (let i = 0; i <= currentStepIndex; i++) {
      if (trace[i].servedIndex !== -1) {
        servedIndices.add(trace[i].servedIndex)
      }
    }
  }

  const getRequestColor = (index, isServed) => {
    if (isServed) return '#34d399' // Green (Done)
    if (currentStepIndex === -1) return '#38bdf8' // Neon Blue (Fresh)
    
    const waitTime = currentStepIndex 
    
    if (waitTime > 12) return '#f87171' // Red (Starving)
    if (waitTime > 6) return '#f59e0b'  // Orange (Waiting)
    return '#38bdf8' // Blue (Fresh)
  }

  const toPct = (val) => (val / diskMax) * 100
  const toDeg = (val) => (val / diskMax) * 360

  return (
    <div style={{ width: '100%', height: '260px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* --- MODE 1: HOLOGRAPHIC PLATTER --- */}
      {mode === 'rotating' && (
        <div style={{ position: 'relative', width: '240px', height: '240px' }}>
          
          {/* Platter with Neon Glow */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: `
              radial-gradient(circle at 30% 30%, rgba(255,255,255,0.03) 0%, transparent 40%),
              conic-gradient(from 0deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)
            `,
            boxShadow: `
              0 0 0 1px #334155,
              0 0 30px rgba(56, 189, 248, 0.1),
              inset 0 0 40px rgba(0,0,0,0.8)
            `,
            border: '2px solid rgba(56, 189, 248, 0.1)'
          }}>
            {/* Decorative Tracks */}
            {[30, 50, 70, 90].map(size => (
               <div key={size} style={{
                 position: 'absolute', inset: `${size}px`, borderRadius: '50%',
                 border: '1px dashed rgba(255,255,255,0.1)'
               }} />
            ))}

            {/* Request Markers */}
            {requests.map((r, i) => {
              const deg = toDeg(r)
              const isServed = servedIndices.has(i)
              const color = getRequestColor(i, isServed)
              
              return (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: '100%', height: '2px',
                  transform: `translate(-50%, -1px) rotate(${deg}deg)`,
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    position: 'absolute', right: '12px', width: '8px', height: '8px', borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 8px ${color}`,
                    transition: 'background 0.3s ease'
                  }} />
                </div>
              )
            })}
          </div>

          {/* Spindle */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'radial-gradient(circle, #475569 0%, #0f172a 100%)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2)', 
            zIndex: 10
          }} />

          {/* Actuator Arm */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', width: '100%', height: '4px',
            transformOrigin: 'center',
            transform: `translate(-50%, -2px) rotate(${toDeg(currentPos)}deg)`,
            transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
            zIndex: 20
          }}>

            
            <div style={{
              position: 'absolute', right: '50%', width: '140px', height: '8px',
              background: 'linear-gradient(90deg, #334155, #64748b)', 
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }} />
            <div style={{
              position: 'absolute', right: '12px', top: '-6px', width: '16px', height: '20px',
              background: '#38bdf8', borderRadius: '4px',
              boxShadow: '0 0 15px #38bdf8, inset 0 0 5px #fff'
            }} />
          </div>
          
          <div style={{ position: 'absolute', bottom: '-30px', width: '100%', textAlign: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight:'bold' }}>
            <span style={{color:'#f87171'}}>●</span> Starving &nbsp;
            <span style={{color:'#f59e0b'}}>●</span> Waiting &nbsp;
            <span style={{color:'#34d399'}}>●</span> Done
          </div>
        </div>
        
      )}
      {mode === 'linear' && (



        <div style={{ width: '90%', height: '100px', position: 'relative', marginTop: '20px' }}>
          <div style={{ 
            width: '100%', height: '50px', background: 'rgba(15, 23, 42, 0.6)', 
            border: '1px solid #334155', borderRadius: '8px', position: 'relative',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
          }}>
            {Array.from({length: 11}).map((_, i) => (
              <div key={i} style={{ 
                position: 'absolute', left: `${i*10}%`, bottom: 0, height: '15px', width: '1px', background: '#475569' 
              }}>
                 <span style={{position:'absolute', top:'18px', left:'-50%', fontSize:'0.65rem', color:'#64748b'}}>{Math.round(diskMax/10 * i)}</span>
              </div>
            ))}

            {/* Request Dots */}
            {requests.map((r, i) => {
              const pct = toPct(r)
              const isServed = servedIndices.has(i)
              const color = getRequestColor(i, isServed)
              return (
                <div key={i} style={{
                  position: 'absolute', left: `${pct}%`, top: '50%',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: color,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: isServed ? `0 0 8px ${color}` : `0 2px 4px rgba(0,0,0,0.5)`,
                  transition: 'all 0.5s ease',
                  border: '2px solid rgba(0,0,0,0.3)',
                  zIndex: 2
                }} />
              )
            })}
          </div>

          {/* Sliding Head */}
          <div style={{
            position: 'absolute', top: '-15px', left: `${toPct(currentPos)}%`,
            width: '2px', height: '80px', background: '#38bdf8',
            transform: 'translateX(-50%)',
            transition: 'left 0.4s cubic-bezier(0.25, 1, 0.5, 1)', zIndex: 10,
            boxShadow: '0 0 10px #38bdf8'
          }}>
            <div style={{
              position: 'absolute', top: 0, left: '-16px', width: '32px', height:'20px',
              background: '#38bdf8', borderRadius: '4px', color: '#0f172a', 
              fontSize: '0.75rem', fontWeight: 'bold', display:'flex', alignItems:'center', justifyContent:'center'
            }}>{currentPos}</div>
          </div>
        </div>
      )}

    </div>
  )
}