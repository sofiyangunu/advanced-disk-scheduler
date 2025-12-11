import React, { useMemo, useState, useEffect, useRef } from 'react'
import TrackView from './components/TrackView' //
import TimelineChart from './components/TimelineChart' //
import ComparisonModal from './components/ComparisonModal' // The Dynamic Race Modal
import { parseRequests, parseCSVFile, formatTraceToCSV, downloadCSV, exportPNG } from './utils' //
import {
  simulateFCFS, simulateSSTF, simulateSCAN, simulateCSCAN, simulateLOOK, simulateCLOOK, metricsFromTrace
} from './simEngine' //
import { Howl } from 'howler'

const StatCard = ({ label, value, sub, highlight = false }) => (
  <div className="stat-item" style={{ color: highlight ? '#34d399' : 'inherit' }}>
    <div className="stat-val">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div style={{ fontSize: '10px', color: '#64748b' }}>{sub}</div>}
  </div>
)

export default function App() {
  // --- Global State ---
  const [config, setConfig] = useState({
    diskMax: 199,
    headStart: 50,
    algorithm: 'SCAN',
    direction: 'up',
    useEdge: true,
    countJump: false,
    speed: 1
  })

  // Inputs & Validation
  const [inputStr, setInputStr] = useState('95,180,34,119,11,123,62,64')
  const [error, setError] = useState(null)
  
  // Simulation State
  const [trace, setTrace] = useState([])
  const [viewMode, setViewMode] = useState('rotating') // 'linear' | 'rotating'
  const [status, setStatus] = useState({ isRunning: false, step: -1 })
  const [showCompare, setShowCompare] = useState(false)
  
  // Refs
  const appRef = useRef(null)
  
  // Sound Engine (Low volume beep)
  const ping = useMemo(() => new Howl({ 
    src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg'], 
    volume: 0.15,
    rate: 2.0 // Higher pitch for "mechanical" feel
  }), [])

  // --- 1. Logic: Parse & Validate Inputs ---
  const requests = useMemo(() => {
    if (!inputStr.trim()) {
      setError('Queue cannot be empty')
      return []
    }
    // Allow numbers, commas, and spaces
    if (/[^0-9,\s]/.test(inputStr)) {
      setError('Only numbers and commas allowed')
      return []
    }
    setError(null)
    return parseRequests(inputStr, config.diskMax)
  }, [inputStr, config.diskMax])

  // --- 2. Logic: Compute Trace ---
  useEffect(() => {
    let t = []
    const { diskMax, headStart, direction, useEdge, countJump } = config
    
    // Select Algorithm dynamically
    switch (config.algorithm) {
      case 'FCFS': t = simulateFCFS(requests, headStart); break;
      case 'SSTF': t = simulateSSTF(requests, headStart); break;
      case 'SCAN': t = simulateSCAN(requests, headStart, diskMax, direction, useEdge); break;
      case 'C-SCAN': t = simulateCSCAN(requests, headStart, diskMax, direction, countJump); break;
      case 'LOOK': t = simulateLOOK(requests, headStart, direction); break;
      case 'C-LOOK': t = simulateCLOOK(requests, headStart, direction); break;
      default: t = [];
    }
    setTrace(t)
    // Reset simulation when algorithm or data changes
    setStatus({ isRunning: false, step: -1 })
  }, [requests, config.headStart, config.algorithm, config.diskMax, config.direction, config.useEdge, config.countJump])

  // --- 3. Logic: Animation Loop ---
  useEffect(() => {
    if (!status.isRunning) return

    let rafId
    let lastTime = performance.now()
    const msPerStep = 500 / config.speed // Calculate delay based on speed

    const loop = (now) => {
      if (now - lastTime >= msPerStep) {
        setStatus(prev => {
          const nextStep = prev.step + 1
          
          // Stop if finished
          if (nextStep >= trace.length) return { ...prev, isRunning: false }
          
          // Sound effect: Only play if we are serving a request (servedIndex != -1)
          if (trace[nextStep] && trace[nextStep].servedIndex !== -1) {
            ping.play()
          }
          
          return { ...prev, step: nextStep }
        })
        lastTime = now
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [status.isRunning, config.speed, trace, ping])

  const metrics = useMemo(() => metricsFromTrace(trace), [trace])

  // --- 4. Logic: Event Log (Educational Feature) ---
  const getStepExplanation = (stepIdx) => {
    if (stepIdx < 0) return "Ready to start simulation. Press Play."
    if (!trace[stepIdx]) return "Simulation Finished."
    
    const t = trace[stepIdx]
    const algo = config.algorithm
    
    // Explanation logic based on movement type
    if (t.servedIndex === -1) {
        if (t.distance === 0) return "Head is already at position."
        return `MAINTENANCE: Reached edge/limit at ${t.to}. Reversing or resetting.`
    }
    
    if (algo === 'SSTF') return `SEEK: Moving to ${t.to} because it is the closest pending request (Dist: ${t.distance}).`
    if (algo === 'FCFS') return `SEEK: Moving to ${t.to} strictly by arrival order.`
    if (algo.includes('SCAN') || algo.includes('LOOK')) return `SEEK: Sweeping ${config.direction} to ${t.to}.`
    
    return `SEEK: Moved head from ${t.from} to ${t.to} (Dist: ${t.distance}).`
  }

  // --- Handlers ---
  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }))
  
  const handleFileImport = (e) => {
    const file = e.target.files[0]
    if (file) parseCSVFile(file, (data) => {
        const nums = data.flat().map(Number).filter(n => !isNaN(n))
        setInputStr(nums.join(','))
    })
  }

  // New Feature: Workload Presets
  const generateWorkload = (type) => {
    const max = config.diskMax
    let arr = []
    if (type === 'random') {
        arr = Array.from({length: 15}, () => Math.floor(Math.random() * max))
    } else if (type === 'cluster') {
        // Generate clustered requests (e.g. mostly around track 30-50)
        const center = Math.floor(max * 0.25)
        arr = Array.from({length: 15}, () => Math.min(max, Math.max(0, center + Math.floor((Math.random()-0.5) * 40))))
    } else if (type === 'extremes') {
        // High seek time scenario
        arr = [0, max, 10, max-10, 5, max-5, Math.floor(max/2)]
    }
    setInputStr(arr.join(','))
  }

  return (
    <div className="dashboard-layout" ref={appRef}>
      
      {/* --- COMPARISON MODAL (The Killer Feature) --- */}
      {showCompare && (
        <ComparisonModal 
          requests={requests} 
          config={config} 
          onClose={() => setShowCompare(false)} 
        />
      )}

      {/* --- HEADER --- */}
      <header className="top-bar">
        <div className="logo">
          💿 OS DiskScheduler <span style={{ fontSize: '0.8em', color: '#64748b', fontWeight: 400 }}>v3.0 Ultimate</span>
        </div>
        <div className="btn-row">
            <button className="btn btn-primary" onClick={() => setShowCompare(true)} title="Run all algorithms and find the winner">
              🏆 Compare All (Race)
            </button>
            <button className="btn" onClick={() => exportPNG(appRef.current, 'disk-sim-snapshot.png')}>
              📸 Snapshot
            </button>
            <button className="btn" onClick={() => downloadCSV('trace_log.csv', formatTraceToCSV(trace))}>
              💾 Export CSV
            </button>
        </div>
      </header>

      {/* --- SIDEBAR CONTROLS --- */}
      <aside className="sidebar">
        {/* 1. Algorithm Selection */}
        <div className="control-group">
          <label>Scheduling Algorithm</label>
          <select 
            value={config.algorithm} 
            onChange={e => updateConfig('algorithm', e.target.value)}
            style={{ fontWeight: 'bold', color: '#60a5fa' }}
          >
            <option value="FCFS">FCFS (First Come First Serve)</option>
            <option value="SSTF">SSTF (Shortest Seek Time First)</option>
            <option value="SCAN">SCAN (Elevator)</option>
            <option value="C-SCAN">C-SCAN (Circular SCAN)</option>
            <option value="LOOK">LOOK (Intelligent SCAN)</option>
            <option value="C-LOOK">C-LOOK (Intelligent Circular)</option>
          </select>
        </div>

        {/* 2. Disk Parameters */}
        <div className="control-group">
            <label>Disk Size (Cylinders)</label>
            <input type="number" min="10" max="10000" value={config.diskMax} onChange={e => updateConfig('diskMax', Number(e.target.value))} />
        </div>

        <div className="control-group">
            <label>Initial Head Position</label>
            <input type="number" min="0" max={config.diskMax} value={config.headStart} onChange={e => updateConfig('headStart', Number(e.target.value))} />
        </div>

        {/* 3. Directional Controls (Conditional) */}
        {(config.algorithm.includes('SCAN') || config.algorithm.includes('LOOK')) && (
            <div className="control-group">
                <label>Seek Direction</label>
                <select value={config.direction} onChange={e => updateConfig('direction', e.target.value)}>
                    <option value="up">Outward (Increasing)</option>
                    <option value="down">Inward (Decreasing)</option>
                </select>
                
                {config.algorithm === 'SCAN' && (
                  <label className="checkbox-label" style={{marginTop:8, fontSize:'0.8rem', display:'flex', gap:8}}>
                    <input type="checkbox" checked={config.useEdge} onChange={e => updateConfig('useEdge', e.target.checked)} />
                    Touch Edge?
                  </label>
                )}
            </div>
        )}

        {/* 4. Request Queue Input with Presets */}
        <div className="control-group">
            <label>Request Queue {error && <span style={{color:'#ef4444', marginLeft:10}}>⚠ {error}</span>}</label>
            
            <div className="btn-row" style={{marginBottom:'8px'}}>
                <button className="btn" style={{fontSize:'11px', flex:1}} onClick={() => generateWorkload('random')}>🎲 Random</button>
                <button className="btn" style={{fontSize:'11px', flex:1}} onClick={() => generateWorkload('cluster')}>CDC Cluster</button>
                <button className="btn" style={{fontSize:'11px', flex:1}} onClick={() => generateWorkload('extremes')}>↔ Extremes</button>
            </div>

            <textarea 
              rows={4} 
              value={inputStr} 
              onChange={e => setInputStr(e.target.value)}
              style={{ borderColor: error ? '#ef4444' : 'var(--border)' }} 
            />
            
            <label className="btn" style={{cursor:'pointer', display:'block', textAlign:'center', marginTop:'5px'}}>
                📂 Import CSV File
                <input type="file" hidden accept=".csv" onChange={handleFileImport} />
            </label>
        </div>

        {/* 5. Live Event Log (Educational) */}
        <div className="control-group">
            <label>Live System Log</label>
            <div style={{ 
                padding: '12px', background: '#020617', border: '1px solid #1e293b', 
                borderRadius: '6px', fontSize: '0.8rem', color: '#34d399', 
                minHeight: '60px', fontFamily: 'monospace', lineHeight: '1.4'
            }}>
                {'> ' + getStepExplanation(status.step)}
            </div>
        </div>
      </aside>

      {/* --- MAIN STAGE --- */}
      <main className="main-stage">
        
        {/* Playback Controls */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="btn-row">
                <button 
                  className={`btn ${status.isRunning ? 'btn-danger' : 'btn-primary'}`} 
                  onClick={() => setStatus({ isRunning: !status.isRunning, step: status.step === trace.length - 1 ? -1 : status.step })}
                >
                    {status.isRunning ? '⏸ Pause' : '▶ Play Simulation'}
                </button>
                <button className="btn" onClick={() => setStatus({ isRunning: false, step: -1 })}>
                  ⏹ Reset
                </button>
                <button className="btn" onClick={() => setStatus(s => ({ ...s, step: Math.min(s.step + 1, trace.length - 1) }))}>
                  ⏭ Step +
                </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{color:'var(--text-dim)', fontSize:'0.9rem'}}>Sim Speed</span>
                <input 
                  type="range" min="0.5" max="5" step="0.5" 
                  value={config.speed} 
                  onChange={e => updateConfig('speed', Number(e.target.value))} 
                />
                <span style={{fontWeight:'bold', width:'30px', textAlign:'right'}}>{config.speed}x</span>
            </div>
        </div>

        {/* Metrics Panel */}
        <div className="card">
            <div className="stats-grid">
                <StatCard label="Total Head Movement" value={metrics.totalMovement} sub="Cylinders" highlight />
                <StatCard label="Avg Seek Length" value={metrics.avgSeek.toFixed(2)} sub="Cylinders / Req" />
                <StatCard label="Efficiency Score" value={metrics.servedCount > 0 ? (1000/metrics.avgSeek).toFixed(0) : 0} sub="Points (High=Good)" />
                <StatCard label="Current Head" value={status.step >= 0 && trace[status.step] ? trace[status.step].to : config.headStart} />
            </div>
        </div>

        {/* Visualization Component */}
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Physical Disk Visualization</h3>
                <div className="btn-row" style={{ gap: 0 }}>
                    <button 
                      className={`btn ${viewMode === 'rotating' ? 'btn-primary' : ''}`} 
                      style={{ borderRadius: '6px 0 0 6px' }}
                      onClick={() => setViewMode('rotating')}
                    >
                      Rotating
                    </button>
                    <button 
                      className={`btn ${viewMode === 'linear' ? 'btn-primary' : ''}`} 
                      style={{ borderRadius: '0 6px 6px 0' }}
                      onClick={() => setViewMode('linear')}
                    >
                      Linear
                    </button>
                </div>
            </div>

            <TrackView 
                diskMax={config.diskMax} 
                headStart={config.headStart} 
                trace={trace} 
                currentStepIndex={status.step} 
                mode={viewMode} 
                requests={requests}
            />
        </div>

        {/* Analytical Chart */}
        <div className="card" style={{ flex: 1, minHeight: '320px', display:'flex', flexDirection:'column' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Seek Trajectory Analysis</h3>
            <div style={{flex:1}}>
                <TimelineChart trace={trace} currentStepIndex={status.step} />
            </div>
        </div>

      </main>
    </div>
  )
}