@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set CLIENT_PORT=3000
set SERVER_PORT=3001
set "ROOT=%~dp0"
set "ROOT_NODE=%ROOT:\=/%"

for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.devBanner') do set "T_BANNER=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.devServerBuild') do set "T_SERVER=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.devClientBuild') do set "T_CLIENT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.devRemoveCloudflare') do set "T_RMCF=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.devStartServers') do set "T_START=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.devFrontend') do set "T_FRONT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.devBackend') do set "T_BACK=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.devWaiting') do set "T_WAIT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.devReady') do set "T_READY=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.devTimeout') do set "T_TIMEOUT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.devInUse') do set "T_INUSE=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.devStop') do set "T_STOP=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.buildFailed') do set "T_FAILED=%%i"

echo ============================================================
echo   !T_BANNER!
echo ============================================================
echo.

echo [1/3] !T_SERVER!
cd /d "%ROOT%server"
call node index.js
if %errorlevel% neq 0 (
    echo !T_SERVER! !T_FAILED!
    pause
    exit /b %errorlevel%
)
echo.

echo [2/3] !T_CLIENT!
cd /d "%ROOT%client"
set MANIFEST_URL=http://localhost:%SERVER_PORT%/manifest.json
call node build.js
if %errorlevel% neq 0 (
    echo !T_CLIENT! !T_FAILED!
    pause
    exit /b %errorlevel%
)
echo.

echo [3/3] !T_RMCF!
cd /d "%ROOT%"
if exist "client\dist\_redirects" del /q "client\dist\_redirects"
if exist "client\dist\_headers" del /q "client\dist\_headers"
echo.

echo ============================================================
echo   !T_START!
echo   !T_FRONT!: http://localhost:%CLIENT_PORT%
echo   !T_BACK!:  http://localhost:%SERVER_PORT%
echo ============================================================
echo.

start "rbpan Backend" cmd /c "npx --yes serve server\output -p %SERVER_PORT% --no-clipboard --cors"
start "rbpan Frontend" cmd /c "npx --yes serve client\dist -p %CLIENT_PORT% --no-clipboard"

echo !T_WAIT!
set /a RETRY=0
:wait_servers
timeout /t 1 /nobreak >nul
set /a RETRY+=1
powershell -Command "try {$a=Invoke-WebRequest -Uri http://localhost:%CLIENT_PORT% -UseBasicParsing -TimeoutSec 2; $b=Invoke-WebRequest -Uri http://localhost:%SERVER_PORT% -UseBasicParsing -TimeoutSec 2; exit 0} catch {exit 1}" >nul 2>&1
if %errorlevel% equ 0 goto :servers_ready
if %RETRY% lss 30 goto :wait_servers

echo !T_TIMEOUT! %CLIENT_PORT% %SERVER_PORT% !T_INUSE!
pause
exit /b 1

:servers_ready
echo !T_READY!
start http://localhost:%CLIENT_PORT%
echo.
echo !T_STOP!
pause