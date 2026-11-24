# dsh-plugin-element-annotation

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) plugin: annotate any page element in the right-sidebar document preview, collect change requests, and send them to the AI in one message.

## What it does

- Adds a **批注 (Annotate)** button to the document preview header.
- **Click an element** — a blue dashed outline marks the target and a one-line input appears below it.
- **Drag a box** — hold the left mouse button and drag to annotate a whole region.
- **Batch submit** — all annotations are collected in a floating panel; **提交给 AI** writes one structured message into the composer and presses Enter.
- Re-target by dragging elsewhere; click empty space or press `Esc` to exit.

## Requirements

- DSH `>= 0.2.2-rc.5` (Web or Desktop).
- The right-sidebar document preview and the conversation composer (both ship with DSH Web/Desktop).

## Install

Pick **one** option. All commands are copy-ready — replace only the quoted path or leave the URLs as they are.

### Option A — From Git, one command (recommended)

```bash
plugin_manager install_bundle target "git+https://github.com/foliage-sky/dsh-plugin-element-annotation.git#df108613ffc2669ef94e9b06b68ac9fe8a3e0d96"
```

Then reload the DSH page. The commit is pinned, so this always installs `v0.1.0`.

### Option B — Local directory (development)

```bash
plugin_manager install_bundle target "/absolute/path/to/dsh-plugin-element-annotation"
```

Or without a terminal: **Plugins → Add plugin → select the plugin directory**.

### Option C — Plugin market (one click after adding the index)

1. In **Plugins**, make sure the optional bundle **Plugin market** is enabled.
2. Open **Discover** and add this index URL:

```text
https://raw.githubusercontent.com/foliage-sky/dsh-plugin-element-annotation/main/index.json
```

3. Find **Element annotation (元素批注)** and click **Install**.

### Option D — npm (after the package is published there)

```bash
plugin_manager install_bundle target "dsh-plugin-element-annotation@0.1.0"
```

## Where to find it

1. Open a file in the **right sidebar** so the document preview is visible.
2. The **批注** button appears in the preview header, next to the path/controls row.
3. If you do not see it: confirm the plugin is enabled in **Plugins**, reload the page, and make sure a preview tab is open.

## Usage

1. Open a document in the right sidebar (Markdown / HTML / DOCX preview).
2. Click **批注** in the preview header.
3. In the preview, either click an element (blue dashed outline) or hold the left button and drag a box (blue dashed box).
4. Type the change request and press `Enter` or click **✓**.
5. Repeat for more annotations. The floating panel at the bottom right lists them; click **提交给 AI**.

| Action | Result |
|---|---|
| Click an element | Element-level annotation (selector + nearby text) |
| Drag a box | Region annotation (size in px + nearby text) |
| Click empty space | Exits picking / closes the input |
| `Esc` | Cancels picking or closes the input |
| Drag elsewhere while an input is open | Switches to the new region |

## Message sent to the AI

```text
请按以下批注修改当前预览的内容：
1. 位置：框选区域 320×180px（区域文字：…）
   修改要求：这一段补充“仅限组织内账号”
2. 位置：#root > div:nth-of-type(2)（页面文字：…）
   修改要求：表头改为“责任部门”
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Button does not appear | Enable the plugin in **Plugins**, reload the page, and open a document preview tab first |
| Button appears but picking does nothing | Click inside the preview area once to focus it, then click **批注** again |
| Message is in the composer but not sent | Press `Enter` once; the plugin inserts text and synthesizes `Enter`, some builds may ignore the synthetic keypress |
| Annotation panel overlaps content | It is fixed at the bottom right; submit or delete annotations to close it |

## Uninstall

```bash
plugin_manager remove_bundle target "dsh-plugin-element-annotation"
```

## Compatibility and limitations

- DOCX previews are rendered pages: an element annotation targets the page container, while box selection records a pixel region plus nearby text.
- The annotation panel does not follow document scrolling.
- Only writes composer text and selection UI; it reads no file contents and sends no data anywhere else.

## Development

- `client.js` — hand-written plain JavaScript (`window.__ModuleLoader__` + `React.createElement`), no build step.
- `index.js` — empty Host half; `cordis.patch.yml` inserts the Host row.
- `locale/en.json`, `locale/zh.json` — plugin title, description and detail document.
- `index.json` — plugin market index (format 1), validated with `@deepseek-ai/dsh-plugin-market-index`.

## License

MIT
