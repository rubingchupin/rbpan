@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "ROOT_NODE=%ROOT:\=/%"

REM 获取 CLI 语言设置
for /f "delims=" %%i in ('node -e "try{console.log(require('./git-config').cliLang||'zh-CN');}catch(e){console.log('zh-CN');}"') do set "CLI_LANG=%%i"

REM 根据语言设置翻译
if "!CLI_LANG!"=="zh-CN" (
  set "T_BANNER=rbpan - Git 推送"
  set "T_BPROMPT=推送前是否先构建？"
  set "T_BLABEL=构建中"
  set "T_BSERVER=正在构建服务端（生成分片）..."
  set "T_BCLIENT=正在构建客户端（静态站点）..."
  set "T_BCOMPLETE=构建完成！"
  set "T_MSELECT=选择推送模式"
  set "T_MFULL=完整项目（源代码）"
  set "T_MSERVER=服务端输出（分片文件）"
  set "T_MCLIENT=客户端输出（静态站点）"
  set "T_MALL=全部三个仓库"
  set "T_MQUIT=退出"
  set "T_EOPT=请输入选项"
  set "T_INVALID=无效选项"
  set "T_FULL=完整项目推送"
  set "T_SERVER=服务端输出推送"
  set "T_CLIENT=客户端输出推送"
  set "T_REPO=仓库"
  set "T_BRANCH=分支"
  set "T_EBRANCH=请输入分支名"
  set "T_UBRANCH=使用分支"
  set "T_GITNF=未找到 Git 或 Git 不在 PATH 中"
  set "T_DIRNF=目录不存在："
  set "T_IGIT=正在初始化 Git 仓库..."
  set "T_FETCH=正在获取最新版本..."
  set "T_AFILES=正在添加文件..."
  set "T_COMMIT=正在提交..."
  set "T_NOCOMMIT=没有需要提交的内容"
  set "T_COMMITOK=提交成功"
  set "T_NOCHANGES=没有文件变更，跳过推送"
  set "T_PUSHING=正在推送..."
  set "T_PFAIL=推送失败"
  set "T_POK=推送完成"
  set "T_DONE=全部完成！"
  set "T_BFAIL=失败"
) else (
  set "T_BANNER=rbpan - Git Push"
  set "T_BPROMPT=Run build before push?"
  set "T_BLABEL=Building"
  set "T_BSERVER=Building Server (generating chunks)..."
  set "T_BCLIENT=Building Client (generating static site)..."
  set "T_BCOMPLETE=Build Complete!"
  set "T_MSELECT=Select push mode"
  set "T_MFULL=Full project (source code)"
  set "T_MSERVER=Server output (chunks)"
  set "T_MCLIENT=Client output (static site)"
  set "T_MALL=All three repos"
  set "T_MQUIT=Quit"
  set "T_EOPT=Enter option"
  set "T_INVALID=Invalid option"
  set "T_FULL=Full Project Push"
  set "T_SERVER=Server Output Push"
  set "T_CLIENT=Client Output Push"
  set "T_REPO=Repo"
  set "T_BRANCH=Branch"
  set "T_EBRANCH=Enter branch"
  set "T_UBRANCH=Using branch"
  set "T_GITNF=Git not found or not in PATH"
  set "T_DIRNF=Directory not found:"
  set "T_IGIT=Initializing Git repository..."
  set "T_FETCH=Fetching latest..."
  set "T_AFILES=Adding files..."
  set "T_COMMIT=Committing..."
  set "T_NOCOMMIT=Nothing to commit"
  set "T_COMMITOK=Commit OK"
  set "T_NOCHANGES=No file changes, skipping push"
  set "T_PUSHING=Pushing..."
  set "T_PFAIL=Push failed"
  set "T_POK=Push completed"
  set "T_DONE=All done!"
  set "T_BFAIL=FAILED"
)

REM 输出 banner
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

REM 将 HTTPS URL 转换为 SSH URL
echo !REPO_URL! | findstr /c:"https://" >nul
if not errorlevel 1 (
    set "REPO_URL_TMP=!REPO_URL:https://=!"
    set "REPO_URL_TMP=!REPO_URL_TMP:.git=!"
    for /f "tokens=1,2,3,* delims=/" %%a in ("!REPO_URL_TMP!") do (
        set "REPO_HOST=%%a"
        set "REPO_USER=%%b"
        set "REPO_NAME=%%c"
    )
    if defined REPO_HOST if defined REPO_USER if defined REPO_NAME (
        set "REPO_URL=git@!REPO_HOST!:!REPO_USER!/!REPO_NAME!"
    )
)

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

if not exist ".git" (
    echo !T_IGIT!
    git init
    git remote add origin "!REPO_URL!"
) else (
    git remote set-url origin "!REPO_URL!" 2>nul || git remote add origin "!REPO_URL!"
)

echo !T_FETCH!
git fetch origin "!BRANCH!" --depth=1 --no-tags 2>nul

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
git push -u origin "HEAD:!BRANCH!" --force --quiet
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