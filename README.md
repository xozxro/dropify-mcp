<p align="center"><img src="logo.png" alt="Dropify" width="120" height="120"></p>

# Dropify MCP server

Instant restock and drop alerts for official artist and brand merch stores.

An MCP server for [Dropify](https://dropify.cloud).
Look up the official stores for any artist or brand.
Then jump to the page where restock and drop alerts are set.
Read-only, straight from Dropify's public API.

## Available tools

| Tool | What it does |
| --- | --- |
| `find_brand` | Fuzzy-match an artist or brand name. Returns the brand, its genre, store coverage and its Dropify page. |
| `official_stores` | List the official stores tracked for a brand: region, access level and the store URL when available. |
| `restock_alert_link` | Get the Dropify page where restock and drop alerts are set for a brand, with a one-line how-to. |

Try asking:

- "What are the official BTS merch stores?"
- "Where can I get restock alerts for Taylor Swift merch?"

Unknown names return a link to request them at
https://dropify.cloud/request.

## Install the server

Runs on Node 20+.
It speaks stdio and needs no API key.

### Claude Desktop setup

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
[latest release](https://github.com/xozxro/dropify-mcp/releases/latest)
and open it in Claude Desktop.

### Cursor setup

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

### Cline setup

Open the MCP Servers panel and choose Configure MCP Servers.
Then add this to `cline_mcp_settings.json`:

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

### Claude Code setup

```
claude mcp add dropify -- npx -y github:xozxro/dropify-mcp
```

## Build from source

```
npm install
npm run build
npm test
```

`dist/` is committed so `npx github:xozxro/dropify-mcp` starts without a build step.
Run `npm run build` and commit the result after changing `src/`.

## Links and support

- Dropify: https://dropify.cloud
- Issues: https://github.com/xozxro/dropify-mcp/issues

## License and use

MIT
