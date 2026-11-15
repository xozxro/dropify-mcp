# Installing dropify-mcp

dropify-mcp is a stdio MCP server for Node 20+.
It starts with no API key and no environment variables.
A Dropify token in `DROPIFY_TOKEN` adds the product, search and change tools.

Add this entry to the MCP settings file (`cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "dropify": {
      "command": "npx",
      "args": ["-y", "github:xozxro/dropify-mcp"],
      "env": {
        "DROPIFY_TOKEN": "YOUR_TOKEN"
      },
      "disabled": false
    }
  }
}
```

Ask the user for their token and put it in place of `YOUR_TOKEN`.
Never make one up.
If they have no token, leave out the `env` block.
Tokens come with All Access and are created at https://app.dropify.cloud/developers.

The built server is committed, so there is no build step.

## Hosted option

Dropify also hosts the token tools, with nothing to install.
Use this entry instead:

```json
{
  "mcpServers": {
    "dropify": {
      "type": "streamableHttp",
      "url": "https://production.dropify.cloud/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      },
      "disabled": false
    }
  }
}
```

## Check the setup

Three tools work with no token: `find_brand`, `official_stores` and `restock_alert_link`.
A quick check: call `official_stores` with `{ "brand": "bts" }`.
It returns that brand's official stores and a https://dropify.cloud link.

Seven tools use the token: `my_access`, `list_artists`, `list_stores`, `list_products`, `get_product`, `search_products` and `recent_changes`.
A quick check: call `my_access`.
It returns the plan and what the token reads.
Without a token, these tools answer with how to create one.
