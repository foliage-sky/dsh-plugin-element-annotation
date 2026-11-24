# 发布指南（GitHub + npm + DSH 插件市场）

本目录已经按可开源、可发布的结构整理好。下面每一步写明"需要什么"和"怎么做"。

## 0. 需要你提供/准备的材料

| 材料 | 用途 | 必需 |
|---|---|---|
| GitHub 用户名或组织名 | 仓库地址、`homepage`、`repository` | 是 |
| GitHub 账号（可登录） | 创建公开仓库、上传代码 | 是 |
| 作者署名（姓名/昵称） | `package.json` `author`、`LICENSE` 版权行 | 是 |
| 是否发布到 npm；若发布，npm 用户名/scope | 市场索引用 npm 源时 | 二选一 |
| 开源许可证选择 | 默认 MIT，需你确认 | 是 |
| 仓库内 index 的托管地址 | GitHub Pages 或 raw 链接 | 市场环节需要 |
| Git 客户端 | 本机当前没有安装 `git`，只能用 GitHub 网页上传或先装 Git | 建议 |

## 1. 替换占位符

在以下文件里把 `REPLACE_WITH_*` 替换成真实信息：

- `package.json`：`name`（如果 npm 上已被占用，改成 `@your-name/dsh-plugin-element-annotation`）、`author`、`homepage`、`repository`、`keywords`
- `LICENSE`：`Copyright (c) 2026 <你的名字>`
- `market/index.example.json`：`author`、`homepage`、`repository`、`versions[0].source`、`publishTimestamp`

## 2. 上传到 GitHub

### 方式 A：网页上传（本机没有 Git 时）

1. GitHub → New repository → 名称 `dsh-plugin-element-annotation` → Public → 不勾选 README（避免冲突）；
2. 仓库页 → Add file → Upload files → 把本目录**全部文件/文件夹**拖进去 → Commit；
3. 如需演示图，可在 Release 里附一张实际界面截图（可选）。

### 方式 B：命令行（需先安装 Git）

```bash
cd <本目录>
git init
git add .
git commit -m "feat: element annotation plugin for DSH"
git branch -M main
git remote add origin https://github.com/<你的用户名>/dsh-plugin-element-annotation.git
git push -u origin main
git tag v0.1.0 && git push origin v0.1.0
```

推送后记录最新 commit 的 40 位 SHA（`git rev-parse HEAD`），市场索引用它锁定版本。

## 3. 发布到 npm（可选，推荐）

需要 npm 账号（`npm login`）。若包名已被占用，改成 scoped 名并带 `--access public`：

```bash
npm publish --access public
```

> 本目录的 `client.js` 是手写纯 JS，无需构建；`files` 白名单已包含运行文件、patch、locale、docs、icon 与 README/LICENSE。

## 4. 建立插件市场索引

1. 复制 `market/index.example.json` 为 `index.json`（放在仓库根目录，或 `docs/` 下）；
2. 按第 1 步的占位符规则填好；`source` 二选一：
   - npm：`"source": { "type": "npm" }`（或带 `registry`）
   - Git：`"source": { "type": "git", "url": "https://github.com/<user>/<repo>", "commit": "<40位SHA>" }`
3. 托管成公开 HTTPS 地址，任选其一：
   - GitHub Pages：仓库 Settings → Pages → Source 选 `main` / `docs` 目录，地址形如
     `https://<user>.github.io/<repo>/index.json`
   - 仓库 raw 地址：`https://raw.githubusercontent.com/<user>/<repo>/main/index.json`
4. 校验：`icon` 用相对路径（相对 index 地址解析）必须落在 https 或同源，且不超过 32 KiB 内联限制。

## 5. 在 DSH 中上架/验证

1. Plugins 里启用可选 bundle：**Plugin market**（`@deepseek-ai/dsh-experimental-plugin-market-bundle`）；
2. Discover → 添加你的 index URL；
3. 确认条目出现：标题、描述、图标、详情页（`docs/DETAIL.md` + `docs/preview.svg`）；
4. 从市场安装一次，验证按钮与批注流程。

> 注意：本机当前已通过 `link:` 安装了同名的 `@local/element-annotation`，属于开发版。正式验证市场安装前，先在 Plugins 里移除本地 link 版本，避免同名冲突。

## 6. 正式上架到官方目录（如果存在）

不同 DSH 发行版的官方目录提交方式不同，本仓库无法假定；通用做法是向目录维护方的索引仓库提 PR/Issue，附：

- GitHub 仓库地址
- `index.json` 公网地址
- 插件截图 + 一句话说明
- 许可证与作者信息

## 7. 发布后自检清单

- [ ] `package.json` 的 `name`、`version`、`engines.dsh`、`repository` 正确
- [ ] `files` 白名单里的文件在打包后都存在（`npm pack --dry-run` 可查）
- [ ] `locale/*.json` 的 `meta.title`、`meta.description`、`meta.detail` 路径有效
- [ ] `docs/DETAIL.md` 只有一行图片，且 `docs/preview.svg` 能正常渲染
- [ ] `icon.svg` 有效且 < 256 KiB
- [ ] 安装后按钮出现在文档预览头部，单击/框选/提交均可用
- [ ] 市场 install 走 npm 或 Git 源都能装成功
