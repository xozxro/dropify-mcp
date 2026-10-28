# Listing text

Copy for MCP directories and registries.

## Common fields

- **Name:** dropify-mcp
- **Title:** Dropify
- **One-line:** Instant restock and drop alerts for official artist and brand merch stores.
- **Repository:** https://github.com/xozxro/dropify-mcp
- **Homepage:** https://dropify.cloud
- **License:** MIT
- **Transport:** stdio, Node 20+
- **Run:** `npx -y github:xozxro/dropify-mcp`
- **Topics:** mcp, mcp-server, model-context-protocol, merch, restock-alerts, dropify

## Short description

Look up the official merch stores for an artist or brand.
Then get the page where restock and drop alerts are set.

## Long description

dropify-mcp connects AI assistants to Dropify's merch data.
`find_brand` matches an artist or brand name.
`official_stores` lists its official stores with region and store URL.
`restock_alert_link` returns the page where restock and drop alerts are set.
Read-only, from Dropify's public API.
Unknown brands point to https://dropify.cloud/request.

## Official MCP Registry

- **name:** io.github.xozxro/dropify-mcp
- **package:** mcpb, attached to the GitHub release
