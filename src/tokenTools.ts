import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { INTERNAL_MESSAGE, readToken, v1Get, V1Error, type V1Params } from "./api.js";

export const INSTRUCTIONS =
  "Dropify tracks official artist and brand merch stores. Stores span the US, UK, EU, Canada, Australia, Japan and Korea. The data is read-only and updates automatically. Call my_access first to see what this token reads. Use list_artists and list_stores to find ids. Use search_products to match words and list_products for the newest products. Use get_product for stock by size. Use recent_changes for restocks, new drops, price changes and sell-outs. It returns the last 30 days unless you pass since. Prices are in each store's currency. Quantity is null unless the store's count is known. Link to a product's url when you mention it.";

export const NO_TOKEN_MESSAGE =
  "This tool needs a Dropify token. Create one at https://app.dropify.cloud/developers and set DROPIFY_TOKEN.";

export const NOT_FOUND_MESSAGE = "Nothing found for that path or id.";

// A product id is 24 hex characters; anything else cannot name a product, so it is answered
// here instead of being put into a request path (where ".." would climb out of /products).
const PRODUCT_ID = /^[0-9a-f]{24}$/i;

const ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const artistParam = z.string().optional().describe("An artist id or slug from list_artists.");
const storeParam = z.string().optional().describe("A store id from list_stores.");
const inStockParam = z
  .boolean()
  .optional()
  .describe("True for in-stock products only, false for sold-out only.");
const cursorParam = z.string().optional().describe("The nextCursor value from the page before.");
const skipParam = z.number().int().min(0).optional().describe("How many to skip, for paging.");

function limitParam(max: number, fallback: number) {
  return z
    .number()
    .int()
    .min(1)
    .max(max)
    .default(fallback)
    .describe(`How many to return, 1 to ${max}. Default ${fallback}.`);
}

function ok(body: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(body) }],
    structuredContent: body as Record<string, unknown>,
  };
}

function fail(text: string) {
  return { isError: true as const, content: [{ type: "text" as const, text }] };
}

// Runs one v1 GET for a tool call; a missing token or an API error becomes an
// error result instead of a thrown exception.
async function call(path: string, params: V1Params) {
  if (!readToken()) return fail(NO_TOKEN_MESSAGE);
  try {
    return ok(await v1Get(path, params));
  } catch (err) {
    return fail(err instanceof V1Error ? err.message : INTERNAL_MESSAGE);
  }
}

export function registerTokenTools(server: McpServer): void {
  server.registerTool(
    "my_access",
    {
      title: "Check token access",
      description:
        "Returns this token's plan and the artists it covers. A null artist list means every artist and store. Call it first to learn what you can read.",
      inputSchema: {},
      annotations: ANNOTATIONS,
    },
    async () => call("/me", {}),
  );

  server.registerTool(
    "list_artists",
    {
      title: "List artists",
      description:
        "Lists the artists and brands this token reads, ordered by popularity, then name. Each has an id, slug, category, image, Dropify page and store count. Use it to find an artist's id or slug before you filter other tools.",
      inputSchema: {
        query: z.string().optional().describe("Part of an artist or brand name, in any case."),
        limit: limitParam(100, 20),
        offset: skipParam,
      },
      annotations: ANNOTATIONS,
    },
    async ({ query, limit, offset }) => call("/artists", { q: query, limit, offset }),
  );

  server.registerTool(
    "list_stores",
    {
      title: "List stores",
      description:
        "Lists the stores this token reads, with name, store URL, region, currency and artist. Pass an artist to get only that artist's stores. Regions are US, UK, EU, CA, AU, JP and KR. Use it to find a store id.",
      inputSchema: {
        artist: artistParam,
        limit: limitParam(100, 20),
        offset: skipParam,
      },
      annotations: ANNOTATIONS,
    },
    async ({ artist, limit, offset }) => call("/stores", { artist, limit, offset }),
  );

  server.registerTool(
    "list_products",
    {
      title: "List products",
      description:
        "Lists products, newest first, with name, price, currency, stock, image and store link. Filter by artist, store or stock. Pass nextCursor back as cursor for the next page. Use search_products when you have words to match.",
      inputSchema: {
        artist: artistParam,
        store: storeParam,
        in_stock: inStockParam,
        limit: limitParam(50, 10),
        cursor: cursorParam,
      },
      annotations: ANNOTATIONS,
    },
    async ({ artist, store, in_stock, limit, cursor }) =>
      call("/products", { artist, store, in_stock, limit, cursor }),
  );

  server.registerTool(
    "get_product",
    {
      title: "Get a product",
      description:
        "Returns one product by id. Each variant, such as a size, has its own price, stock and quantity. Use it after a list or search when you need stock by size. Quantity is null unless the store's count is known.",
      inputSchema: {
        id: z.string().describe("A product id from list_products, search_products or recent_changes."),
      },
      annotations: ANNOTATIONS,
    },
    async ({ id }) => {
      if (!readToken()) return fail(NO_TOKEN_MESSAGE);
      if (!PRODUCT_ID.test(id)) return fail(NOT_FOUND_MESSAGE);
      return call(`/products/${id}`, {});
    },
  );

  server.registerTool(
    "search_products",
    {
      title: "Search products",
      description:
        "Searches products by word and returns the same fields as list_products. Use it when someone names an item, like a hoodie or a vinyl. Narrow it with artist, store or in_stock. A search across every store ranks by best match. Within an artist or store, results list newest first.",
      inputSchema: {
        query: z.string().describe("Words to match, 2 to 100 characters."),
        artist: artistParam,
        store: storeParam,
        in_stock: inStockParam,
        limit: limitParam(50, 10),
        offset: z.number().int().min(0).max(200).optional().describe("How many to skip, 0 to 200."),
      },
      annotations: ANNOTATIONS,
    },
    async ({ query, artist, store, in_stock, limit, offset }) =>
      call("/search", { q: query, artist, store, in_stock, limit, offset }),
  );

  server.registerTool(
    "recent_changes",
    {
      title: "List recent changes",
      description:
        "Returns the change feed, newest first. It covers restocks, new drops, price drops and rises, sell-outs and stock changes. Each change has its product, store, artist and time. Price and quantity come with their previous values. It returns the last 30 days unless you pass since. Use it for what restocked, dropped or changed price.",
      inputSchema: {
        artist: artistParam,
        store: storeParam,
        type: z
          .enum(["new", "restock", "price_drop", "price_increase", "stock_up", "stock_down", "sold_out"])
          .optional()
          .describe("One of new, restock, price_drop, price_increase, sold_out, stock_up or stock_down."),
        since: z
          .string()
          .optional()
          .describe("Only changes after this ISO-8601 time, like 2026-11-14T00:00:00Z. Default 30 days ago."),
        limit: limitParam(50, 10),
        cursor: cursorParam,
      },
      annotations: ANNOTATIONS,
    },
    async ({ artist, store, type, since, limit, cursor }) =>
      call("/changes", { artist, store, type, since, limit, cursor }),
  );
}
