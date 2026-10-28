# Installing dropify-mcp

dropify-mcp is a stdio MCP server for Node 20+. It needs no API key and no environment variables.

Add this entry to the MCP settings file (`cline_mcp_settings.json`):

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

The built server is committed to the repository, so no clone or build step is needed.

After setup, three tools are available: `find_brand`, `official_stores` and `restock_alert_link`.
A quick check: call `official_stores` with `{ "brand": "bts" }`. It returns the official stores
Dropify tracks for that brand and a https://dropify.cloud link.
