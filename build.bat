@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "ROOT_NODE=%ROOT:\=/%"

for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.buildBanner') do set "T_BANNER=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.buildServer') do set "T_SERVER=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.buildClient') do set "T_CLIENT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.buildFailed') do set "T_FAILED=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.buildComplete') do set "T_COMPLETE=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.clientOutput') do set "T_CLIENT_OUT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.serverOutput') do set "T_SERVER_OUT=%%i"

echo ============================================================
echo   !T_BANNER!
echo ============================================================
echo.

echo [1/2] !T_SERVER!
cd /d "%~dp0server"
call node index.js
if %errorlevel% neq 0 (
    echo !T_SERVER! !T_FAILED!
    pause
    exit /b %errorlevel%
)
echo.

echo [2/2] !T_CLIENT!
cd /d "%~dp0client"
call node build.js
if %errorlevel% neq 0 (
    echo !T_CLIENT! !T_FAILED!
    pause
    exit /b %errorlevel%
)
echo.

echo ============================================================
echo   !T_COMPLETE!
echo   !T_CLIENT_OUT!: client\dist\
echo   !T_SERVER_OUT!: server\output\
echo ============================================================
pause