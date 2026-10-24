// Read-only client for Dropify's public API, with a 10 minute in-memory cache
// so repeated tool calls in one session don't hammer production.dropify.cloud.

const USER_AGENT = "dropify-mcp/1.0 (+https://dropify.cloud)";
const BASE_URL = "https://production.dropify.cloud";
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface BrandSource {
  _id: string;
  name: string;
  hasFreeAccess: boolean;
  proxyCountryCode?: string;
  canonicalCurrency?: string;
  retailer?: boolean;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  bio?: string;
  genre?: string;
  category?: string;
  hasFreeSources: boolean;
  hasPaidSources: boolean;
  freeSourceCount: number;
  paidSourceCount: number;
  liveSourceCount: number;
  sources: BrandSource[];
}

export interface Source {
  _id: string;
  name: string;
  url?: string;
  hasFreeAccess: boolean;
  proxyCountryCode?: string;
  canonicalCurrency?: string;
  retailer?: boolean;
  artistId: string;
  isHidden?: boolean;
  isPaused?: boolean;
}

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

let brandsCache: CacheEntry<Brand[]> | null = null;
let sourcesCache: CacheEntry<Source[]> | null = null;

function isFresh<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  return !!entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });

  if (res.status === 429) {
    const retryAfterHeader = res.headers.get("retry-after");
    const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : 5;
    const waitMs = Math.min(Math.max(retryAfterSec, 1), 30) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    const retryRes = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!retryRes.ok) {
      throw new Error(`Dropify API ${path} returned ${retryRes.status} after retrying a 429`);
    }
    return (await retryRes.json()) as T;
  }

  if (!res.ok) {
    throw new Error(`Dropify API ${path} returned ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function getBrands(): Promise<Brand[]> {
  if (isFresh(brandsCache)) return brandsCache.data;
  const data = await fetchJson<Brand[]>("/api/landing/brands");
  brandsCache = { data, fetchedAt: Date.now() };
  return data;
}

export async function getSources(): Promise<Source[]> {
  if (isFresh(sourcesCache)) return sourcesCache.data;
  const data = await fetchJson<Source[]>("/api/all-sources");
  sourcesCache = { data, fetchedAt: Date.now() };
  return data;
}

export function sourcesForBrand(brand: Brand, sources: Source[]): Source[] {
  return sources.filter((s) => s.artistId === brand._id);
}

export function brandUrl(slug: string): string {
  return `https://dropify.cloud/brand/${slug}?utm_source=mcp`;
}

export const REQUEST_URL = "https://dropify.cloud/request";
