function normalize(s) {
    return s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}
function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (m === 0)
        return n;
    if (n === 0)
        return m;
    const prev = new Array(n + 1);
    const curr = new Array(n + 1);
    for (let j = 0; j <= n; j++)
        prev[j] = j;
    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
        }
        for (let j = 0; j <= n; j++)
            prev[j] = curr[j];
    }
    return prev[n];
}
function similarity(a, b) {
    if (a === b)
        return 1;
    const dist = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0)
        return 1;
    return 1 - dist / maxLen;
}
/**
 * Scores every brand against a query by name and slug, combining exact /
 * substring hits with edit-distance similarity so near-misses and typos
 * ("tayler swift") still surface a result.
 */
export function matchBrands(query, brands) {
    const q = normalize(query);
    if (!q)
        return [];
    const scored = brands.map((brand) => {
        const name = normalize(brand.name);
        const slug = normalize(brand.slug.replace(/-/g, " "));
        let score = 0;
        if (name === q || slug === q) {
            score = 1;
        }
        else if (name.includes(q) || q.includes(name) || slug.includes(q) || q.includes(slug)) {
            score = 0.85;
        }
        else {
            score = Math.max(similarity(q, name), similarity(q, slug));
        }
        return { brand, score };
    });
    return scored.sort((a, b) => b.score - a.score);
}
export const MATCH_THRESHOLD = 0.55;
