# dropify-mcp

MCP server for [Dropify](https://dropify.cloud), the official artist/brand merch store tracker.
It gives AI assistants three tools to look up official stores and restock alerts.
Data comes straight from Dropify's public API, read-only, cached for 10 minutes.

## Install

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dropify": {
      "command": "npx",
      "args": ["-y", "dropify-mcp"]
    }
  }
}
```

### Claude Code

```
claude mcp add dropify -- npx -y dropify-mcp
```

### Cursor

Add to Cursor's MCP settings (`~/.cursor/mcp.json` or the project's `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "dropify": {
      "command": "npx",
      "args": ["-y", "dropify-mcp"]
    }
  }
}
```

## Tools

### `find_brand`

Fuzzy-match an artist or brand name against Dropify's tracked brands. Returns the
brand name, store counts, which store is free, and the Dropify page.

Example: `find_brand({ query: "taylor swift" })`

```
Taylor Swift
Genre: Pop
Stores tracked: 10 (2 free on Dropify, 8 All Access)
Free store(s): Taylor Swift US, Taylor Swift UK
https://dropify.cloud/brand/taylor-swift?utm_source=mcp
```

### `official_stores`

List every official store Dropify tracks for a brand: region, whether it's free
on Dropify, and the official URL when Dropify exposes one.

Example: `official_stores({ brand: "bts" })`

```
BTS: official stores tracked by Dropify:
- BTS US (US), free on Dropify. https://store.weverse.io/...
- BTS JP (JP), All Access (paid)
...
https://dropify.cloud/brand/bts?utm_source=mcp
```

### `restock_alert_link`

Get the Dropify page where a user sets restock/drop alerts for a brand, plus a
one-line how-to.

Example: `restock_alert_link({ brand: "bts" })`

```
Set restock alerts for BTS:
https://dropify.cloud/brand/bts?utm_source=mcp
On the brand page, follow the store(s) you care about. Dropify alerts you the
moment one restocks or drops.
```

An unrecognized brand returns a note that Dropify doesn't track it yet, with a
link to request it at https://dropify.cloud/request.

## Data source

Reads only Dropify's public, read-only API:
`/api/landing/brands` and `/api/all-sources`. No write access, no scraping, no
private endpoints. Responses are cached in memory for 10 minutes per process.

## Development

Requires Node 20+.

```
npm install
npm run build
npm test
```

## License

MIT
