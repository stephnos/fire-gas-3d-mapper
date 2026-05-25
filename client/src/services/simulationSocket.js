const DEFAULT_WS_URL = 'ws://localhost:8000/ws/simulation'

/**
 * Opens a simulation WebSocket and forwards hazard events to a callback.
 * @param {(hazard: {id:string,type:'fire'|'gas',x:number,y:number,z:number,timestamp:string}) => void} onHazard
 * @returns {WebSocket}
 */
export function createSimulationSocket(onHazard) {
  const socket = new WebSocket(DEFAULT_WS_URL)

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data)
      if (payload.kind === 'hazard' && payload.data) {
        onHazard(payload.data)
      }
    } catch (error) {
      console.error('Failed to parse simulation event', error)
    }
  }

  socket.onerror = (error) => {
    console.error('Simulation socket error', error)
  }

  return socket
}
