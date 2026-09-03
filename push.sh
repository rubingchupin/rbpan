#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
LANG_FILE="/tmp/rbpan_lang_$$.sh"

# 一次性加载所有翻译到临时文件
node -e "
const path = require('path');
const fs = require('fs');
const lang = (() => { try { return require('./git-config').cliLang || 'zh-CN'; } catch(e) { return 'zh-CN'; } })();
let strings = {};
try { strings = JSON.parse(fs.readFileSync(path.join('$ROOT', 'server', 'languages', lang + '.json'), 'utf-8')); } catch(e) {}
const root = strings.root || {};
const lines = Object.entries(root).map(([k, v]) => {
  const safe = String(v).replace(/\\\\/g, '\\\\\\\\').replace(/'/g, \"'\\\\''\").replace(/\\$/g, '\\\\$');
  return 'T_' + k.toUpperCase() + '=\'' + safe + '\'';
});
fs.writeFileSync('$LANG_FILE', lines.join('\\n') + '\\n');
"

# 加载翻译
source "$LANG_FILE"
rm -f "$LANG_FILE"

# 输出 banner
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

  if [ ! -d ".git" ]; then
    echo "$T_IGIT"
    git init
    git remote add origin "$repo_url"
  else
    git remote set-url origin "$repo_url" 2>/dev/null || git remote add origin "$repo_url"
  fi

  echo "$T_FETCH"
  git fetch origin "$branch" --depth=1 --no-tags 2>/dev/null || true

  echo "$T_AFILES"
  # 将 HTTPS URL 转换为 SSH URL
  if echo "$repo_url" | grep -q "https://"; then
    # 移除 https:// 和 .git 后缀
    clean_url=$(echo "$repo_url" | sed 's|https://||;s|\.git$||')
    # 提取主机名、用户名和仓库名
    host=$(echo "$clean_url" | cut -d'/' -f1)
    user=$(echo "$clean_url" | cut -d'/' -f2)
    repo=$(echo "$clean_url" | cut -d'/' -f3)
    if [ -n "$host" ] && [ -n "$user" ] && [ -n "$repo" ]; then
      repo_url="git@${host}:${user}/${repo}"
    fi
  fi

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
  git push -u origin "HEAD:$branch" --force --quiet

  echo "$T_POK  $T_REPO: $repo_url  $T_BRANCH: $branch"
}