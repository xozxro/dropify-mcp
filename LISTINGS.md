# Listing text (prepared, not submitted)

Draft copy for third-party MCP directories. Not submitted anywhere yet; paste
as needed per site's submission form.

## Common fields

- **Name:** dropify-mcp
- **One-line:** Official merch store lookup and restock alert links for AI assistants, from Dropify.
- **Repository:** https://github.com/xozxro/dropify-mcp
- **Homepage:** https://dropify.cloud
- **License:** MIT
- **Package:** `dropify-mcp` on npm (run with `npx -y dropify-mcp`)
- **Topics/tags:** mcp, model-context-protocol, merch, restock-alerts, music

## Short description (1-2 sentences)

Dropify tracks official artist and brand merch stores and restock alerts.
This MCP server lets an AI assistant look up a brand's official stores, which
ones are free to track, and where to set restock alerts, straight from
Dropify's public API.

## Long description

dropify-mcp connects AI assistants to Dropify's merch tracking data. It
exposes three tools: `find_brand` fuzzy-matches an artist or brand name and
returns store counts and which store is free; `official_stores` lists every
official store Dropify tracks for a brand with region, free/paid status, and
the store URL when available; `restock_alert_link` returns the Dropify page
where a user sets drop and restock alerts. Data is read-only from Dropify's
public API, cached in memory for 10 minutes. Unknown brands point to
https://dropify.cloud/request instead of guessing.

## smithery.ai

- **Title:** Dropify Merch Lookup
- **Description:** Look up official artist/brand merch stores and restock
  alert links from Dropify, the merch store tracker. Three tools:
  `find_brand`, `official_stores`, `restock_alert_link`.
- **Category:** Shopping / Data
- **Repo:** https://github.com/xozxro/dropify-mcp

## mcp.so

- **Name:** dropify-mcp
- **Tagline:** Official merch store lookup and restock alerts, from Dropify.
- **Description:** (use "Long description" above)
- **Tags:** shopping, music, merch, alerts

## glama.ai

- **Name:** dropify-mcp
- **Summary:** (use "Short description" above)
- **Repository:** https://github.com/xozxro/dropify-mcp
- **Transport:** stdio
- **Runtime:** Node.js 20+

## Official MCP registry (modelcontextprotocol/registry)

- **name:** io.github.xozxro/dropify-mcp
- **description:** (use "Short description" above)
- **repository.url:** https://github.com/xozxro/dropify-mcp
- **version:** 0.1.0
- **packages:** npm, `dropify-mcp`
