<p align="center"><img src="logo.png" alt="Dropify" width="120" height="120"></p>

# Dropify MCP server

The hub for official-store product data. Prices, stock, restocks and new drops on 500k+ merch products, by API or MCP.

An MCP server for [Dropify](https://dropify.cloud).
Dropify tracks official artist and brand merch stores.
Stores span the US, UK, EU, Canada, Australia, Japan and Korea.
Your agent reads prices, stock, restocks and new drops.
It can also look up an artist's official stores.
Everything is read-only.

## Two ways to connect

| | Hosted server | Local server |
| --- | --- | --- |
| Runs | On Dropify, over streamable HTTP | On your machine, over stdio |
| Address | `https://production.dropify.cloud/api/v1/mcp` | `npx -y github:xozxro/dropify-mcp` |
| Tools | 7, and all need a token | 10: the same 7, plus 3 that work without a token |
| Needs | A Dropify token | Node 20+, and a token for the token tools |

## Token tools

These read product data with a Dropify token.

| Tool | What it does |
| --- | --- |
| `my_access` | What this token can read. |
| `list_artists` | Artists on your plan, with an optional name filter. |
| `list_stores` | Stores on your plan, or one artist's stores. |
| `list_products` | The newest products, filtered by artist, store or stock. |
| `get_product` | One product, with price and stock for each size. |
| `search_products` | Word search across products. |
| `recent_changes` | Restocks, new drops, price changes and sell-outs since a time you set. |

Try asking:

- "What restocked on Taylor Swift's store in the last day?"
- "Which Sabrina Carpenter hoodies are in stock, and in what sizes?"
- "Did anything drop in price on My Chemical Romance's store this week?"

## Keyless tools

These work with no token, on the local server.

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

## Get a token

Tokens come with All Access.
All Access covers the site, the API and MCP.
Create a token at https://app.dropify.cloud/developers.
All Access reads every artist and store.
We show a token once, and you can revoke it any time.

In the examples below, swap `YOUR_TOKEN` for your own.

## Connect the hosted server

The server URL is `https://production.dropify.cloud/api/v1/mcp`.
Claude Code, Cursor and Cline send your token as an `Authorization: Bearer` header.
Claude and ChatGPT use your private URL, which ends in your token.
`https://production.dropify.cloud/api/v1/mcp/YOUR_TOKEN`
That URL carries your token, so keep it to yourself.

### Claude setup

Works in Claude on the web and desktop.

1. Open Customize, then Connectors. Click + Add, then Add custom connector.
2. Name it Dropify and paste your private URL.
3. Under Authentication, pick No sign-in, then click Add.

Every Claude plan has custom connectors, and Free allows one.
On Team and Enterprise, an owner adds it in Organization settings.

### ChatGPT setup

1. Open chatgpt.com/plugins, press the plus, and choose Add custom MCP server.
2. Name it Dropify and paste your private URL under Connection.
3. Pick No authentication.
4. Tick I understand and want to continue, then select Create as a plugin.

Custom MCP servers need ChatGPT Business, Enterprise or Edu, on the web.
On Business, an admin or owner adds it.

### Claude Code setup

```
claude mcp add --transport http dropify https://production.dropify.cloud/api/v1/mcp --header "Authorization: Bearer YOUR_TOKEN"
```

Then run `/mcp` in Claude Code to check the server's status.

### Cursor setup

Add to `~/.cursor/mcp.json`, or `.cursor/mcp.json` in a project:

```json
{
  "mcpServers": {
    "dropify": {
      "url": "https://production.dropify.cloud/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
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

## Run the local server

Runs on Node 20+ and speaks stdio.
The keyless tools need no API key.
Set `DROPIFY_TOKEN` to add the token tools.
Leave out `env` to run the keyless tools alone.

### Claude Desktop setup

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dropify": {
      "command": "npx",
      "args": ["-y", "github:xozxro/dropify-mcp"],
      "env": {
        "DROPIFY_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

Or download `dropify-mcp-<version>.mcpb` from the
[latest release](https://github.com/xozxro/dropify-mcp/releases/latest)
and open it in Claude Desktop.
It asks for your token, and you can leave that empty.

### Cursor, local

Add to `~/.cursor/mcp.json`, or `.cursor/mcp.json` in a project:

```json
{
  "mcpServers": {
    "dropify": {
      "command": "npx",
      "args": ["-y", "github:xozxro/dropify-mcp"],
      "env": {
        "DROPIFY_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

### Cline, local

Add this to `cline_mcp_settings.json`:

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

### Claude Code, local

```
claude mcp add --env DROPIFY_TOKEN=YOUR_TOKEN --transport stdio dropify -- npx -y github:xozxro/dropify-mcp
```

### Gemini CLI

```
gemini extensions install https://github.com/xozxro/dropify-mcp
```

Gemini CLI asks for your token while it installs.
Add `--skip-settings` to run the keyless tools alone.

## Use the REST API

The same token reads the same data over REST.
Each account gets 120 requests a minute and 5,000 a day. Up to 20 a minute can be searches. A day also tops out at 50,000 rows.

```
curl -H "Authorization: Bearer YOUR_TOKEN" "https://production.dropify.cloud/api/v1/changes?type=restock&limit=5"
```

- Base URL: `https://production.dropify.cloud/api/v1`
- OpenAPI: https://production.dropify.cloud/api/v1/openapi.json
- Docs: https://dropify.cloud/developers

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
- Docs: https://dropify.cloud/developers
- Issues: https://github.com/xozxro/dropify-mcp/issues

## License and use

MIT
