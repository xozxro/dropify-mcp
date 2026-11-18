# Listing text

Copy for MCP directories and registries.

## Common fields

- **Name:** dropify-mcp
- **Title:** Dropify
- **One-line:** The hub for official-store product data: prices, stock and restocks on 500k+ merch products.
- **Repository:** https://github.com/xozxro/dropify-mcp
- **Homepage:** https://dropify.cloud
- **Docs:** https://dropify.cloud/developers
- **License:** MIT
- **Transport:** streamable HTTP (hosted), or stdio on Node 20+
- **Hosted URL:** `https://production.dropify.cloud/api/v1/mcp`
- **Run:** `npx -y github:xozxro/dropify-mcp`
- **Auth:** a Dropify token as a Bearer header, or `DROPIFY_TOKEN` locally; none for keyless tools
- **Topics:** dropify, mcp, mcp-server, model-context-protocol, remote-mcp-server, api, rest-api, openapi, product-data, ecommerce, price-tracking, inventory, restock-alerts, merch, merch-alerts, music, ai-agents, claude, chatgpt, cursor, gemini-cli-extension

## Short description

The hub for official-store product data. Prices, stock, restocks and new drops on 500k+ merch products, by API or MCP.

## Long description

Dropify is the hub for official-store product data.
It tracks official artist and brand merch stores.
Stores span the US, UK, EU, Canada, Australia, Japan and Korea.
The API and MCP server read 500k+ products.
Each has price, currency, stock, image and store link.
Each product's detail adds stock by size.
A change feed lists restocks, new drops, price changes and sell-outs.
This bundle has 10 read-only tools.
Seven need a Dropify token, and three work without one.
Tokens come with All Access.
All Access covers the site, the API and MCP.

## Tool names

Token tools: `my_access`, `list_artists`, `list_stores`, `list_products`, `get_product`, `search_products` and `recent_changes`.
Keyless tools, on the local server: `find_brand`, `official_stores` and `restock_alert_link`.
Unknown brands point to https://dropify.cloud/request.

## Official MCP Registry

- **name:** io.github.xozxro/dropify-mcp
- **package:** mcpb, attached to the GitHub release
- **remote:** streamable-http, `https://production.dropify.cloud/api/v1/mcp`, with an `Authorization` header
