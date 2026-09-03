# rbpan - 客户端

rbpan 独立客户端项目。
使用 Pug + Stylus + Vue.js 构建单页面前端，支持亚克力磨砂暗黑主题与插件扩展。

## 快速开始

1. 安装依赖：
   ```bash
   npm install
   ```

2. 修改 `_config.yml`：
   ```yaml
   title: 'rbpan'
   subtitle: 'rbpan'
   description: 'Lightweight cloud drive system'
   language: 'zh-CN'                              # 'zh-CN' | 'en'
   cliLang: 'zh-CN'                               # 'en' | 'zh-CN'

   manifestUrl: 'https://你的用户名.github.io/仓库名/manifest.json'
   downloadThreads: 6
   theme: 'default'
   defaultTheme: 'light'
   plugins: []
   outputDir: './dist'
   devPort: 3000

   deploy:
     repoUrl: 'https://github.com/你的用户名/rbpan-client.git'
     repoBranch: 'main'
   ```

3. 构建：
   ```bash
   npm run build
   ```

   或构建并启动本地预览：
   ```bash
   npm start
   ```

4. 构建后 `dist/index.html` 是单文件，包含内联的 Vue 3、CSS 和所有 JS。

## npm 命令

```bash
npm install          # 安装依赖
npm run build        # 构建前端
npm start            # 构建 + 启动本地预览（http://localhost:3000）
npm run clean        # 清理构建输出
```

## 部署

将 `dist/` 部署到 Cloudflare Pages 或任何静态托管平台。

## 配置

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

## 文件结构

```
client/
├── README.md / README_CN.md
├── package.json
├── _config.yml         # 站点配置（YAML 格式）
├── build.js            # 构建脚本
├── dist/               # 构建输出（可部署）
├── languages/          # CLI 语言包
│   ├── en.js
│   └── zh-CN.js
├── lib/
│   └── i18n.js         # i18n 辅助
└── themes/
    └── default/        # 默认主题
        ├── _config.js  # 主题配置
        ├── layout/     # Pug 模板
        │   ├── index.pug
        │   └── 404.pug
        ├── source/     # 主题资源
        │   ├── css/
        │   │   ├── style.styl
        │   │   └── _theme/
        │   │       ├── light.styl
        │   │       └── dark.styl
        │   ├── js/
        │   │   ├── app.js
        │   │   ├── downloader.js
        │   │   └── hashVerifier.js
        │   └── plugin/
        │       └── registry.js
        └── languages/  # UI 多语言
            ├── zh-CN.js
            └── en.js
```

## 主题开发

在 `client/themes/` 下新建文件夹即可创建新主题：

```
client/themes/your-theme/
├── _config.js           # 主题配置
├── layout/              # Pug 布局模板
├── source/              # 资源文件
│   ├── css/
│   │   ├── style.styl
│   │   └── _theme/
│   ├── js/
│   │   └── app.js
│   └── plugin/
└── languages/           # UI 多语言
```

然后在 `_config.js` 中将 `theme` 改为你的主题文件夹名即可。

## 主题配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `name` | 主题名称 | `'default'` |
| `version` | 主题版本 | `'1.0.0'` |
| `acrylic.blur` | 亚克力模糊程度 | `24` |
| `acrylic.saturation` | 亚克力饱和度 | `180` |
| `acrylic.opacity` | 面板透明度 | `0.72` |
| `animation.enable` | 启用动画 | `true` |
| `animation.speed` | 过渡速度 | `0.2` |