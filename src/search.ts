import { getPathUrl } from "./core";

export interface SearchResult {
  /** Absolute URL of the matching page. */
  url: string;
  /** Path as recorded in the index, e.g. `/docs/install/`. */
  path: string;
  title: string;
  /** A snippet of body text around the first match, for display under the title. */
  excerpt: string;
  /** The heading the match sits under, when the match was found in one. */
  heading?: string;
  score: number;
}

interface IndexedPage {
  path: string;
  title: string;
  headings: string[];
  text: string;
}

/** Ignored when searching: too common to narrow anything down. */
const NOISE = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "how",
  "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "was", "what",
  "when", "where", "which", "with"
]);

const EXCERPT_RADIUS = 90;

let indexPromise: Promise<IndexedPage[]> | null = null;

const tokenize = (value: string) =>
  (value || "")
    .toLowerCase()
    .split(/[^a-z0-9._-]+/i)
    .filter(Boolean);

/**
 * Split a query into the terms worth matching.
 *
 * Noise words are dropped entirely. A query of nothing but noise ("the", "how
 * to") returns no terms, and so no results — every page matching is less useful
 * than an honest empty state.
 */
const queryTerms = (query: string) => tokenize(query).filter(t => !NOISE.has(t));

/**
 * Load the index the build wrote, once per page view.
 *
 * A failed fetch resolves to an empty index rather than rejecting, so a theme's
 * search box degrades to "no results" instead of breaking the page.
 */
export const loadSearchIndex = (): Promise<IndexedPage[]> => {
  if (!indexPromise) {
    indexPromise = fetch(getPathUrl("search-index.json"))
      .then(res => (res.ok ? res.json() : { items: [] }))
      .then(data => (Array.isArray(data?.items) ? data.items : []))
      .catch(() => []);
  }
  return indexPromise;
};

/** Whether this site was built with a search index. */
export const hasSearchIndex = async () => (await loadSearchIndex()).length > 0;

const countOccurrences = (haystack: string, needle: string) => {
  let count = 0;
  let from = 0;
  while (true) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    count++;
    from = at + needle.length;
  }
  return count;
};

const buildExcerpt = (text: string, term: string) => {
  const at = text.toLowerCase().indexOf(term);
  if (at === -1) return text.slice(0, EXCERPT_RADIUS * 2).trim();

  const start = Math.max(0, at - EXCERPT_RADIUS);
  const end = Math.min(text.length, at + term.length + EXCERPT_RADIUS);

  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
};

/**
 * Score one page against the query.
 *
 * Every term must appear somewhere, so results narrow as the user types instead
 * of widening. Where a term appears decides the weight: a title match is what
 * the reader is most likely looking for, then a heading, then the body.
 */
const scorePage = (page: IndexedPage, terms: string[]) => {
  const title = (page.title || "").toLowerCase();
  const headings = (page.headings || []).join(" ").toLowerCase();
  const text = (page.text || "").toLowerCase();

  let score = 0;
  let matchedHeading: string | undefined;

  for (const term of terms) {
    const inTitle = title.includes(term);
    const inHeading = headings.includes(term);
    const bodyHits = countOccurrences(text, term);

    if (!inTitle && !inHeading && !bodyHits) return null;

    if (title === term) score += 200;
    else if (inTitle) score += title.startsWith(term) ? 120 : 80;

    if (inHeading) {
      score += 40;
      matchedHeading =
        matchedHeading || (page.headings || []).find(h => h.toLowerCase().includes(term));
    }

    // Repetition signals relevance, but a long page should not win on length alone.
    score += Math.min(bodyHits, 5) * 4;
  }

  return { score, matchedHeading };
};

/**
 * Search the site.
 *
 * Results are ranked by where the query matched rather than by page order, and
 * carry an excerpt so a theme can show why a page matched.
 */
export const search = async (query: string, limit = 10): Promise<SearchResult[]> => {
  const terms = queryTerms(query);
  if (!terms.length) return [];

  const pages = await loadSearchIndex();
  const results: SearchResult[] = [];

  for (const page of pages) {
    const scored = scorePage(page, terms);
    if (!scored) continue;

    results.push({
      url: getPathUrl(page.path.replace(/^\//, "")),
      path: page.path,
      title: page.title,
      heading: scored.matchedHeading,
      excerpt: buildExcerpt(page.text || "", terms[0]),
      score: scored.score
    });
  }

  return results
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
};
