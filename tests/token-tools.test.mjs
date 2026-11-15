// Token tools against a mocked fetch: request mapping, auth header, error
// handling, and parity with the hosted server's tool catalogue (fixture).
import { test, beforeEach, afterEach, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTokenTools, NO_TOKEN_MESSAGE } from "../dist/tokenTools.js";
import { readToken, V1_BASE } from "../dist/api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(path.join(__dirname, "fixtures", "hosted-tools.json"), "utf8"));
const TOKEN = "dfy_" + "0123456789abcdef".repeat(3);
const TOKEN_NAMES = [
  "my_access",
  "list_artists",
  "list_stores",
  "list_products",
  "get_product",
  "search_products",
  "recent_changes",
];

const realFetch = globalThis.fetch;
const realToken = process.env.DROPIFY_TOKEN;
let calls = [];
let responder;
let client;
let server;

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

beforeEach(async () => {
  calls = [];
  responder = () => jsonResponse({ ok: true });
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(String(url)), headers: init?.headers ?? {} });
    return responder(calls.length);
  };
  process.env.DROPIFY_TOKEN = TOKEN;
  server = new McpServer({ name: "dropify-mcp-test", version: "0.0.0" });
  registerTokenTools(server);
  client = new Client({ name: "token-tools-test", version: "0.0.0" });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
});

afterEach(async () => {
  await client.close();
  await server.close();
  globalThis.fetch = realFetch;
});

after(() => {
  if (realToken === undefined) delete process.env.DROPIFY_TOKEN;
  else process.env.DROPIFY_TOKEN = realToken;
});

function normalise(schema) {
  const properties = {};
  for (const [name, prop] of Object.entries(schema.properties ?? {})) {
    const kept = {};
    for (const key of ["type", "enum", "minimum", "maximum", "default"]) {
      // zod bounds every integer to the safe-integer range; that is the same as unbounded.
      if (prop[key] === Number.MAX_SAFE_INTEGER || prop[key] === Number.MIN_SAFE_INTEGER) continue;
      if (prop[key] !== undefined) kept[key] = prop[key];
    }
    properties[name] = kept;
  }
  return { properties, required: [...(schema.required ?? [])].sort() };
}

test("the seven token tools match the hosted catalogue", async () => {
  const { tools } = await client.listTools();
  assert.deepEqual(
    tools.map((t) => t.name).sort(),
    [...TOKEN_NAMES].sort(),
  );
  assert.deepEqual(fixture.map((t) => t.name).sort(), [...TOKEN_NAMES].sort());
  for (const hosted of fixture) {
    const local = tools.find((t) => t.name === hosted.name);
    assert.equal(local.title, hosted.title, `${hosted.name} title`);
    assert.equal(local.description, hosted.description, `${hosted.name} description`);
    assert.deepEqual(local.annotations, hosted.annotations, `${hosted.name} annotations`);
    assert.deepEqual(normalise(local.inputSchema), normalise(hosted.inputSchema), `${hosted.name} inputSchema`);
  }
});

test("parameter descriptions match the hosted catalogue", async () => {
  const { tools } = await client.listTools();
  for (const hosted of fixture) {
    const local = tools.find((t) => t.name === hosted.name);
    for (const [name, prop] of Object.entries(hosted.inputSchema.properties ?? {})) {
      assert.equal(local.inputSchema.properties[name].description, prop.description, `${hosted.name}.${name}`);
    }
  }
});

async function run(name, args) {
  const result = await client.callTool({ name, arguments: args });
  assert.ok(!result.isError, `${name} returned an error: ${JSON.stringify(result.content)}`);
  assert.equal(calls.length, 1, `${name} made one request`);
  return calls[0];
}

function params(call) {
  return Object.fromEntries(call.url.searchParams.entries());
}

const cases = [
  ["my_access", {}, "/me", {}],
  ["list_artists", { query: "tay", limit: 5, offset: 10 }, "/artists", { q: "tay", limit: "5", offset: "10" }],
  ["list_artists", {}, "/artists", { limit: "20" }],
  ["list_stores", { artist: "taylor-swift", limit: 3, offset: 1 }, "/stores", { artist: "taylor-swift", limit: "3", offset: "1" }],
  ["list_stores", {}, "/stores", { limit: "20" }],
  [
    "list_products",
    { artist: "a1", store: "s1", in_stock: false, limit: 7, cursor: "abc" },
    "/products",
    { artist: "a1", store: "s1", in_stock: "false", limit: "7", cursor: "abc" },
  ],
  ["list_products", {}, "/products", { limit: "10" }],
  ["get_product", { id: "p 1/2" }, "/products/p%201%2F2", {}],
  [
    "search_products",
    { query: "hoodie", artist: "a1", store: "s1", in_stock: true, limit: 4, offset: 8 },
    "/search",
    { q: "hoodie", artist: "a1", store: "s1", in_stock: "true", limit: "4", offset: "8" },
  ],
  ["search_products", { query: "vinyl" }, "/search", { q: "vinyl", limit: "10" }],
  [
    "recent_changes",
    { artist: "a1", store: "s1", type: "restock", since: "2026-01-02T00:00:00Z", limit: 2, cursor: "c" },
    "/changes",
    { artist: "a1", store: "s1", type: "restock", since: "2026-01-02T00:00:00Z", limit: "2", cursor: "c" },
  ],
  ["recent_changes", {}, "/changes", { limit: "10" }],
];

for (const [name, args, endpoint, expected] of cases) {
  test(`${name} ${JSON.stringify(args)} -> GET ${endpoint}`, async () => {
    const call = await run(name, args);
    assert.equal(call.url.origin + call.url.pathname, `${V1_BASE}${endpoint}`);
    assert.deepEqual(params(call), expected);
    assert.equal(call.headers.Authorization, `Bearer ${TOKEN}`);
    assert.match(call.headers["User-Agent"], /^dropify-mcp\//);
  });
}

test("the result carries the body as text and as structured content", async () => {
  const body = { plan: "all_access", artists: null };
  responder = () => jsonResponse(body);
  const result = await client.callTool({ name: "my_access", arguments: {} });
  assert.ok(!result.isError);
  assert.deepEqual(JSON.parse(result.content[0].text), body);
  assert.deepEqual(result.structuredContent, body);
});

test("without a token each tool answers with the setup message and makes no request", async () => {
  for (const blank of [undefined, "", "   "]) {
    if (blank === undefined) delete process.env.DROPIFY_TOKEN;
    else process.env.DROPIFY_TOKEN = blank;
    for (const name of TOKEN_NAMES) {
      const args = name === "get_product" ? { id: "1" } : name === "search_products" ? { query: "hoodie" } : {};
      const result = await client.callTool({ name, arguments: args });
      assert.equal(result.isError, true, name);
      assert.deepEqual(result.content, [{ type: "text", text: NO_TOKEN_MESSAGE }], name);
    }
  }
  assert.equal(
    NO_TOKEN_MESSAGE,
    "This tool needs a Dropify token. Create one at https://app.dropify.cloud/developers and set DROPIFY_TOKEN.",
  );
  assert.equal(calls.length, 0);
});

test("readToken trims and treats empty as none", () => {
  process.env.DROPIFY_TOKEN = `  ${TOKEN}\n`;
  assert.equal(readToken(), TOKEN);
  process.env.DROPIFY_TOKEN = " ";
  assert.equal(readToken(), null);
  delete process.env.DROPIFY_TOKEN;
  assert.equal(readToken(), null);
});

test("an API error envelope becomes an error result with its message", async () => {
  const message = "That artist or store isn't on your plan.";
  responder = () => jsonResponse({ error: { code: "out_of_scope", message } }, 403);
  const result = await client.callTool({ name: "list_stores", arguments: { artist: "x" } });
  assert.equal(result.isError, true);
  assert.deepEqual(result.content, [{ type: "text", text: message }]);
});

test("a body that is not the envelope falls back to the internal message", async () => {
  responder = () => new Response("<html>bad gateway</html>", { status: 502 });
  const result = await client.callTool({ name: "my_access", arguments: {} });
  assert.equal(result.isError, true);
  assert.equal(result.content[0].text, "The request failed on our side, so try it again.");
});

test("a network failure becomes an error result", async () => {
  responder = () => {
    throw new TypeError("fetch failed");
  };
  const result = await client.callTool({ name: "my_access", arguments: {} });
  assert.equal(result.isError, true);
  assert.equal(result.content[0].text, "The request failed on our side, so try it again.");
});

test("a 429 is retried once, honouring Retry-After", async () => {
  responder = (n) =>
    n === 1
      ? jsonResponse({ error: { code: "rate_limited", message: "Too many requests, so wait before you retry." } }, 429, {
          "retry-after": "0",
        })
      : jsonResponse({ ok: true });
  const result = await client.callTool({ name: "my_access", arguments: {} });
  assert.ok(!result.isError);
  assert.equal(calls.length, 2);
});

test("a second 429 is returned as an error without a third request", async () => {
  const message = "Too many requests, so wait before you retry.";
  responder = () => jsonResponse({ error: { code: "rate_limited", message } }, 429, { "retry-after": "0" });
  const result = await client.callTool({ name: "my_access", arguments: {} });
  assert.equal(result.isError, true);
  assert.equal(result.content[0].text, message);
  assert.equal(calls.length, 2);
});

test("the built server lists the three keyless tools and the seven token tools", async () => {
  const stdio = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(__dirname, "..", "dist", "index.js")],
    env: { ...process.env, DROPIFY_TOKEN: "" },
  });
  const probe = new Client({ name: "token-tools-stdio", version: "0.0.0" });
  await probe.connect(stdio);
  try {
    const { tools } = await probe.listTools();
    assert.deepEqual(tools.map((t) => t.name).sort(), [
      "find_brand",
      "get_product",
      "list_artists",
      "list_products",
      "list_stores",
      "my_access",
      "official_stores",
      "recent_changes",
      "restock_alert_link",
      "search_products",
    ]);
    assert.match(probe.getInstructions() ?? "", /^Dropify tracks official artist and brand merch stores\./);
  } finally {
    await probe.close();
  }
});
