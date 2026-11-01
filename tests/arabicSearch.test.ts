import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArabicSearchTerm, matchesArabicSearchAlias } from '../src/features/recipes/arabicSearch.ts';

test('normalizes common Arabic spelling variants', () => {
  assert.equal(normalizeArabicSearchTerm('محشى'), normalizeArabicSearchTerm('محشي'));
  assert.equal(normalizeArabicSearchTerm('ملوخية'), normalizeArabicSearchTerm('ملوخيه'));
  assert.equal(normalizeArabicSearchTerm('أرز'), normalizeArabicSearchTerm('ارز'));
});

test('matches Egyptian mahshi and cabbage colloquialisms', () => {
  const aliases = ['محشي', 'محشى', 'كرنب', 'ملفوف', 'ورق كرنب', 'ورق عنب'];
  for (const query of aliases) {
    assert.equal(aliases.some(alias => matchesArabicSearchAlias(query, alias)), true, query);
  }
  assert.equal(matchesArabicSearchAlias('عايز محشي كرنب النهارده', 'محشي'), true);
  assert.equal(matchesArabicSearchAlias('عايز ورق عنب النهارده', 'ورق عنب'), true);
  assert.equal(matchesArabicSearchAlias('ملفوف', 'كرنب'), false);
});

test('does not match partial text inside unrelated words', () => {
  assert.equal(matchesArabicSearchAlias('مكرونة', 'كرنب'), false);
});
