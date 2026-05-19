"""FastAPI backend for industrial fire and gas simulation streaming."""

from __future__ import annotations

import asyncio
import random
from datetime import datetime, timezone
from typing import Literal, TypedDict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware


class HazardPoint(TypedDict):
    """Represents a single simulated hazard coordinate in 3D space."""

    id: str
    type: Literal["fire", "gas"]
    x: float
    y: float
    z: float
    timestamp: str


app = FastAPI(title="Industrial Safety Simulation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Returns a lightweight health status payload for startup checks."""
    return {"status": "ok"}


def _next_hazard(seed_x: float, seed_z: float) -> HazardPoint:
    """Generates a hazard near a seed coordinate to mimic localized spread."""

    hazard_type: Literal["fire", "gas"] = random.choice(["fire", "gas"])
    x = max(-18.0, min(18.0, seed_x + random.uniform(-2.5, 2.5)))
    z = max(-18.0, min(18.0, seed_z + random.uniform(-2.5, 2.5)))
    y = random.uniform(0.05, 0.45)

    return {
        "id": f"hz-{random.randint(100000, 999999)}",
        "type": hazard_type,
        "x": round(x, 2),
        "y": round(y, 2),
        "z": round(z, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.websocket("/ws/simulation")
async def simulation_stream(websocket: WebSocket) -> None:
    """Streams hazard coordinates every second until the client disconnects."""

    await websocket.accept()
    seed_x = random.uniform(-10.0, 10.0)
    seed_z = random.uniform(-10.0, 10.0)

    try:
        while True:
            seed_x += random.uniform(-1.4, 1.4)
            seed_z += random.uniform(-1.4, 1.4)
            hazard = _next_hazard(seed_x, seed_z)
            await websocket.send_json({"kind": "hazard", "data": hazard})
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return

