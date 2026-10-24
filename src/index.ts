#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { findBrand, officialStores, restockAlertLink } from "./tools.js";

const server = new McpServer({
  name: "dropify-mcp",
  version: "0.1.0",
});

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

server.registerTool(
  "find_brand",
  {
    title: "Find a Dropify brand",
    description:
      "Fuzzy-match an artist or brand name against Dropify's tracked brands. Returns the brand name, its Dropify page, how many stores are tracked, and which store (if any) is free.",
    inputSchema: {
      query: z.string().describe("Artist or brand name to look up, e.g. 'Taylor Swift' or 'bts'"),
    },
  },
  async ({ query }) => textResult(await findBrand(query)),
);

server.registerTool(
  "official_stores",
  {
    title: "List a brand's official stores",
    description:
      "List every official store Dropify tracks for a brand, with region, whether it's free on Dropify, and the official store URL when Dropify exposes one.",
    inputSchema: {
      brand: z.string().describe("Artist or brand name, e.g. 'Taylor Swift'"),
    },
  },
  async ({ brand }) => textResult(await officialStores(brand)),
);

server.registerTool(
  "restock_alert_link",
  {
    title: "Get a brand's restock alert link",
    description:
      "Get the Dropify page where a user sets restock/drop alerts for a brand, plus a one-line how-to.",
    inputSchema: {
      brand: z.string().describe("Artist or brand name, e.g. 'bts'"),
    },
  },
  async ({ brand }) => textResult(await restockAlertLink(brand)),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("dropify-mcp failed to start:", err);
  process.exit(1);
});
