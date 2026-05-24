"""Test coverage for FastAPI simulation backend."""

from datetime import datetime

from fastapi.testclient import TestClient

from app.main import _next_hazard, app


def test_health_endpoint_returns_ok() -> None:
    """Health endpoint should return a stable status payload."""

    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_next_hazard_stays_within_expected_bounds() -> None:
    """Generated hazards should honor room and elevation constraints."""

    hazard = _next_hazard(seed_x=0.0, seed_z=0.0)

    assert hazard["type"] in {"fire", "gas"}
    assert -18.0 <= hazard["x"] <= 18.0
    assert 0.05 <= hazard["y"] <= 0.45
    assert -18.0 <= hazard["z"] <= 18.0
    assert hazard["id"].startswith("hz-")
    # Confirms timestamps are ISO parseable.
    datetime.fromisoformat(hazard["timestamp"])


def test_simulation_websocket_emits_hazard_payload() -> None:
    """WebSocket stream should emit hazards with expected envelope shape."""

    client = TestClient(app)
    with client.websocket_connect("/ws/simulation") as websocket:
        payload = websocket.receive_json()

    assert payload["kind"] == "hazard"
    assert "data" in payload
    hazard = payload["data"]
    assert {"id", "type", "x", "y", "z", "timestamp"} <= set(hazard.keys())
