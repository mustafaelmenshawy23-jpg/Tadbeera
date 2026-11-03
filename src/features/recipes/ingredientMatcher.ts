import type { Recipe } from '../../data/seedData';

const ALIASES: Record<string, string> = {
  'ارز': 'ارز', 'رز': 'ارز',
  'بتنجان': 'باذنجان', 'باذنجان': 'باذنجان',
  'فراخ': 'دجاج', 'دجاج': 'دجاج',
  'لحمه': 'لحم', 'لحمه مفرومه': 'لحم مفروم',
  'فلفل رومي': 'فلفل', 'فلفل اخضر': 'فلفل',
  'مكرونه': 'مكرونه',
};

export function normalizeIngredient(value: string): string {
  const normalized = value
    .toLocaleLowerCase('ar')
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/[()،,.:؛]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return ALIASES[normalized] || normalized;
}

export interface RecipeMatch {
  recipe: Recipe;
  matchedIngredients: string[];
  missingIngredients: string[];
  matchedCount: number;
  totalCount: number;
  percentage: number;
}

export function findRecipesByIngredients(recipes: Recipe[], availableIngredients: string[]): RecipeMatch[] {
  const available = new Set(availableIngredients.map(normalizeIngredient).filter(Boolean));
  if (!available.size) return [];

  return recipes.map(recipe => {
    const matchedIngredients: string[] = [];
    const missingIngredients: string[] = [];
    for (const ingredient of recipe.ingredients) {
      const key = normalizeIngredient(ingredient.name);
      (available.has(key) ? matchedIngredients : missingIngredients).push(ingredient.name);
    }
    const totalCount = recipe.ingredients.length;
    const matchedCount = matchedIngredients.length;
    return {
      recipe, matchedIngredients, missingIngredients, matchedCount, totalCount,
      percentage: totalCount ? Math.round((matchedCount / totalCount) * 100) : 0,
    };
  })
    .filter(match => match.matchedCount > 0)
    .sort((a, b) => b.percentage - a.percentage || b.matchedCount - a.matchedCount || a.recipe.prepTimeMinutes - b.recipe.prepTimeMinutes || a.recipe.name.localeCompare(b.recipe.name, 'ar'));
}
