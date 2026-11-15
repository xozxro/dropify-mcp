// Read-only client for Dropify's public API, with a 10 minute in-memory cache
// so repeated tool calls in one session don't hammer production.dropify.cloud.
const USER_AGENT = "dropify-mcp/1.0 (+https://dropify.cloud)";
const BASE_URL = "https://production.dropify.cloud";
const CACHE_TTL_MS = 10 * 60 * 1000;
let brandsCache = null;
let sourcesCache = null;
function isFresh(entry) {
    return !!entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}
async function fetchJson(path) {
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
        return (await retryRes.json());
    }
    if (!res.ok) {
        throw new Error(`Dropify API ${path} returned ${res.status}`);
    }
    return (await res.json());
}
export async function getBrands() {
    if (isFresh(brandsCache))
        return brandsCache.data;
    const data = await fetchJson("/api/landing/brands");
    brandsCache = { data, fetchedAt: Date.now() };
    return data;
}
export async function getSources() {
    if (isFresh(sourcesCache))
        return sourcesCache.data;
    const data = await fetchJson("/api/all-sources");
    sourcesCache = { data, fetchedAt: Date.now() };
    return data;
}
export function sourcesForBrand(brand, sources) {
    return sources.filter((s) => s.artistId === brand._id);
}
export function brandUrl(slug) {
    return `https://dropify.cloud/brand/${slug}?utm_source=mcp`;
}
export const REQUEST_URL = "https://dropify.cloud/request";
export const V1_BASE = "https://production.dropify.cloud/api/v1";
const V1_TIMEOUT_MS = 15_000;
export const INTERNAL_MESSAGE = "The request failed on our side, so try it again.";
// Carries the message from the API's `{ error: { code, message } }` body.
export class V1Error extends Error {
    status;
    code;
    constructor(status, code, message) {
        super(message);
        this.name = "V1Error";
        this.status = status;
        this.code = code;
    }
}
// The token is read per call so a changed environment applies without a restart.
export function readToken() {
    const token = (process.env.DROPIFY_TOKEN ?? "").trim();
    return token === "" ? null : token;
}
function v1Url(path, params) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined)
            query.set(key, String(value));
    }
    const qs = query.toString();
    return `${V1_BASE}${path}${qs ? `?${qs}` : ""}`;
}
function v1Request(url, token) {
    return fetch(url, {
        headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(V1_TIMEOUT_MS),
    });
}
async function toV1Error(res) {
    try {
        const body = (await res.json());
        const message = body?.error?.message;
        if (typeof message === "string" && message !== "") {
            const code = typeof body.error?.code === "string" ? body.error.code : "internal";
            return new V1Error(res.status, code, message);
        }
    }
    catch {
        // Body was not the v1 envelope.
    }
    return new V1Error(res.status, "internal", INTERNAL_MESSAGE);
}
// GET against REST v1 with the member token. One retry on 429, waiting the
// Retry-After seconds (default 1, capped at 30).
export async function v1Get(path, params = {}) {
    const token = readToken();
    if (!token)
        throw new V1Error(401, "missing_token", "No token set.");
    const url = v1Url(path, params);
    let res;
    try {
        res = await v1Request(url, token);
        if (res.status === 429) {
            const retryAfter = res.headers.get("retry-after");
            const parsed = retryAfter === null ? NaN : Number(retryAfter);
            const seconds = Number.isFinite(parsed) ? parsed : 1;
            await res.body?.cancel();
            await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(seconds, 0), 30) * 1000));
            res = await v1Request(url, token);
        }
    }
    catch {
        throw new V1Error(0, "internal", INTERNAL_MESSAGE);
    }
    if (!res.ok)
        throw await toV1Error(res);
    try {
        return await res.json();
    }
    catch {
        throw new V1Error(res.status, "internal", INTERNAL_MESSAGE);
    }
}
