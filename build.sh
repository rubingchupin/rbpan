#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

t() { node "$ROOT/cli.js" "$@"; }

T_BANNER=$(t root.buildBanner)
T_SERVER=$(t root.buildServer)
T_CLIENT=$(t root.buildClient)
T_COMPLETE=$(t root.buildComplete)
T_CLIENT_OUT=$(t root.clientOutput)
T_SERVER_OUT=$(t root.serverOutput)

echo "============================================================"
echo "  $T_BANNER"
echo "============================================================"
echo ""

echo "[1/2] $T_SERVER"
cd "$ROOT/server"
node index.js
echo ""

echo "[2/2] $T_CLIENT"
cd "$ROOT/client"
node build.js
echo ""

echo "============================================================"
echo "  $T_COMPLETE"
echo "  $T_CLIENT_OUT: client/dist/"
echo "  $T_SERVER_OUT: server/output/"
echo "============================================================"