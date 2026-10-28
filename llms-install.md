# Installing dropify-mcp

dropify-mcp is a stdio MCP server for Node 20+.
It needs no API key and no environment variables.

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

The built server is committed, so there is no build step.

After setup, three tools are available: `find_brand`, `official_stores` and `restock_alert_link`.
A quick check: call `official_stores` with `{ "brand": "bts" }`.
It returns that brand's official stores and a https://dropify.cloud link.
