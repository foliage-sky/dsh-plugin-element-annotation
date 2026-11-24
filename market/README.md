# Plugin market index

DSH's Discover tab reads **plugin market indexes**: public JSON documents in format 1. There is no central upload endpoint in the DSH build this plugin was developed against — you publish the bundle (npm or a pinned Git commit) and host an index document that lists it.

## Files

- `index.example.json` — a format-1 index with one plugin entry. Copy it to `index.json` (or any name) after filling the placeholders.

Required fields and rules (validated by `@deepseek-ai/dsh-plugin-market-index`):

| Field | Rule |
|---|---|
| `format` | must be `1` |
| `title` | localized text, must contain `en` (e.g. `{ "en": "...", "zh": "..." }`) |
| `description` | optional localized text |
| `metadata.categories` / `metadata.labels` / `metadata.sortKeys` | declarations; any id referenced by a plugin must be declared here |
| `plugins[].name` | valid npm package name, unique in the index |
| `plugins[].icon` | relative URL (resolved against the index URL, must stay on https or the index origin) or a `data:` SVG/PNG/JPEG/WebP under 32 KiB |
| `plugins[].versions[].version` | exact SemVer |
| `plugins[].versions[].publishTimestamp` | integer Unix seconds |
| `plugins[].versions[].source` | `{ "type": "npm", "registry": "https://..." }` (registry optional) or `{ "type": "git", "url": "https://github.com/<owner>/<repo>", "commit": "<40 hex>", "path": "<optional package dir>" }` |
| `plugins[].versions[].engines.dsh` | SemVer range checked against the user's DSH version |

`path` is only for a package that is not at the repository root. The Git URL must be canonical (`https://github.com/owner/repo`, no `.git` needed but accepted).

## Host the index

Any public HTTPS URL works, for example:

1. GitHub Pages: put `index.json` and `icon.svg` in `docs/` of a repo and enable Pages for that folder → `https://<user>.github.io/<repo>/index.json`.
2. `raw.githubusercontent.com` URL (icon resolves next to it in the same repo directory).

## Use it in DSH

1. Enable the optional bundle **Plugin market** (`@deepseek-ai/dsh-experimental-plugin-market-bundle`) in Plugins.
2. Open **Discover**, add the index URL.
3. The entry appears with title, description, icon and detail page; install with one click.

## Submission to an official catalog

If your DSH distribution ships an official market index, submit this repository and your `index.json` URL through that catalog's channel (issue/PR in its index repository). This project cannot know that process; treat the self-hosted index as the portable path.
