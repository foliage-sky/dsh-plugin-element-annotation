# dsh-plugin-element-annotation

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) plugin: annotate any page element in the right-sidebar document preview, collect change requests, and submit them to the AI in one message.

## Features

- **Button in the document preview header** — next to the preview's own controls, no extra panel to open.
- **Click an element** — a blue dashed outline shows the target; a one-line input appears below it.
- **Drag a box** — hold the left button and drag to annotate a whole region (blue dashed box).
- **Keep the outline visible** while you type, so you always know what you selected.
- **Re-target quickly** — while a selection is locked, dragging elsewhere switches to the new region; clicking empty space exits.
- **Batch submit** — all annotations are collected in a floating panel; "提交给 AI" writes one structured message into the composer and presses Enter.

## Install

### From a local directory (development)

```bash
# in the DSH Web/Desktop client
# Plugins → Add plugin → choose this directory
```

Or with the agent tool:

```text
plugin_manager install_bundle target "<absolute path to this directory>"
```

### From npm / a plugin market

Publish the package or add a market index entry (see `market/index.example.json`) pointing at this repository or the npm package.

## Usage

1. Open a document (Markdown / HTML / DOCX preview) in the right sidebar.
2. Click **批注** in the preview header.
3. Click an element or drag a box in the preview.
4. Type the change request; press `Enter` or the ✓ button.
5. Repeat for more annotations; open the floating panel and click **提交给 AI**.

Press `Esc` to cancel picking or close the composer.

## Message format

Each annotation becomes one item in the message sent to the AI:

```text
请按以下批注修改当前预览的内容：
1. 位置：框选区域 320×180px（区域文字：…）
   修改要求：这一段补充“仅限组织内账号”
2. 位置：#root > div:nth-of-type(2)（页面文字：…）
   修改要求：表头改为“责任部门”
```

## Compatibility

- DSH `>=0.2.2-rc.5`
- Web / Desktop client with the right-sidebar document preview (`@deepseek-ai/dsh-client-ui-sidebar-documentpreview`) and the conversation composer.

## Limitations

- DOCX previews are rendered pages; an element annotation targets the page container, while box selection records a pixel region plus nearby text.
- Submitting inserts text into the composer and synthesizes an Enter keypress; if the client ignores it, press Enter once.
- The annotation panel is fixed at the bottom-right and does not follow document scrolling.

## Development

- `client.js` is hand-written plain JavaScript (no build step) using `window.__ModuleLoader__` and `React.createElement`.
- `index.js` is the empty Host half; `cordis.patch.yml` inserts the Host row.
- Display metadata lives in `locale/en.json` and `locale/zh.json`; the detail page image is `docs/preview.svg`.

## License

MIT
