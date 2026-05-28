#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$ROOT/client"
SERVER_DIR="$ROOT/server"
SERVER_PORT="${SERVER_PORT:-8000}"
CLIENT_PORT="${CLIENT_PORT:-5173}"

server_pid=""
client_pid=""

cleanup() {
  echo
  echo "Stopping demo..."
  [[ -n "$client_pid" ]] && kill "$client_pid" 2>/dev/null || true
  [[ -n "$server_pid" ]] && kill "$server_pid" 2>/dev/null || true
  wait "$client_pid" "$server_pid" 2>/dev/null || true
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts=30

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$label ready: $url"
      return 0
    fi
    sleep 0.5
  done

  echo "Timed out waiting for $label at $url" >&2
  return 1
}

ensure_client_deps() {
  if [[ ! -d "$CLIENT_DIR/node_modules" ]]; then
    echo "Installing frontend dependencies..."
    (cd "$CLIENT_DIR" && npm install)
  fi
}

ensure_server_deps() {
  if [[ ! -d "$SERVER_DIR/.venv" ]]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$SERVER_DIR/.venv"
  fi

  # shellcheck disable=SC1091
  source "$SERVER_DIR/.venv/bin/activate"

  if ! python -c "import fastapi, uvicorn, websockets" >/dev/null 2>&1; then
    echo "Installing backend dependencies..."
    pip install -r "$SERVER_DIR/requirements.txt"
  fi
}

free_port() {
  local port="$1"
  local pids

  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Freeing port $port..."
    kill $pids 2>/dev/null || true
    sleep 0.5
  fi
}

start_server() {
  # shellcheck disable=SC1091
  source "$SERVER_DIR/.venv/bin/activate"
  (
    cd "$SERVER_DIR"
    exec uvicorn app.main:app --reload --host 0.0.0.0 --port "$SERVER_PORT"
  ) &
  server_pid=$!
}

start_client() {
  (
    cd "$CLIENT_DIR"
    exec npm run dev -- --host 0.0.0.0 --port "$CLIENT_PORT"
  ) &
  client_pid=$!
}

main() {
  trap cleanup EXIT INT TERM

  echo "Starting fire-gas-3d-mapper demo..."
  ensure_client_deps
  ensure_server_deps
  free_port "$SERVER_PORT"
  free_port "$CLIENT_PORT"

  start_server
  wait_for_url "http://127.0.0.1:$SERVER_PORT/health" "Backend"

  start_client
  wait_for_url "http://127.0.0.1:$CLIENT_PORT" "Frontend"

  echo
  echo "Demo running:"
  echo "  Frontend: http://localhost:$CLIENT_PORT"
  echo "  Backend:  http://localhost:$SERVER_PORT/health"
  echo
  echo "Press Ctrl+C to stop both services."

  wait "$server_pid" "$client_pid"
}

main "$@"
