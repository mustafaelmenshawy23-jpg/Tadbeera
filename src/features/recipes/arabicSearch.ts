/**
 * Shared Egyptian-Arabic query normalization for food and recipe search.
 * Keeps the original query for display; this form is only used for matching.
 */
export function normalizeArabicSearchTerm(value: string): string {
  return value
    .toLocaleLowerCase('ar')
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[ؤئ]/g, 'ء')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesArabicSearchAlias(query: string, alias: string): boolean {
  const normalizedQuery = normalizeArabicSearchTerm(query);
  const normalizedAlias = normalizeArabicSearchTerm(alias);
  if (!normalizedQuery || !normalizedAlias) return false;
  if (normalizedQuery === normalizedAlias) return true;
  // Support natural Egyptian phrases such as "عايز محشي كرنب" without
  // matching a short alias in the middle of an unrelated word.
  return ` ${normalizedQuery} `.includes(` ${normalizedAlias} `);
}
