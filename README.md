<p align="center"><img src="logo.png" alt="Dropify" width="120" height="120"></p>

# dropify-mcp

Instant restock and drop alerts for official artist and brand merch stores.

An MCP server for [Dropify](https://dropify.cloud). Your AI assistant can look up the
official stores Dropify tracks for an artist or brand, then point you to the page where
restock and drop alerts are set. Read-only, straight from Dropify's public API.

## Tools

| Tool | What it does |
| --- | --- |
| `find_brand` | Fuzzy-match an artist or brand name. Returns the brand, its genre, store coverage and its Dropify page. |
| `official_stores` | List the official stores tracked for a brand: region, access level and the store URL when available. |
| `restock_alert_link` | Get the Dropify page where restock and drop alerts are set for a brand, with a one-line how-to. |

Try asking: "Which official stores does Dropify track for BTS?" or "Where can I get
restock alerts for Taylor Swift merch?"

An unrecognized name returns a note with a link to request it at
https://dropify.cloud/request.

## Install

Runs on Node 20+. The server speaks stdio and needs no API key.

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dropify": {
      "command": "npx",
      "args": ["-y", "github:xozxro/dropify-mcp"]
    }
  }
}
```

Or download `dropify-mcp-<version>.mcpb` from the
[latest release](https://github.com/xozxro/dropify-mcp/releases/latest) and open it in
Claude Desktop.

### Cursor

Add to `~/.cursor/mcp.json`, or `.cursor/mcp.json` in a project:

```json
{
  "mcpServers": {
    "dropify": {
      "command": "npx",
      "args": ["-y", "github:xozxro/dropify-mcp"]
    }
  }
}
```

### Cline

Open the MCP Servers panel, choose Configure MCP Servers, and add to `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "dropify": {
      "command": "npx",
      "args": ["-y", "github:xozxro/dropify-mcp"],
      "disabled": false
    }
  }
}
```

### Claude Code

```
claude mcp add dropify -- npx -y github:xozxro/dropify-mcp
```

## Data source

Reads only Dropify's public API: `/api/landing/brands` and `/api/all-sources`.
No write access, no scraping, no private endpoints. Responses are cached in memory
for 10 minutes per process.

## Development

```
npm install
npm run build
npm test
```

`dist/` is committed so `npx github:xozxro/dropify-mcp` starts without a build step.
Run `npm run build` and commit the result after changing `src/`.

## Links

- Dropify: https://dropify.cloud
- Issues: https://github.com/xozxro/dropify-mcp/issues

## License

MIT
