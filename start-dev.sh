#!/bin/bash
# UW Flow — Dev Startup Script
# Compiles all TypeScript and starts all services + gateway

set -e

echo "🔨 Compiling TypeScript..."
npx tsc -b packages/shared-types packages/dry-route-engine packages/wait-time-service packages/heatmap-service packages/route-planner packages/alert-service packages/api-gateway

echo ""
echo "🚀 Starting services..."
echo ""

# Start each service in the background
PORT=3001 node packages/dry-route-engine/dist/index.js &
PORT=3002 node packages/wait-time-service/dist/index.js &
PORT=3003 node packages/heatmap-service/dist/index.js &
PORT=3004 node packages/route-planner/dist/index.js &
PORT=3005 node packages/alert-service/dist/index.js &

# Give services a moment to start
sleep 2

# Start the API Gateway (foreground)
PORT=3000 node packages/api-gateway/dist/index.js &

echo ""
echo "✅ UW Flow is running!"
echo "   Open http://localhost:3000 in your browser"
echo ""
echo "   Services:"
echo "   - API Gateway:      http://localhost:3000"
echo "   - DryRoute Engine:  http://localhost:3001"
echo "   - Wait Time Service: http://localhost:3002"
echo "   - Heatmap Service:  http://localhost:3003"
echo "   - Route Planner:    http://localhost:3004"
echo "   - Alert Service:    http://localhost:3005"
echo ""
echo "Press Ctrl+C to stop all services."

# Wait for all background processes
wait
