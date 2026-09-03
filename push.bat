@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "ROOT_NODE=%ROOT:\=/%"

for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.pushBanner') do set "T_BANNER=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.buildPrompt') do set "T_BPROMPT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.buildLabel') do set "T_BLABEL=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.buildServer') do set "T_BSERVER=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.buildClient') do set "T_BCLIENT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.buildComplete') do set "T_BCOMPLETE=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.modeSelect') do set "T_MSELECT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.modeFull') do set "T_MFULL=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.modeServer') do set "T_MSERVER=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.modeClient') do set "T_MCLIENT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.modeAll') do set "T_MALL=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.modeQuit') do set "T_MQUIT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.enterOption') do set "T_EOPT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.invalidOption') do set "T_INVALID=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.fullPush') do set "T_FULL=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.serverPush') do set "T_SERVER=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.clientPush') do set "T_CLIENT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.repo') do set "T_REPO=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.branch') do set "T_BRANCH=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.enterBranch') do set "T_EBRANCH=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.usingBranch') do set "T_UBRANCH=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.gitNotFound') do set "T_GITNF=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.dirNotFound') do set "T_DIRNF=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.initGit') do set "T_IGIT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.fetching') do set "T_FETCH=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.addingFiles') do set "T_AFILES=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.committing') do set "T_COMMIT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.nothingToCommit') do set "T_NOCOMMIT=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.commitOk') do set "T_COMMITOK=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.pushing') do set "T_PUSHING=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.pushFailed') do set "T_PFAIL=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.pushComplete') do set "T_POK=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.allDone') do set "T_DONE=%%i"
for /f "delims=" %%i in ('node "!ROOT_NODE!cli.js" root.buildFailed') do set "T_BFAIL=%%i"

echo ============================================================
echo   !T_BANNER!
echo ============================================================
echo.

set /p "DO_BUILD=!T_BPROMPT! [Y/n]: "
if /i "!DO_BUILD!"=="" set "DO_BUILD=Y"
if /i "!DO_BUILD!"=="Y" (
    echo.
    echo --- !T_BLABEL! ---
    echo [1/2] !T_BSERVER!
    cd /d "%ROOT%server"
    call node index.js
    if errorlevel 1 (
        echo !T_BSERVER! !T_BFAIL!
        pause
        exit /b 1
    )
    echo [2/2] !T_BCLIENT!
    cd /d "%ROOT%client"
    call node build.js
    if errorlevel 1 (
        echo !T_BCLIENT! !T_BFAIL!
        pause
        exit /b 1
    )
    echo !T_BCOMPLETE!
)

echo.
echo   !T_MSELECT!:
echo.
echo   [1] !T_MFULL!
echo   [2] !T_MSERVER!
echo   [3] !T_MCLIENT!
echo   [A] !T_MALL!
echo   [Q] !T_MQUIT!
echo.

set /p "MODE=!T_EOPT! [1/2/3/A/Q]: "

if /i "!MODE!"=="Q" exit /b 0
if /i "!MODE!"=="1" (
    call :PUSH_FULL
    goto :DONE
)
if /i "!MODE!"=="2" (
    call :PUSH_SERVER
    goto :DONE
)
if /i "!MODE!"=="3" (
    call :PUSH_CLIENT
    goto :DONE
)
if /i "!MODE!"=="A" (
    call :PUSH_FULL
    echo.
    call :PUSH_SERVER
    echo.
    call :PUSH_CLIENT
    goto :DONE
)
echo !T_INVALID!
pause
exit /b 1

:PUSH_FULL
echo.
echo ============================================================
echo   !T_FULL!
echo ============================================================
echo.

for /f "delims=" %%i in ('node -e "console.log(require('!ROOT_NODE!git-config.js').repoUrl)"') do set "REPO_URL=%%i"
for /f "delims=" %%i in ('node -e "console.log(require('!ROOT_NODE!git-config.js').repoBranch)"') do set "REPO_BRANCH=%%i"
for /f "delims=" %%i in ('node -e "console.log(require('!ROOT_NODE!git-config.js').commitMessage)"') do set "COMMIT_MSG=%%i"

echo   !T_REPO!:   !REPO_URL!
echo   !T_BRANCH!: !REPO_BRANCH!
echo.

set "USE_BRANCH="
set /p "USE_BRANCH=!T_EBRANCH! [!REPO_BRANCH!]): "
if "!USE_BRANCH!"=="" set "USE_BRANCH=!REPO_BRANCH!"
echo   !T_UBRANCH!: !USE_BRANCH!
echo.

call :GIT_PUSH "%ROOT%" "!REPO_URL!" "!USE_BRANCH!" "!COMMIT_MSG!"
exit /b 0

:PUSH_SERVER
echo.
echo ============================================================
echo   !T_SERVER!
echo ============================================================
echo.

cd /d "%ROOT%server"
for /f "delims=" %%i in ('node -e "const yaml=require('js-yaml');const fs=require('fs');const c=yaml.load(fs.readFileSync('_config.yml','utf8'));console.log(c.git.repoUrl)"') do set "REPO_URL=%%i"
for /f "delims=" %%i in ('node -e "const yaml=require('js-yaml');const fs=require('fs');const c=yaml.load(fs.readFileSync('_config.yml','utf8'));console.log(c.git.repoBranch)"') do set "REPO_BRANCH=%%i"
for /f "delims=" %%i in ('node -e "const yaml=require('js-yaml');const fs=require('fs');const c=yaml.load(fs.readFileSync('_config.yml','utf8'));console.log(c.git.commitMessage)"') do set "COMMIT_MSG=%%i"
cd /d "%ROOT%"

echo   !T_REPO!:   !REPO_URL!
echo   !T_BRANCH!: !REPO_BRANCH!
echo.

set "USE_BRANCH="
set /p "USE_BRANCH=!T_EBRANCH! [!REPO_BRANCH!]): "
if "!USE_BRANCH!"=="" set "USE_BRANCH=!REPO_BRANCH!"
echo   !T_UBRANCH!: !USE_BRANCH!
echo.

call :GIT_PUSH "%ROOT%server\output" "!REPO_URL!" "!USE_BRANCH!" "!COMMIT_MSG!"
exit /b 0

:PUSH_CLIENT
echo.
echo ============================================================
echo   !T_CLIENT!
echo ============================================================
echo.

cd /d "%ROOT%client"
for /f "delims=" %%i in ('node -e "const yaml=require('js-yaml');const fs=require('fs');const c=yaml.load(fs.readFileSync('_config.yml','utf8'));console.log(c.deploy.repoUrl)"') do set "REPO_URL=%%i"
for /f "delims=" %%i in ('node -e "const yaml=require('js-yaml');const fs=require('fs');const c=yaml.load(fs.readFileSync('_config.yml','utf8'));console.log(c.deploy.repoBranch)"') do set "REPO_BRANCH=%%i"
for /f "delims=" %%i in ('node -e "const yaml=require('js-yaml');const fs=require('fs');const c=yaml.load(fs.readFileSync('_config.yml','utf8'));console.log(c.deploy.commitMessage)"') do set "COMMIT_MSG=%%i"
cd /d "%ROOT%"

echo   !T_REPO!:   !REPO_URL!
echo   !T_BRANCH!: !REPO_BRANCH!
echo.

set "USE_BRANCH="
set /p "USE_BRANCH=!T_EBRANCH! [!REPO_BRANCH!]): "
if "!USE_BRANCH!"=="" set "USE_BRANCH=!REPO_BRANCH!"
echo   !T_UBRANCH!: !USE_BRANCH!
echo.

call :GIT_PUSH "%ROOT%client\dist" "!REPO_URL!" "!USE_BRANCH!" "!COMMIT_MSG!"
exit /b 0

:GIT_PUSH
set "WORK_DIR=%~1"
set "REPO_URL=%~2"
set "BRANCH=%~3"
set "MSG=%~4"

git --version >nul 2>&1
if errorlevel 1 (
    echo !T_GITNF!
    pause
    exit /b 1
)

if not exist "!WORK_DIR!" (
    echo !T_DIRNF! "!WORK_DIR!"
    pause
    exit /b 1
)

cd /d "!WORK_DIR!"

REM 重新初始化仓库，避免历史累积
if exist ".git" (
    rmdir /s /q .git
)

echo !T_IGIT!
git init
git remote add origin "!REPO_URL!"

echo !T_AFILES!
git config core.autocrlf false
git add -A

REM 检查是否有变更，无变更则跳过提交和推送
git diff --cached --quiet 2>nul
if not errorlevel 1 (
    echo !T_NOCHANGES!
    exit /b 0
)

echo !T_COMMIT!
git commit -m "!MSG!" 2>nul
if errorlevel 1 (
    echo !T_NOCOMMIT!
)

echo !T_PUSHING!
git push -u origin "HEAD:!BRANCH!" --force --no-verify --quiet 2>nul
if errorlevel 1 (
    echo !T_PFAIL!
    pause
    exit /b 1
)

echo !T_POK!  !T_REPO!: !REPO_URL!  !T_BRANCH!: !BRANCH!
exit /b 0

:DONE
echo.
echo ============================================================
echo   !T_DONE!
echo ============================================================
pause
exit /b 0