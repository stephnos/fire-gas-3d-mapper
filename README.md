# Industrial Safety 3D Mapping Prototype (Fire & Gas)

This project is a modular prototype for mapping fire and gas detectors in a 3D industrial environment, visualizing coverage, and simulating hazards in real time through a FastAPI WebSocket backend.

## Architecture

- `client/`: React + Vite + React Three Fiber + Tailwind dashboard and 3D visualization.
- `server/`: Python FastAPI service that streams simulated hazard coordinates.

Data flow:

1. User places detectors in the 3D scene (fire/gas).
2. Backend emits random hazard coordinates over `/ws/simulation`.
3. Frontend renders hazard particles and computes detector coverage hits.
4. Triggered detectors switch to alarm state and create alert log entries.

## Why This Structure Supports AI-Assisted Development

- Clear separation of concerns between rendering, UI orchestration, and socket transport.
- Small, purpose-focused modules:
  - `client/src/components/Scene.jsx` for all 3D scene concerns.
  - `client/src/services/simulationSocket.js` for backend transport details.
  - `server/app/main.py` for simulation behavior and API surface.
- Docstrings and JSDoc comments are included to improve AI context quality during iterative prompts.

## Prerequisites

- Node.js 20+
- Python 3.11+

## Run The Frontend

```bash
cd client
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Run The Backend

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend health endpoint: `http://localhost:8000/health`

## Testing

Install backend test dependencies first:

```bash
cd server
pip install -r requirements.txt -r requirements-dev.txt
```

Run the combined project checks from repo root:

```bash
make testing
```

This runs:
- frontend linting in `client/`
- backend pytest suite in `server/tests/`

## Prototype Controls

- Select active detector tool (`Fire` or `Gas`) in the sidebar.
- Click floor/equipment in the 3D viewport to place detector nodes.
- Toggle `Show/Hide Coverage` to view transparent detection volumes.
- Start simulation to stream hazards and observe detector alarm transitions.
- Review trigger events in the alert log.

## Key Implementation Notes

- Detector placement stores `{ id, type, x, y, z, alarm }`.
- Coverage radii are currently hardcoded:
  - Fire: `6m`
  - Gas: `8m`
- Hazard-to-detector checks use Euclidean distance in 3D and detector-type matching.
- WebSocket payload schema:
  - Envelope: `{ "kind": "hazard", "data": HazardPoint }`
  - `HazardPoint`: `{ id, type, x, y, z, timestamp }`

## Future Implementations

This prototype simplifies industrial fire-and-gas mapping. The roadmap below is informed by professional mapping workflows such as those described by [Micropack](https://www.micropacksafety.com) (HazMap3D, performance-based F&G design, and hazard detection studies).

### Mapping & coverage modelling

- **Detector field of view** — Replace spherical coverage with cone/frustum volumes aligned to detector orientation (closer to visual and IR flame detector behaviour).
- **Obstruction & line-of-sight** — Block coverage behind equipment, walls, and structures; highlight shadow zones on the floor plan.
- **Blind-spot heatmaps** — Visual overlay for uncovered regions (building on the current floor coverage and blind-spot stats).
- **Performance-based layout** — Suggest minimum detector count/placement to reach a target coverage % while reducing CAPEX/OPEX.
- **Import plant geometry** — Load CAD or simplified 3D layouts instead of placeholder boxes.

### Hazard simulation & analysis

- **Gas dispersion & consequence modelling** — Time-evolving hazard clouds rather than random point hazards ([gas dispersion analysis](https://www.micropacksafety.com)).
- **Computational fluid dynamics (CFD)** — Import or integrate CFD results for realistic leak and fire scenarios in complex layouts.
- **Toxic gas & acoustic detection** — Additional detector types, coverage rules, and alarm logic.
- **Fire hazard analysis** — Scenario definitions (ignition sources, fuel types, escalation paths) tied to detector response.

### Standards & engineering review

- **BS 60080:2020 hazard detection review** — Configurable rules and reporting aligned with UK guidance.
- **ISA TR 84.00.07** — Performance-based fire and gas detection study outputs and traceability.
- **Beacon & sounder coverage** — Extend mapping beyond detectors to audible/visual alarm reach.
- **Aspirating smoke detection (ASD)** — Pipe network and sampling-point coverage in 3D.

### Product & operations

- **Persist layouts** — Save/load detector deployments and study metadata via the backend.
- **Study reports** — Export PDF/CSV summaries (coverage %, blind spots, detector inventory, simulation results).
- **Detector catalogue** — Model real devices (e.g. range, FOV, response time, false-alarm immunity) instead of fixed radii.
- **Connection health & audit log** — WebSocket status, simulation session history, and alarm event export for post-incident review.