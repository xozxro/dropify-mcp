import { getBrands, getSources, sourcesForBrand, brandUrl, REQUEST_URL, type Brand } from "./api.js";
import { matchBrands, MATCH_THRESHOLD } from "./match.js";

const NOT_TRACKED = (query: string) =>
  `Dropify doesn't track "${query}" yet. Request it: ${REQUEST_URL}`;

async function resolveBrand(query: string): Promise<{ brand: Brand } | { error: string }> {
  const brands = await getBrands();
  const matches = matchBrands(query, brands);
  const top = matches[0];
  if (!top || top.score < MATCH_THRESHOLD) {
    return { error: NOT_TRACKED(query) };
  }
  return { brand: top.brand };
}

function freeStoreNames(brand: Brand): string[] {
  return brand.sources.filter((s) => s.hasFreeAccess).map((s) => s.name);
}

export async function findBrand(query: string): Promise<string> {
  const brands = await getBrands();
  const matches = matchBrands(query, brands);
  const top = matches[0];

  if (!top || top.score < MATCH_THRESHOLD) {
    return NOT_TRACKED(query);
  }

  const brand = top.brand;
  const free = freeStoreNames(brand);
  const lines = [
    `${brand.name}`,
    brand.genre ? `Genre: ${brand.genre}` : undefined,
    `Stores tracked: ${brand.liveSourceCount} (${brand.freeSourceCount} free on Dropify, ${brand.paidSourceCount} All Access)`,
    free.length > 0 ? `Free store(s): ${free.join(", ")}` : "No free store currently; all stores are All Access.",
  ].filter(Boolean);

  // Surface close alternates when the match wasn't exact, so a slightly off
  // query ("taylor swft") still points the user at what else might fit.
  const alternates = matches
    .slice(1, 4)
    .filter((m) => m.score >= MATCH_THRESHOLD && m.score < 0.999)
    .map((m) => m.brand.name);
  if (top.score < 0.999 && alternates.length > 0) {
    lines.push(`Did you mean one of: ${alternates.join(", ")}?`);
  }

  lines.push(brandUrl(brand.slug));
  return lines.join("\n");
}

export async function officialStores(brandQuery: string): Promise<string> {
  const resolved = await resolveBrand(brandQuery);
  if ("error" in resolved) return resolved.error;
  const { brand } = resolved;

  const sources = await getSources();
  const stores = sourcesForBrand(brand, sources);

  if (stores.length === 0) {
    return [`${brand.name} has no stores on file yet.`, brandUrl(brand.slug)].join("\n");
  }

  const lines = [`${brand.name} — official stores tracked by Dropify:`];
  for (const store of stores) {
    const region = store.proxyCountryCode ?? "unknown region";
    const free = store.hasFreeAccess ? "free on Dropify" : "All Access (paid)";
    const status = store.isPaused ? " [paused]" : store.isHidden ? " [hidden]" : "";
    const url = store.url ? ` — ${store.url}` : "";
    lines.push(`- ${store.name} (${region}): ${free}${url}${status}`);
  }
  lines.push(brandUrl(brand.slug));
  return lines.join("\n");
}

export async function restockAlertLink(brandQuery: string): Promise<string> {
  const resolved = await resolveBrand(brandQuery);
  if ("error" in resolved) return resolved.error;
  const { brand } = resolved;

  const url = brandUrl(brand.slug);
  const howTo =
    "On the brand page, follow the store(s) you care about — Dropify alerts you the moment one restocks or drops.";
  return [`Set restock alerts for ${brand.name}:`, url, howTo].join("\n");
}
