#!/bin/bash
set -e

CLIENT_PORT=3000
SERVER_PORT=3001
ROOT="$(cd "$(dirname "$0")" && pwd)"

t() { node "$ROOT/cli.js" "$@"; }

T_BANNER=$(t root.devBanner)
T_SERVER=$(t root.devServerBuild)
T_CLIENT=$(t root.devClientBuild)
T_RMCF=$(t root.devRemoveCloudflare)
T_START=$(t root.devStartServers)
T_FRONT=$(t root.devFrontend)
T_BACK=$(t root.devBackend)
T_WAIT=$(t root.devWaiting)
T_READY=$(t root.devReady)
T_TIMEOUT=$(t root.devTimeout)
T_INUSE=$(t root.devInUse)
T_STOP=$(t root.devStopCtrlC)
T_OPEN=$(t root.devOpenManual)

echo "============================================================"
echo "  $T_BANNER"
echo "============================================================"
echo ""

echo "[1/3] $T_SERVER"
cd "$ROOT/server"
node index.js
echo ""

echo "[2/3] $T_CLIENT"
export MANIFEST_URL="http://localhost:$SERVER_PORT/manifest.json"
cd "$ROOT/client"
node build.js
echo ""

echo "[3/3] $T_RMCF"
cd "$ROOT"
rm -f client/dist/_redirects client/dist/_headers
echo ""

echo "============================================================"
echo "  $T_START"
echo "  $T_FRONT: http://localhost:$CLIENT_PORT"
echo "  $T_BACK:  http://localhost:$SERVER_PORT"
echo "============================================================"
echo ""

npx --yes serve "$ROOT/server/output" -p $SERVER_PORT --no-clipboard --cors &
BACKEND_PID=$!
npx --yes serve "$ROOT/client/dist" -p $CLIENT_PORT --no-clipboard &
FRONTEND_PID=$!

echo "$T_WAIT"
for i in $(seq 1 30); do
  sleep 1
  if curl -s -o /dev/null http://localhost:$CLIENT_PORT 2>/dev/null && \
     curl -s -o /dev/null http://localhost:$SERVER_PORT 2>/dev/null; then
    echo "$T_READY"
    open http://localhost:$CLIENT_PORT 2>/dev/null || \
      xdg-open http://localhost:$CLIENT_PORT 2>/dev/null || \
      echo "$T_OPEN http://localhost:$CLIENT_PORT"
    echo ""
    echo "$T_STOP"
    wait
    exit 0
  fi
done

echo "$T_TIMEOUT $CLIENT_PORT $SERVER_PORT $T_INUSE"
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
exit 1