/**
 * Reject search results that are not genuine recipes for the requested dish.
 * Matching is performed on source text before translation so unrelated
 * encyclopedia pages cannot become recipe cards after machine translation.
 */
function normalizeText(value: string): string {
  return value.toLocaleLowerCase().normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

function queryTokens(query: string): string[] {
  return normalizeText(query).split(' ').filter(token => token.length > 2);
}

export function isRelevantRecipe(query: string, title: string, extract = ''): boolean {
  const tokens = queryTokens(query);
  if (!tokens.length) return false;
  const titleText = normalizeText(title);
  const bodyText = normalizeText(extract);
  return tokens.some(token => titleText.includes(token) || bodyText.includes(token));
}

export function hasRecipeStructure(ingredients: string[], instructions: string): boolean {
  const usableIngredients = ingredients.filter(item => item.trim().length >= 2);
  const method = normalizeText(instructions);
  return usableIngredients.length >= 2 && method.length >= 80;
}
