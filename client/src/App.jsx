import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Flame, Gauge, Play, ShieldAlert, Square } from 'lucide-react'
import Scene from './components/Scene'
import { createSimulationSocket } from './services/simulationSocket'

const COVERAGE_BY_TYPE = {
  fire: 6,
  gas: 8,
}

/**
 * Main dashboard that orchestrates controls, 3D rendering, and simulation.
 * @returns {JSX.Element}
 */
function App() {
  const [activeTool, setActiveTool] = useState('fire')
  const [showCoverage, setShowCoverage] = useState(true)
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [detectors, setDetectors] = useState([])
  const [hazards, setHazards] = useState([])
  const [alertLog, setAlertLog] = useState([])
  const simulationSocketRef = useRef(null)

  const handleStartSimulation = useCallback(() => {
    setSimulationRunning(true)
  }, [])

  const handleStopSimulation = useCallback(() => {
    setSimulationRunning(false)
    setHazards([])
  }, [])

  const handleClearScenario = useCallback(() => {
    setSimulationRunning(false)
    simulationSocketRef.current?.close()
    simulationSocketRef.current = null
    setDetectors([])
    setHazards([])
    setAlertLog([])
  }, [])

  const detectorCounts = useMemo(() => {
    return detectors.reduce(
      (acc, detector) => {
        acc.total += 1
        if (detector.type === 'fire') acc.fire += 1
        if (detector.type === 'gas') acc.gas += 1
        if (detector.alarm) acc.alarmed += 1
        return acc
      },
      { total: 0, fire: 0, gas: 0, alarmed: 0 },
    )
  }, [detectors])

  /**
   * Adds a detector at a clicked scene position based on the selected tool.
   * @param {{x:number,y:number,z:number}} point
   */
  const handleSurfaceClick = useCallback(
    (point) => {
      if (!activeTool) return

      setDetectors((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          type: activeTool,
          x: point.x,
          y: point.y,
          z: point.z,
          alarm: false,
        },
      ])
    },
    [activeTool],
  )

  /**
   * Handles incoming hazard payloads and updates analytics state.
   * @param {{id:string,type:'fire'|'gas',x:number,y:number,z:number,timestamp:string}} hazard
   */
  const processHazard = useCallback((hazard) => {
    setHazards((current) => [...current.slice(-49), hazard])

    setDetectors((currentDetectors) => {
      const nextDetectors = currentDetectors.map((detector) => {
        if (detector.type !== hazard.type) {
          return detector
        }

        const radius = COVERAGE_BY_TYPE[detector.type]
        const distance = Math.hypot(
          hazard.x - detector.x,
          hazard.y - detector.y,
          hazard.z - detector.z,
        )
        const triggered = distance <= radius

        if (!triggered) {
          return detector
        }

        const alertEntry = {
          id: crypto.randomUUID(),
          detectorId: detector.id,
          detectorType: detector.type,
          hazardType: hazard.type,
          hazardId: hazard.id,
          distance: Number(distance.toFixed(2)),
          timestamp: hazard.timestamp,
        }
        setAlertLog((currentLog) => [alertEntry, ...currentLog].slice(0, 30))

        return { ...detector, alarm: true }
      })

      return nextDetectors
    })
  }, [])

  useEffect(() => {
    if (!simulationRunning) {
      simulationSocketRef.current?.close()
      simulationSocketRef.current = null
      return undefined
    }

    const socket = createSimulationSocket(processHazard)
    simulationSocketRef.current = socket

    return () => {
      socket.close()
      simulationSocketRef.current = null
    }
  }, [processHazard, simulationRunning])

  return (
    <div className="h-screen bg-[radial-gradient(ellipse_at_top,_#1e293b_0%,_#020617_55%)] text-slate-100">
      <main className="grid h-full grid-cols-[340px_1fr]">
        <aside className="border-r border-slate-700/60 bg-slate-900/85 p-5 backdrop-blur-md">
          <div className="mb-6 rounded-xl border border-cyan-500/30 bg-slate-900/80 p-4 shadow-[0_0_35px_rgba(6,182,212,0.08)]">
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Command Console</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-wide text-slate-100">
              Industrial Safety Mapper
            </h1>
            <p className="mt-1 text-sm text-slate-400">Fire & gas detector prototype</p>
            <div className="mt-3 inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
              {simulationRunning ? 'Simulation: ACTIVE' : 'Simulation: STANDBY'}
            </div>
          </div>

          <section className="mb-6 rounded-xl border border-slate-700/70 bg-slate-900/80 p-4 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Detector Selection
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTool('fire')}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  activeTool === 'fire'
                    ? 'bg-red-500/20 text-red-300 ring-1 ring-red-400/50'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Flame size={16} />
                Fire
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('gas')}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  activeTool === 'gas'
                    ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/50'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Gauge size={16} />
                Gas
              </button>
            </div>
          </section>

          <section className="mb-6 rounded-xl border border-slate-700/70 bg-slate-900/80 p-4 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Simulation Control
            </h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleStartSimulation}
                disabled={simulationRunning}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play size={16} />
                Start Simulation
              </button>
              <button
                type="button"
                onClick={handleStopSimulation}
                disabled={!simulationRunning}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-400/20 bg-rose-500/20 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Square size={16} />
                Stop Simulation
              </button>
              <button
                type="button"
                onClick={() => setShowCoverage((current) => !current)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600/50 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                <ShieldAlert size={16} />
                {showCoverage ? 'Hide Coverage' : 'Show Coverage'}
              </button>
              <button
                type="button"
                onClick={handleClearScenario}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-500/40 bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-600"
              >
                Clear Scenario
              </button>
            </div>
          </section>

          <section className="mb-6 rounded-xl border border-slate-700/70 bg-slate-900/80 p-4 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Deployment Stats
            </h2>
            <ul className="grid grid-cols-2 gap-2">
              <li className="rounded-lg border border-slate-700/70 bg-slate-800/70 p-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Total</p>
                <p className="text-base font-semibold text-slate-100">{detectorCounts.total}</p>
              </li>
              <li className="rounded-lg border border-red-500/20 bg-red-500/10 p-2">
                <p className="text-[10px] uppercase tracking-widest text-red-300/80">Fire</p>
                <p className="text-base font-semibold text-red-300">{detectorCounts.fire}</p>
              </li>
              <li className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-2">
                <p className="text-[10px] uppercase tracking-widest text-sky-300/80">Gas</p>
                <p className="text-base font-semibold text-sky-300">{detectorCounts.gas}</p>
              </li>
              <li className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
                <p className="text-[10px] uppercase tracking-widest text-amber-300/80">Alarmed</p>
                <p className="text-base font-semibold text-amber-300">{detectorCounts.alarmed}</p>
              </li>
            </ul>
            <div className="mt-2 rounded-lg border border-slate-700/70 bg-slate-800/70 px-3 py-2 text-xs text-slate-300">
              Active hazards in scene: <span className="font-semibold text-slate-100">{hazards.length}</span>
            </div>
          </section>

          <section className="rounded-xl border border-slate-700/70 bg-slate-900/80 p-4 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]">
            <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
              <AlertTriangle size={14} />
              Alert Log
            </h2>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1 text-xs">
              {alertLog.length === 0 ? (
                <p className="text-slate-500">No alerts yet. Start simulation to monitor hazards.</p>
              ) : (
                alertLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-amber-200"
                  >
                    {entry.detectorType.toUpperCase()} detector triggered by {entry.hazardType} hazard
                    <br />
                    Distance {entry.distance}m at {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>

        <section className="h-full w-full border-l border-slate-800/70">
          <Scene
            detectors={detectors}
            hazards={hazards}
            showCoverage={showCoverage}
            onSurfaceClick={handleSurfaceClick}
          />
        </section>
      </main>
    </div>
  )
}

export default App
