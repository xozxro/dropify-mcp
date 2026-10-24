// Runs the built server in-process via the real MCP client/stdio transport
// and calls each tool against the live Dropify API. Also writes
// tests/live-snapshot.md with the actual output, so a human can eyeball what
// the tools return without re-running anything.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverEntry = path.join(__dirname, "..", "dist", "index.js");

const client = new Client({ name: "dropify-mcp-live-test", version: "0.1.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverEntry],
});

const snapshot = [];
snapshot.push(`# Live snapshot\n`);
snapshot.push(`Generated ${new Date().toISOString()} against the live Dropify API.\n`);

test("connects and lists tools", async () => {
  await client.connect(transport);
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, ["find_brand", "official_stores", "restock_alert_link"]);
});

async function callAndRecord(toolName, args, heading) {
  const result = await client.callTool({ name: toolName, arguments: args });
  const text = result.content?.[0]?.text ?? "";
  assert.ok(text.length > 0, `${toolName}(${JSON.stringify(args)}) returned no text`);
  snapshot.push(`## ${heading}\n`);
  snapshot.push("```\n" + text + "\n```\n");
  return text;
}

test("find_brand: Taylor Swift", async () => {
  const text = await callAndRecord("find_brand", { query: "Taylor Swift" }, "find_brand(\"Taylor Swift\")");
  assert.match(text, /Taylor Swift/);
  assert.match(text, /dropify\.cloud\/brand\/taylor-swift/);
});

test("find_brand: bts", async () => {
  const text = await callAndRecord("find_brand", { query: "bts" }, "find_brand(\"bts\")");
  assert.match(text, /BTS/i);
  assert.match(text, /dropify\.cloud\/brand\/bts/);
});

test("find_brand: unknown brand", async () => {
  const text = await callAndRecord(
    "find_brand",
    { query: "zzzznotarealartist12345" },
    "find_brand(\"zzzznotarealartist12345\")",
  );
  assert.match(text, /doesn't track/);
  assert.match(text, /dropify\.cloud\/request/);
});

test("official_stores: Taylor Swift", async () => {
  const text = await callAndRecord("official_stores", { brand: "Taylor Swift" }, "official_stores(\"Taylor Swift\")");
  assert.match(text, /Taylor Swift/);
});

test("official_stores: bts", async () => {
  const text = await callAndRecord("official_stores", { brand: "bts" }, "official_stores(\"bts\")");
  assert.match(text, /BTS/i);
});

test("official_stores: unknown brand", async () => {
  const text = await callAndRecord(
    "official_stores",
    { brand: "zzzznotarealartist12345" },
    "official_stores(\"zzzznotarealartist12345\")",
  );
  assert.match(text, /doesn't track/);
});

test("restock_alert_link: Taylor Swift", async () => {
  const text = await callAndRecord(
    "restock_alert_link",
    { brand: "Taylor Swift" },
    "restock_alert_link(\"Taylor Swift\")",
  );
  assert.match(text, /dropify\.cloud\/brand\/taylor-swift/);
});

test("restock_alert_link: bts", async () => {
  const text = await callAndRecord("restock_alert_link", { brand: "bts" }, "restock_alert_link(\"bts\")");
  assert.match(text, /dropify\.cloud\/brand\/bts/);
});

test("restock_alert_link: unknown brand", async () => {
  const text = await callAndRecord(
    "restock_alert_link",
    { brand: "zzzznotarealartist12345" },
    "restock_alert_link(\"zzzznotarealartist12345\")",
  );
  assert.match(text, /doesn't track/);
});

after(async () => {
  await client.close();
  await writeFile(path.join(__dirname, "live-snapshot.md"), snapshot.join("\n"));
});
