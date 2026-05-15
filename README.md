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

## Suggested Next Iterations

- Persist detector layouts to backend storage.
- Add blind-spot heatmap overlays for uncovered regions.
- Add severity levels and dynamic spread modeling per hazard type.
- Add unit tests for analytics and WebSocket contract validation.
