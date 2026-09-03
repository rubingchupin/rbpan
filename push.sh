#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

t() { node "$ROOT/cli.js" "$@"; }

T_BANNER=$(t root.pushBanner)
T_BPROMPT=$(t root.buildPrompt)
T_BLABEL=$(t root.buildLabel)
T_BSERVER=$(t root.buildServer)
T_BCLIENT=$(t root.buildClient)
T_BCOMPLETE=$(t root.buildComplete)
T_MSELECT=$(t root.modeSelect)
T_MFULL=$(t root.modeFull)
T_MSERVER=$(t root.modeServer)
T_MCLIENT=$(t root.modeClient)
T_MALL=$(t root.modeAll)
T_MQUIT=$(t root.modeQuit)
T_EOPT=$(t root.enterOption)
T_INVALID=$(t root.invalidOption)
T_FULL=$(t root.fullPush)
T_SERVER=$(t root.serverPush)
T_CLIENT=$(t root.clientPush)
T_REPO=$(t root.repo)
T_BRANCH=$(t root.branch)
T_EBRANCH=$(t root.enterBranch)
T_UBRANCH=$(t root.usingBranch)
T_GITNF=$(t root.gitNotFound)
T_DIRNF=$(t root.dirNotFound)
T_IGIT=$(t root.initGit)
T_FETCH=$(t root.fetching)
T_AFILES=$(t root.addingFiles)
T_COMMIT=$(t root.committing)
T_NOCOMMIT=$(t root.nothingToCommit)
T_COMMITOK=$(t root.commitOk)
T_NOCHANGES=$(t root.noChanges)
T_PUSHING=$(t root.pushing)
T_PFAIL=$(t root.pushFailed)
T_POK=$(t root.pushComplete)
T_DONE=$(t root.allDone)

echo "============================================================"
echo "  $T_BANNER"
echo "============================================================"
echo ""

read -r -p "$T_BPROMPT [Y/n]: " DO_BUILD
DO_BUILD="${DO_BUILD:-Y}"
if [ "$DO_BUILD" = "Y" ] || [ "$DO_BUILD" = "y" ]; then
    echo ""
    echo "--- $T_BLABEL ---"
    echo "[1/2] $T_BSERVER"
    cd "$ROOT/server"
    node index.js
    echo "[2/2] $T_BCLIENT"
    cd "$ROOT/client"
    node build.js
    echo "$T_BCOMPLETE"
fi

echo ""
echo "  $T_MSELECT:"
echo ""
echo "  [1] $T_MFULL"
echo "  [2] $T_MSERVER"
echo "  [3] $T_MCLIENT"
echo "  [A] $T_MALL"
echo "  [Q] $T_MQUIT"
echo ""

read -r -p "$T_EOPT [1/2/3/A/Q]: " MODE

case "$MODE" in
  [Qq]) exit 0 ;;
  1) push_full ;;
  2) push_server ;;
  3) push_client ;;
  [Aa])
    push_full
    echo ""
    push_server
    echo ""
    push_client
    ;;
  *) echo "$T_INVALID"; exit 1 ;;
esac

echo ""
echo "============================================================"
echo "  $T_DONE"
echo "============================================================"

push_full() {
  echo ""
  echo "============================================================"
  echo "  $T_FULL"
  echo "============================================================"
  echo ""

  local repo_url repo_branch commit_msg
  repo_url=$(node -e "console.log(require('$ROOT/git-config.js').repoUrl)")
  repo_branch=$(node -e "console.log(require('$ROOT/git-config.js').repoBranch)")
  commit_msg=$(node -e "console.log(require('$ROOT/git-config.js').commitMessage)")

  echo "  $T_REPO:   $repo_url"
  echo "  $T_BRANCH: $repo_branch"
  echo ""

  read -r -p "$T_EBRANCH [$repo_branch]): " use_branch
  use_branch="${use_branch:-$repo_branch}"
  echo "  $T_UBRANCH: $use_branch"
  echo ""

  git_push "$ROOT" "$repo_url" "$use_branch" "$commit_msg"
}

push_server() {
  echo ""
  echo "============================================================"
  echo "  $T_SERVER"
  echo "============================================================"
  echo ""

  local repo_url repo_branch commit_msg
  repo_url=$(cd "$ROOT/server" && node -e "const yaml=require('js-yaml');const fs=require('fs');console.log(yaml.load(fs.readFileSync('_config.yml','utf8')).git.repoUrl)")
  repo_branch=$(cd "$ROOT/server" && node -e "const yaml=require('js-yaml');const fs=require('fs');console.log(yaml.load(fs.readFileSync('_config.yml','utf8')).git.repoBranch)")
  commit_msg=$(cd "$ROOT/server" && node -e "const yaml=require('js-yaml');const fs=require('fs');console.log(yaml.load(fs.readFileSync('_config.yml','utf8')).git.commitMessage)")

  echo "  $T_REPO:   $repo_url"
  echo "  $T_BRANCH: $repo_branch"
  echo ""

  read -r -p "$T_EBRANCH [$repo_branch]): " use_branch
  use_branch="${use_branch:-$repo_branch}"
  echo "  $T_UBRANCH: $use_branch"
  echo ""

  git_push "$ROOT/server/output" "$repo_url" "$use_branch" "$commit_msg"
}

push_client() {
  echo ""
  echo "============================================================"
  echo "  $T_CLIENT"
  echo "============================================================"
  echo ""

  local repo_url repo_branch commit_msg
  repo_url=$(cd "$ROOT/client" && node -e "const yaml=require('js-yaml');const fs=require('fs');console.log(yaml.load(fs.readFileSync('_config.yml','utf8')).deploy.repoUrl)")
  repo_branch=$(cd "$ROOT/client" && node -e "const yaml=require('js-yaml');const fs=require('fs');console.log(yaml.load(fs.readFileSync('_config.yml','utf8')).deploy.repoBranch)")
  commit_msg=$(cd "$ROOT/client" && node -e "const yaml=require('js-yaml');const fs=require('fs');console.log(yaml.load(fs.readFileSync('_config.yml','utf8')).deploy.commitMessage)")

  echo "  $T_REPO:   $repo_url"
  echo "  $T_BRANCH: $repo_branch"
  echo ""

  read -r -p "$T_EBRANCH [$repo_branch]): " use_branch
  use_branch="${use_branch:-$repo_branch}"
  echo "  $T_UBRANCH: $use_branch"
  echo ""

  git_push "$ROOT/client/dist" "$repo_url" "$use_branch" "$commit_msg"
}

git_push() {
  local work_dir="$1"
  local repo_url="$2"
  local branch="$3"
  local msg="$4"

  if ! command -v git &> /dev/null; then
    echo "$T_GITNF"
    exit 1
  fi

  if [ ! -d "$work_dir" ]; then
    echo "$T_DIRNF \"$work_dir\""
    exit 1
  fi

  cd "$work_dir"

  # 重新初始化仓库，避免历史累积
  if [ -d ".git" ]; then
    rm -rf .git
  fi
  
  echo "$T_IGIT"
  git init
  git remote add origin "$repo_url"

  echo "$T_AFILES"
  git config core.autocrlf false
  git add -A

  # 检查是否有变更，无变更则跳过提交和推送
  if git diff --cached --quiet 2>/dev/null; then
    echo "$T_NOCHANGES"
    return 0
  fi

  echo "$T_COMMIT"
  git commit -m "$msg" 2>/dev/null || echo "$T_NOCOMMIT"

  echo "$T_PUSHING"
  # 直接推送，不 fetch 远程数据，让 git 自动计算差异
  git push -u origin "HEAD:$branch" --force --no-verify --quiet 2>&1 | grep -v "remote:" || true

  echo "$T_POK  $T_REPO: $repo_url  $T_BRANCH: $branch"
}