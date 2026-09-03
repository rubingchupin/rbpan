# rbpan - 服务端

rbpan 独立服务端项目。
扫描文件、为大文件生成分片，并生成包含 SHA-256 哈希的清单文件。

## 快速开始

1. 创建 `input` 文件夹，将你要分享的文件和文件夹放入其中：
   ```
   server/
   └── input/
       ├── 文档/
       │   ├── 说明.pdf
       │   └── 教程.docx
       ├── 图片.jpg
       └── 大文件.zip
   ```

2. 修改 `config.js`：
   ```js
   module.exports = {
     cliLang: 'en',                  // 'en' | 'zh-CN'
     inputDir: './input',
     outputDir: './output',
     maxChunkSize: 25 * 1000 * 1000, // 25 MB
     baseUrl: '',

     git: {
       repoUrl: 'https://github.com/你的用户名/你的仓库.git',
       repoBranch: 'main',
       autoPush: false,
       commitMessage: 'Update: rbpan files',
     },
   };
   ```

3. 运行：
   ```bash
   node index.js
   ```

4. 生成的文件在 `output/` 目录中：
   - `manifest.json` — 文件清单（含 SHA-256 哈希）
   - 小文件直接复制，大文件分片为 `.rbpan1`、`.rbpan2`...

## 部署

将 `output/` 目录部署到 GitHub Pages 或任何静态托管，获取 manifest.json 的 URL：
```
https://你的用户名.github.io/仓库名/manifest.json
```

## 配置

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

## 文件结构

```
server/
├── README.md / README_CN.md
├── package.json
├── config.js           # 服务端配置
├── index.js            # 入口
├── input/              # 放置要分享的文件
├── output/             # 生成的分片 + manifest.json
├── languages/          # CLI 语言包
│   ├── en.json
│   └── zh-CN.json
└── lib/                # 核心库
    ├── i18n.js         # i18n 辅助
    ├── scanner.js      # 目录扫描
    ├── splitter.js     # 分片 + SHA-256
    └── generator.js    # 输出生成
```

## 工作原理

1. `scanner.js` 递归扫描 `input/` 目录
2. 对每个文件，`splitter.js` 计算 SHA-256
3. 文件 ≤ `maxChunkSize` 直接复制
4. 文件 > `maxChunkSize` 分割为 `.rbpan1`、`.rbpan2`... 分片
5. `generator.js` 生成包含所有文件元数据和哈希的 `manifest.json`