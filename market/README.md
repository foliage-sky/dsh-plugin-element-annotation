# Plugin market index

DSH's Discover tab reads **plugin market indexes**: public JSON documents in format 1. This repository ships a ready index at the repository root:

```
https://raw.githubusercontent.com/foliage-sky/dsh-plugin-element-annotation/main/index.json
```

Add that URL in DSH (Discover / Settings → plugin market indexes) and the plugin appears with title, description, icon and detail page.

## How the entry is pinned

`index.json` lists version `0.1.0` with a **Git source pinned to a commit**:

```json
"source": {
  "type": "git",
  "url": "https://github.com/foliage-sky/dsh-plugin-element-annotation",
  "commit": "<40-hex commit SHA>"
}
```

The pinned commit must contain the plugin package (`package.json`, `client.js`, `index.js`, `cordis.patch.yml`, `locale/`, `docs/`, `icon.svg`). Update the SHA whenever you publish a new version, otherwise installs keep the old code.

## Rules (validated by `@deepseek-ai/dsh-plugin-market-index`)

| Field | Rule |
|---|---|
| `format` | must be `1` |
| `title` | localized text, must contain `en` |
| `metadata.categories` / `metadata.labels` | declarations; every referenced id must be declared |
| `plugins[].name` | valid npm package name, unique in the index |
| `plugins[].icon` | relative URL (resolved against the index URL; https or same origin) or a `data:` image under 32 KiB |
| `plugins[].versions[].version` | exact SemVer |
| `plugins[].versions[].publishTimestamp` | integer Unix seconds |
| `plugins[].versions[].engines.dsh` | SemVer range checked against the user's DSH version |

## New version checklist

1. Bump `package.json` `version`, commit and push;
2. Tag it (`git tag vX.Y.Z && git push origin vX.Y.Z`);
3. Put the new commit SHA and version into `index.json`;
4. Commit and push the index; users refresh Discover.
