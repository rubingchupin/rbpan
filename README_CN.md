# rbpan

基于 Node.js 的轻量级网盘系统，前后端为两个完全独立的项目。
支持大文件自动分片、多线程下载、SHA-256 完整性校验。
前端使用 Pug 模板 + Stylus 样式 + Vue.js，支持亚克力磨砂暗黑主题与插件扩展。

## 克隆仓库

仅 `main` 分支包含源代码，其他分支为构建产物：

```bash
git clone -b main --single-branch https://github.com/rubingchupin/rbpan.git
```

| 分支 | 内容 |
|------|------|
| `main` | 源代码（本仓库） |
| `server` | 服务端输出 — 分片文件 + manifest.json |
| `client` | 客户端输出 — 静态站点 (dist/) |

清单文件地址：`https://pan-data.rubing.us.kg/manifest.json`

## 项目结构

```
rbpan/
├── README.md / README_CN.md
├── .gitignore
├── cli.js                      # CLI 国际化辅助
├── languages/                  # 根 CLI 语言包
│   ├── en.json
│   └── zh-CN.json
├── build.bat / build.sh        # 构建两个项目
├── dev.bat / dev.sh            # 本地开发服务器
├── push.bat / push.sh          # Git 推送（优化：浅层获取 + 跳过无变更）
│
├── server/                     # 独立服务端项目
│   ├── README.md / README_CN.md
│   ├── package.json
│   ├── _config.yml             # 服务端配置（YAML 格式）
│   ├── index.js                # 入口
│   ├── input/                  # 放置要分享的文件
│   ├── output/                 # 生成的分片 + manifest.json
│   ├── languages/              # 服务端 CLI 语言包（JSON）
│   ├── lib/
│   │   └── i18n.js             # 服务端 i18n 辅助
│   └── src/
│       ├── scanner.js          # 目录扫描
│       ├── splitter.js         # 分片 + SHA-256
│       └── generator.js        # 输出生成
│
└── client/                     # 独立客户端项目
    ├── README.md / README_CN.md
    ├── package.json
    ├── _config.yml             # 站点配置（YAML 格式）
    ├── build.js                # 构建脚本
    ├── dist/                   # 构建输出（可部署）
    ├── languages/              # 客户端 CLI 语言包（JSON）
    ├── lib/
    │   └── i18n.js             # 客户端 i18n 辅助
    └── themes/
        └── default/            # 默认主题
            ├── _config.js      # 主题配置
            ├── layout/         # Pug 模板
            ├── source/         # 主题资源（CSS、JS、字体、图片）
            └── languages/      # UI 多语言（JSON）
```

## 快速开始

### 根目录脚本

在项目根目录运行：

| 脚本 | 说明 |
|------|------|
| `build.bat` / `build.sh` | 构建服务端和客户端 |
| `dev.bat` / `dev.sh` | 构建 + 启动本地开发服务器（前端 :3000，后端 :3001） |
| `push.bat` / `push.sh` | 构建（可选）+ Git 推送，3 种模式 + 分支选择 |

### CLI 语言

每个项目都有独立的 `cliLang` 选项来控制终端输出语言：

- **服务端**：在 `server/_config.yml` 中设置 → `cliLang: 'en'` 或 `'zh-CN'`
- **客户端**：在 `client/_config.yml` 中设置 → `cliLang: 'en'` 或 `'zh-CN'`

### 第一步：服务端 - 生成分片文件

详细说明请参阅 [server/README_CN.md](server/README_CN.md)。

### 第二步：客户端 - 构建前端界面

详细说明请参阅 [client/README_CN.md](client/README_CN.md)。

## 配置参考

### 服务端配置 (server/_config.yml)

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `cliLang` | CLI 语言（`'en'` \| `'zh-CN'`） | `'en'` |
| `inputDir` | 输入目录 | `'./input'` |
| `outputDir` | 输出目录 | `'./output'` |
| `maxChunkSize` | 分片大小（字节） | `25000000`（25 MB） |
| `baseUrl` | 部署后的基础 URL | `''` |
| `git.repoUrl` | Git 仓库地址 | 需自行填写 |
| `git.repoBranch` | 目标分支 | `'main'` |
| `git.autoPush` | 生成后自动推送 | `false` |
| `git.commitMessage` | 提交信息 | `'Update: rbpan files'` |

### 客户端站点配置 (client/_config.yml)

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `title` | 站点标题 | `'rbpan'` |
| `subtitle` | 站点副标题 | `'rbpan'` |
| `language` | UI 语言（`'zh-CN'` \| `'en'`） | `'zh-CN'` |
| `cliLang` | CLI 语言（`'en'` \| `'zh-CN'`） | `'en'` |
| `manifestUrl` | manifest.json 的完整 URL | 需自行填写 |
| `downloadThreads` | 并发下载线程数 | `6` |
| `theme` | 主题文件夹名 | `'default'` |
| `defaultTheme` | 默认主题模式 | `'light'` |
| `plugins` | 启用的插件列表 | `[]` |
| `outputDir` | 构建输出目录 | `'./dist'` |
| `devPort` | 开发服务器端口 | `3000` |
| `deploy.repoUrl` | 客户端部署仓库 URL | 需自行填写 |
| `deploy.repoBranch` | 客户端部署分支 | `'main'` |
| `bgImage` | 背景图片 URL | `'./img/bg.png'` |
| `font.family` | 全局字体名称 | `''` |
| `font.files` | 自定义字体文件 | `[]` |
| `customCss` | 外部 CSS URL 列表 | `[]` |

### 字体配置示例

```yaml
font:
  family: 'MyCustomFont'
  files:
    - path: './fonts/my-font-regular.woff2'
      weight: normal
      style: normal
    - path: './fonts/my-font-bold.woff2'
      weight: bold
      style: normal
```

支持的字体格式：`woff2`、`woff`、`ttf`、`otf`

## 功能特性

- **自动分片**：超过大小限制的文件自动分割为 `.rbpan1`、`.rbpan2`... 分片
- **多线程下载**：可配置并行下载线程数，提升下载速度
- **SHA-256 校验**：服务端计算哈希存入清单，客户端合并后自动校验
- **多语言 UI**：内置中文、英文、繁体中文、日文、韩文，一键切换
- **CLI 国际化**：每个项目可通过 `cliLang` 独立选择终端输出语言
- **Vue.js 前端**：Vue 3，Pug + Stylus，构建时全部内联
- **亚克力磨砂 UI**：毛玻璃效果、渐变色背景、流畅动画
- **暗黑主题**：亮色/暗黑双主题，CSS 变量驱动
- **插件系统**：可扩展的插件注册中心，支持生命周期钩子
- **404 页面**：自动适配主题
- **Git 集成**：自动推送到 Git 仓库（优化：浅层获取 + 跳过无变更）
- **纯前端部署**：单 HTML 文件，可部署到 Cloudflare Pages
- **主题可扩展**：在 `client/themes/` 下新建文件夹即可创建新主题
- **自定义字体**：支持自定义字体文件，可配置粗细和样式
- **YAML 配置**：所有配置文件使用 YAML 格式，更易读

## 原理说明

### 分片命名规则
文件 `大文件.zip`（超过 25 MB）→ 分片为：
- `大文件.zip.rbpan1`
- `大文件.zip.rbpan2`
- `大文件.zip.rbpan3`

### 多线程下载原理
1. 客户端从 manifest.json 读取分片信息
2. 创建 N 个工作线程，并行从任务队列中获取分片
3. 全部分片完成后按序合并
4. 计算 SHA-256 并与清单中的哈希值比对
5. 校验通过后触发浏览器下载