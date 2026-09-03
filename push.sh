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
echo "  [1] $T_FULL"
echo "  [2] $T_MSERVER"
echo "  [3] $T_MCLIENT"
echo "  [A] $T_MALL"
echo "  [Q] $T_MQUIT"
echo ""

read -r -p "$T_EOPT [1/2/3/A/Q]: " MODE

# 协议选择
echo ""
echo "  $T_PROTO_SELECT:"
echo "  [1] SSH (git@)"
echo "  [2] HTTPS (https://)"
echo ""
read -r -p "  $T_PROTO_CHOICE [1/2]: " PROTO_CHOICE
PROTO_CHOICE="${PROTO_CHOICE:-1}"
if [ "$PROTO_CHOICE" = "2" ]; then
  GIT_PROTOCOL="https"
  echo "  $T_PROTO_USE: HTTPS"
else
  GIT_PROTOCOL="ssh"
  echo "  $T_PROTO_USE: SSH"
fi
echo ""

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

  # 根据选择的协议转换 URL
  if [ "$GIT_PROTOCOL" = "https" ]; then
    # 转换为 HTTPS URL
    if echo "$repo_url" | grep -q "^git@"; then
      # git@host:user/repo -> https://host/user/repo
      clean_url=$(echo "$repo_url" | sed 's|^git@||;s|:|/|')
      repo_url="https://${clean_url}"
    fi
    # 移除末尾斜杠
    repo_url=$(echo "$repo_url" | sed 's|/$||')
    # 确保以 .git 结尾
    if ! echo "$repo_url" | grep -q "\.git$"; then
      repo_url="${repo_url}.git"
    fi
  else
    # 转换为 SSH URL
    if echo "$repo_url" | grep -q "^https://"; then
      # https://host/user/repo -> git@host:user/repo
      clean_url=$(echo "$repo_url" | sed 's|^https://||;s|\.git$||;s|/$||')
      host=$(echo "$clean_url" | cut -d'/' -f1)
      user=$(echo "$clean_url" | cut -d'/' -f2)
      repo=$(echo "$clean_url" | cut -d'/' -f3)
      if [ -n "$host" ] && [ -n "$user" ] && [ -n "$repo" ]; then
        repo_url="git@${host}:${user}/${repo}"
      fi
    fi
  fi

  # 初始化或更新 remote
  if [ ! -d ".git" ]; then
    echo "$T_IGIT"
    git init -q
    git remote add origin "$repo_url"
  else
    # 仅在 URL 变化时更新 remote
    current_url=$(git remote get-url origin 2>/dev/null || echo "")
    if [ "$current_url" != "$repo_url" ]; then
      git remote set-url origin "$repo_url" 2>/dev/null || git remote add origin "$repo_url"
    fi
  fi

  # 配置 git 优化选项
  git config core.autocrlf false
  git config gc.auto 0 2>/dev/null || true

  echo "$T_AFILES"
  git add -A

  # 检查是否有变更（使用 git status 更可靠）
  local changes
  changes=$(git status --porcelain 2>/dev/null)
  if [ -z "$changes" ]; then
    echo "$T_NOCHANGES"
    return 0
  fi

  echo "$T_COMMIT"
  git commit -m "$msg" --quiet 2>/dev/null || echo "$T_NOCOMMIT"

  echo "$T_FETCH"
  git fetch origin "$branch" --depth=1 --no-tags --quiet 2>/dev/null || true

  echo "$T_PUSHING"
  git push -u origin "HEAD:$branch" --force --quiet

  echo "$T_POK  $T_REPO: $repo_url  $T_BRANCH: $branch"
}