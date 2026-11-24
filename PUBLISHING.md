# 发布指南（GitHub 已完成，DSH 市场）

## 当前状态

| 项目 | 值 |
|---|---|
| GitHub 仓库 | https://github.com/foliage-sky/dsh-plugin-element-annotation |
| 版本 | `v0.1.0`（tag 已推送） |
| 市场索引 | https://raw.githubusercontent.com/foliage-sky/dsh-plugin-element-annotation/main/index.json |
| 索引校验 | 已用 `@deepseek-ai/dsh-plugin-market-index` 验证通过 |
| 安装 spec | `git+https://github.com/foliage-sky/dsh-plugin-element-annotation.git#<commit>` |

## 在 DSH 中上架

1. Plugins 里启用可选 bundle：**Plugin market**（`@deepseek-ai/dsh-experimental-plugin-market-bundle`）；
2. 打开 **Discover**，添加索引地址：

```
https://raw.githubusercontent.com/foliage-sky/dsh-plugin-element-annotation/main/index.json
```

3. 条目会出现：标题「元素批注」、描述、图标、详情页；点安装即可。

> 本机当前还通过 `link:` 安装了同名开发版本（`dsh-plugin-element-annotation`）。要验证"从市场安装"，先在 Plugins 里移除本地 link 版本，再走市场安装，避免同名冲突。

## 发新版本

1. 改代码，`package.json` 升版本号；
2. 提交并打 tag：

```bash
git add -A
git commit -m "feat: ..."
git tag vX.Y.Z
git push origin main --tags
```

3. 取新 commit SHA：`git rev-parse HEAD`；
4. 更新 `index.json` 里的 `version`、`publishTimestamp`、`source.commit`；
5. 提交推送索引，Discover 刷新即可。

## 可选：GitHub Release

仓库 → Releases → Draft a new release → 选择 `v0.1.0` → 标题/说明 → 发布；可附 ZIP 作为附件。

## 发布后自检

- [x] 仓库公开、`main` 与 `v0.1.0` 已推送
- [x] `index.json` 通过官方校验器，install spec 正确锁定 commit
- [ ] DSH 里添加索引后条目可见（需要你操作并确认）
- [ ] 从市场安装后按钮/批注/提交正常（需要你操作并确认）
