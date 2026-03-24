@echo off
echo === UW Flow Dev Startup ===
echo.
echo Compiling TypeScript...
call npx tsc -b
if errorlevel 1 (
    echo Compilation failed!
    pause
    exit /b 1
)

echo.
echo Starting services...
start "DryRoute" /min cmd /c "set PORT=3001 && node packages\dry-route-engine\dist\index.js"
start "WaitTime" /min cmd /c "set PORT=3002 && node packages\wait-time-service\dist\index.js"
start "Heatmap" /min cmd /c "set PORT=3003 && node packages\heatmap-service\dist\index.js"
start "RoutePlanner" /min cmd /c "set PORT=3004 && node packages\route-planner\dist\index.js"
start "AlertService" /min cmd /c "set PORT=3005 && node packages\alert-service\dist\index.js"

timeout /t 2 /nobreak >nul

echo.
echo Starting API Gateway...
start "Gateway" cmd /c "set PORT=3000 && node packages\api-gateway\dist\index.js"

echo.
echo ========================================
echo   UW Flow is running!
echo   Open http://localhost:3000 in your browser
echo ========================================
echo.
echo Services:
echo   API Gateway:       http://localhost:3000
echo   DryRoute Engine:   http://localhost:3001
echo   Wait Time Service: http://localhost:3002
echo   Heatmap Service:   http://localhost:3003
echo   Route Planner:     http://localhost:3004
echo   Alert Service:     http://localhost:3005
echo.
echo Close the terminal windows to stop services.
pause
