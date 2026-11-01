import React, { useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ArrowRight, Mic, MicOff, Volume2, VolumeX, Search, Bookmark } from 'lucide-react';
import { normalizeArabicSearchTerm as normalize, matchesArabicSearchAlias } from './arabicSearch';
import { hasRecipeStructure, isRelevantRecipe } from './recipeValidation';

interface RecipeVoicePlugin {
  request(): Promise<{ granted: boolean }>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  speak(options: { text: string }): Promise<void>;
  stopSpeaking(): Promise<void>;
  addListener(eventName: 'speechResult', listener: (event: { transcript?: string }) => void): Promise<{ remove(): Promise<void> }>;
  addListener(eventName: 'speechError', listener: (event: { error?: string }) => void): Promise<{ remove(): Promise<void> }>;
  addListener(eventName: 'speechPlaybackStatus', listener: (event: { status?: string }) => void): Promise<{ remove(): Promise<void> }>;
}
const recipeVoice = registerPlugin<RecipeVoicePlugin>('MicrophonePermission');

type OnlineRecipe = {
  title: string;
  servings: number;
  pageId: number;
  url: string;
  extract: string;
  imageUrl?: string;
  imageLicense?: string;
  imageCredit?: string;
};

type MealDbMeal = {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
  strInstructions?: string;
  strSource?: string;
  [key: string]: string | undefined;
};

const SAVED_KEY = 'tadbeera_online_recipes_v1';
const MEAL_DB_API = 'https://www.themealdb.com/api/json/v1/1/search.php';
const WIKIBOOKS_API = 'https://en.wikibooks.org/w/api.php';

const ARABIC_ALIASES: Array<{ terms: string[]; english: string }> = [
  { terms: ['سمبوسك', 'سمبوسة', 'سمبوسه', 'سمبوسك باللحمة', 'سمبوسك بالجبنة'], english: 'samosa' },
  { terms: ['كبسة', 'كبسه', 'كبسة دجاج', 'كبسة فراخ'], english: 'kabsa' },
  { terms: ['كشري', 'كشرى'], english: 'koshari' },
  { terms: ['ملوخية', 'ملوخيه'], english: 'molokhia' },
  { terms: ['محشي', 'محشى', 'محشي كرنب', 'محشي ملفوف', 'كرنب', 'ملفوف', 'ورق كرنب', 'ورق ملفوف', 'ورق عنب', 'كوسة محشية', 'باذنجان محشي', 'فلفل محشي'], english: 'stuffed cabbage' },
  { terms: ['فتة', 'فته'], english: 'fatteh' },
  { terms: ['طعمية', 'فلافل'], english: 'falafel' },
  { terms: ['شكشوكة'], english: 'shakshuka' },
  { terms: ['برياني', 'بريانى'], english: 'biryani' },
  { terms: ['مكرونة بشاميل', 'بشاميل'], english: 'macaroni bechamel' },
  { terms: ['مسقعة'], english: 'moussaka' },
  { terms: ['شاورما'], english: 'shawarma' },
  { terms: ['بامية'], english: 'okra' },
];

const LOCAL_RECIPES: Array<{ terms: string[]; recipe: OnlineRecipe }> = [
  {
    terms: ['سمبوسك', 'سمبوسة', 'سمبوسه', 'samosa'],
    recipe: {
      title: 'سمبوسك مقرمش بحشوة اللحمة', servings: 4, pageId: 900010,
      url: 'https://www.themealdb.com/',
      extract: 'المكونات (تكفي 4 أفراد): 2 كوب دقيق، نصف كوب ماء دافئ تقريبًا، ملعقة كبيرة زيت، نصف ملعقة صغيرة ملح. للحشوة: 250 جم لحم مفروم، بصلة صغيرة مفرومة، ملح وفلفل وبهارات، ملعقة زيت.\n\nطريقة التحضير: اخلط الدقيق والملح والزيت، ثم أضف الماء تدريجيًا واعجن حتى تتكون عجينة ناعمة. غطّ العجينة واتركها ترتاح 20 دقيقة. شوّح البصل في الزيت ثم أضف اللحم والبهارات وقلّب حتى ينضج تمامًا واترك الحشوة تبرد. افرد العجينة وقطّعها دوائر أو شرائط، ضع مقدارًا من الحشوة واغلقها جيدًا. اقْلِ السمبوسك في زيت متوسط السخونة حتى يصبح ذهبيًا ومقرمشًا، ثم صفّه وقدّمه.'
    },
  },
  {
    terms: ['كبسة', 'kabsa'],
    recipe: {
      title: 'كبسة دجاج',
      servings: 4,
      pageId: 900001,
      url: 'https://www.themealdb.com/',
      extract: 'المكونات (تكفي 4 أفراد): دجاجة مقطعة، 2 كوب أرز بسمتي، بصلة مفرومة، 2 حبة طماطم، ملعقة معجون طماطم، 2 فص ثوم، لومي، ورق غار، قرفة، حبهان، بهارات كبسة، ملح وفلفل وزيت.\n\nالطريقة: شوّح البصل في الزيت حتى يذبل، ثم أضف الثوم والطماطم ومعجون الطماطم والبهارات. أضف الدجاج والماء واتركه حتى ينضج. ارفع الدجاج وحمّره حسب الرغبة، ثم أضف الأرز المغسول إلى المرق واضبط كمية السائل واتركه على نار هادئة حتى ينضج. قدّم الأرز مع الدجاج.',
    },
  },
  {
    terms: ['كشري', 'koshari', 'koshary'],
    recipe: {
      title: 'كشري مصري',
      servings: 4,
      pageId: 900002,
      url: 'https://www.themealdb.com/',
      extract: 'المكونات (4 أفراد): كوب أرز، كوب عدس بجبة، كوب مكرونة صغيرة، نصف كوب شعرية، حمص مسلوق، بصلتان، عصير طماطم، ثوم، خل، كمون، ملح وزيت.\n\nالطريقة: اسلق العدس حتى يقارب النضج، ثم أضف الأرز والشعرية المحمرة والماء والملح حتى ينضجوا. اسلق المكرونة والحمص. حضّر صلصة الطماطم بالثوم والخل والكمون، وحمّر البصل شرائح حتى يصبح مقرمشًا. قدّم الأرز والعدس ثم المكرونة والحمص والصلصة والبصل.',
    },
  },
  {
    terms: ['محشي', 'محشى', 'محشي كرنب', 'محشي ملفوف', 'كرنب', 'ملفوف', 'ورق كرنب', 'ورق ملفوف', 'stuffed cabbage'],
    recipe: {
      title: 'محشي كرنب وخضار مصري',
      servings: 4,
      pageId: 900007,
      url: 'https://www.themealdb.com/',
      extract: 'المكونات (تكفي 4 أفراد): كرنب متوسط، كوب ونصف أرز مصري مغسول، بصلة كبيرة مفرومة، 2 كوب عصير طماطم، ملعقة صلصة، حزمة شبت وبقدونس وكزبرة خضراء، 3 فصوص ثوم، ملح وفلفل وكمون وكسبرة ناشفة ونعناع ناشف، ملعقتان زيت أو سمن، وشوربة أو ماء ساخن. ويمكن استخدام نفس الخلطة للكوسة والباذنجان والفلفل وورق العنب.\\n\\nالطريقة: اسلق أوراق الكرنب في ماء مغلي حتى تلين ثم قطّعها قطعًا مناسبة. اخلط الأرز مع البصل والخضرة والثوم وعصير الطماطم والصلصة والتوابل والزيت. احشِ الأوراق بكمية مناسبة من الخلطة ولفّها دون إحكام شديد حتى يتمدد الأرز. رصّ المحشي في حلة، وأضف شوربة ساخنة حتى تقترب من تغطيته. اتركه يغلي ثم هدّئ النار حتى ينضج الأرز والكرنب. لا تملأ الورق أكثر من اللازم.'
    },
  },
  {
    terms: ['ورق عنب', 'محشي ورق عنب', 'دوالي', 'grape leaves'],
    recipe: {
      title: 'ورق عنب محشي',
      servings: 4,
      pageId: 900008,
      url: 'https://www.themealdb.com/',
      extract: 'المكونات (4 أفراد): نصف كيلو ورق عنب، كوب أرز مصري مغسول، بصلة مفرومة، 2 كوب عصير طماطم، شبت وبقدونس وكزبرة خضراء، عصير ليمونة، زيت، ملح وفلفل وكمون ونعناع ناشف.\\n\\nالطريقة: اسلق ورق العنب سريعًا حتى يلين. اخلط الأرز مع البصل والخضرة والطماطم والتوابل والزيت. ضع مقدارًا صغيرًا من الحشوة على كل ورقة واطوِ الجانبين ثم لفها. رصّ اللفائف في حلة، أضف شوربة أو ماءً ساخنًا وعصير الليمون، واتركها على نار هادئة حتى ينضج الأرز.'
    },
  },
  {
    terms: ['كوسة محشية', 'كوسه محشيه', 'باذنجان محشي', 'فلفل محشي', 'محشي كوسة', 'محشي باذنجان', 'stuffed zucchini'],
    recipe: {
      title: 'محشي كوسة وباذنجان وفلفل',
      servings: 4,
      pageId: 900009,
      url: 'https://www.themealdb.com/',
      extract: 'المكونات (4 أفراد): كيلو كوسة وباذنجان وفلفل مناسب للحشو، كوب ونصف أرز مصري، بصلة مفرومة، 2 كوب عصير طماطم، شبت وبقدونس وكزبرة خضراء، ثوم، ملح وفلفل وكمون وكسبرة ناشفة، زيت أو سمن، وشوربة ساخنة.\\n\\nالطريقة: اغسل الخضار وفرّغ الكوسة والباذنجان برفق مع ترك جدار مناسب، وجهّز الفلفل بإزالة البذور. اخلط الأرز مع البصل والخضرة والطماطم والثوم والتوابل والزيت. احشِ الخضار حتى ثلثيه فقط، ثم رصّه في حلة وأضف الشوربة الساخنة. اتركه يغلي ثم هدّئ النار حتى ينضج الأرز والخضار.'
    },
  },
  {
    terms: ['ملوخية', 'molokhia'],
    recipe: {
      title: 'ملوخية مصرية',
      servings: 4,
      pageId: 900003,
      url: 'https://www.themealdb.com/',
      extract: 'المكونات (4 أفراد): نصف كيلو ملوخية مفرومة، 4 أكواب شوربة دجاج أو لحم، 5 فصوص ثوم، ملعقة كزبرة ناشفة، ملعقة سمن، ملح.\n\nالطريقة: سخّن الشوربة حتى الغليان ثم أضف الملوخية وقلّب على نار هادئة دون تركها تغلي بقوة. حمّر الثوم والكزبرة في السمن حتى تظهر الرائحة، ثم أضف التقلية إلى الملوخية وقلّب وقدّمها ساخنة.',
    },
  },
  {
    terms: ['شكشوكة', 'shakshuka'],
    recipe: {
      title: 'شكشوكة بالبيض',
      servings: 2,
      pageId: 900004,
      url: 'https://www.themealdb.com/',
      extract: 'المكونات (2 أفراد): 4 بيضات، 2 طماطم، فلفلة، بصلة صغيرة، فص ثوم، ملح، فلفل، كمون وملعقة زيت.\n\nالطريقة: شوّح البصل والفلفل في الزيت، ثم أضف الثوم والطماطم والتوابل واترك الخليط حتى يتسبك. اصنع فراغات صغيرة واكسر البيض فيها، غطِّ المقلاة حتى ينضج البيض حسب الرغبة.',
    },
  },
  {
    terms: ['طعمية', 'فلافل', 'falafel'],
    recipe: {
      title: 'طعمية مصرية',
      servings: 4,
      pageId: 900005,
      url: 'https://www.themealdb.com/',
      extract: 'المكونات: 500 جم فول مدشوش منقوع، بصلة، حزمة بقدونس، حزمة كزبرة خضراء، شبت، 4 فصوص ثوم، كمون، كزبرة ناشفة، ملح وسمسم.\n\nالطريقة: صفِّ الفول وافرمه مع البصل والخضرة والثوم. أضف التوابل واخلط حتى تتماسك العجينة. شكّل أقراصًا، زيّن بالسمسم واقلِ في زيت ساخن حتى تصبح ذهبية. تُطهى جيدًا من الداخل.',
    },
  },
  {
    terms: ['مكرونة بشاميل', 'بشاميل', 'macaroni bechamel'],
    recipe: {
      title: 'مكرونة بالبشاميل',
      servings: 4,
      pageId: 900006,
      url: 'https://www.themealdb.com/',
      extract: 'المكونات (4 أفراد): نصف كيلو مكرونة قلم، 300 جم لحم مفروم، بصلة، 3 ملاعق دقيق، 3 ملاعق زبدة، 3 أكواب حليب، ملح وفلفل وجوزة الطيب.\n\nالطريقة: اسلق المكرونة نصف سلقة. شوّح البصل واللحم وتبّله. حضّر البشاميل بتحمير الدقيق في الزبدة ثم أضف الحليب تدريجيًا مع التقليب. ضع طبقة بشاميل ثم المكرونة واللحم وباقي البشاميل، واخبز حتى يحمر الوجه.',
    },
  },
];

function readSaved(): OnlineRecipe[] {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(value) ? value.filter(item => item && typeof item.title === 'string') : [];
  } catch {
    return [];
  }
}

function scaleArabicRecipeExtract(extract: string, baseServings: number, familySize: number): string {
  const ratio = Math.max(1, Math.min(30, Math.round(familySize))) / Math.max(1, baseServings);
  const splitAt = extract.indexOf('الطريقة:');
  const ingredients = splitAt >= 0 ? extract.slice(0, splitAt) : extract;
  const method = splitAt >= 0 ? extract.slice(splitAt) : '';
  const scaledIngredients = ingredients.replace(/\d+\/\d+|\d+(?:\.\d+)?(?:\s+\d+\/\d+)?/g, value => {
    const amount = value.trim().split(/\s+/).reduce((total, part) => {
      if (!part.includes('/')) return total + Number(part);
      const [numerator, denominator] = part.split('/').map(Number);
      return total + (denominator ? numerator / denominator : 0);
    }, 0);
    return String(Math.round(amount * ratio * 100) / 100);
  });
  return `${scaledIngredients}${method}`;
}

function hasArabic(value: string): boolean {
  const arabicLetters = (value.match(/[\u0600-\u06FF]/g) || []).length;
  const latinLetters = (value.match(/[A-Za-z]/g) || []).length;
  return arabicLetters > 0 && latinLetters <= Math.max(4, Math.floor(arabicLetters * 0.2));
}

function parseRecipeSections(extract: string, familySize: number, baseServings: number): { ingredients: string[]; steps: string[] } {
  const separator = extract.match(/طريقة التحضير\s*[:：]|الطريقة\s*[:：]/);
  const splitIndex = separator?.index ?? -1;
  const ingredientsText = splitIndex >= 0 ? extract.slice(0, splitIndex) : '';
  const methodText = splitIndex >= 0 ? extract.slice(splitIndex + separator![0].length) : extract;
  const ingredients = scaleArabicRecipeExtract(ingredientsText, baseServings, familySize)
    .replace(/^المكونات(?:\s*\([^)]*\))?\s*[:：]?/,'')
    .split(/[\n،,]+/)
    .map(item => item.replace(/^\s*[•*-]\s*/, '').trim())
    .filter(Boolean);
  const steps = methodText
    .split(/\n+|(?<=[.!؟])\s+/)
    .map(step => step.replace(/^\s*\d+[.)-]\s*/, '').trim())
    .filter(step => step.length > 2);
  return { ingredients, steps };
}

async function translateText(value: string, source: 'ar' | 'en', target: 'ar' | 'en'): Promise<string> {
  const text = value.trim();
  if (!text || source === target) return text;
  const sentences = text.match(/[^.!?。！？\n]+[.!?。！？\n]*/g) || [text];
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (current.length + sentence.length > 1200 && current) {
      chunks.push(current);
      current = sentence;
    } else current += sentence;
  }
  if (current) chunks.push(current);

  const translated: string[] = [];
  for (const chunk of chunks) {
    try {
      const url = new URL('https://translate.googleapis.com/translate_a/single');
      url.search = new URLSearchParams({ client: 'gtx', sl: source, tl: target, dt: 't', q: chunk }).toString();
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('translation-failed');
      const data = await response.json();
      const output = Array.isArray(data?.[0])
        ? data[0].map((part: unknown[]) => typeof part?.[0] === 'string' ? part[0] : '').join('')
        : '';
      if (!output.trim()) throw new Error('empty-translation');
      if (target === 'ar' && !hasArabic(output)) throw new Error('arabic-translation-unavailable');
      translated.push(output);
    } catch (error) {
      if (target === 'ar') throw error;
      translated.push(chunk);
    }
  }
  return translated.join('');
}

async function getEnglishSearchTerm(term: string): Promise<string> {
  const known = ARABIC_ALIASES.find(alias => alias.terms.some(item => matchesArabicSearchAlias(term, item)))?.english;
  return known || (hasArabic(term) ? await translateText(term, 'ar', 'en') : term);
}

export function scaleMeasure(measure: string, familySize: number, baseServings = 4): string {
  const match = measure.match(/^\s*(\d+\/\d+|\d+(?:\.\d+)?(?:\s+\d+\/\d+)?)(.*)$/);
  if (!match) return measure;
  const amount = match[1].trim().split(/\s+/).reduce((total, part) => {
    if (!part.includes('/')) return total + Number(part);
    const [numerator, denominator] = part.split('/').map(Number);
    return total + (denominator ? numerator / denominator : 0);
  }, 0);
  if (!Number.isFinite(amount) || amount <= 0) return measure;
  return (Math.round(amount * Math.max(1, Math.min(30, Math.round(familySize))) / baseServings * 100) / 100).toString() + ' ' + match[2].trim();
}

async function mapMeal(meal: MealDbMeal, familySize: number): Promise<OnlineRecipe> {
  const ingredients: string[] = [];
  for (let index = 1; index <= 20; index += 1) {
    const ingredient = meal[`strIngredient${index}`]?.trim();
    const measure = meal[`strMeasure${index}`]?.trim();
    if (ingredient) ingredients.push(`• ${ingredient}${measure ? ` — ${measure}` : ''}`);
  }
  const instructions = (meal.strInstructions || '').replace(/\r/g, '').trim();
  const rawExtract = `${ingredients.length ? `المكونات:\n${ingredients.join('\n')}\n\n` : ''}طريقة التحضير:\n${instructions || 'راجع صفحة المصدر للتعليمات.'}`;
  const [arabicTitle, arabicExtract] = await Promise.all([
    translateText(meal.strMeal, 'en', 'ar'),
    translateText(rawExtract, 'en', 'ar'),
  ]);
  if (!hasArabic(arabicTitle) || !hasArabic(arabicExtract)) throw new Error('تعذر تجهيز الوصفة باللغة العربية.');
  return {
    title: arabicTitle,
    servings: 4,
    pageId: Number(meal.idMeal),
    url: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
    imageUrl: meal.strMealThumb,
    imageCredit: 'TheMealDB',
    imageLicense: 'راجع مصدر الوصفة الأصلي وشروط استخدام الصورة',
    extract: arabicExtract || rawExtract,
  };
}

export function OnlineRecipeSearch({ familySize = 4, onBack }: { familySize?: number; onBack?: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OnlineRecipe[]>([]);
  const [selected, setSelected] = useState<OnlineRecipe | null>(null);
  const [saved, setSaved] = useState<OnlineRecipe[]>(readSaved);
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voiceListenersRef = useRef<Array<{ remove(): Promise<void> }>>([]);

  useEffect(() => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch { /* storage may be full */ }
  }, [saved]);

  const searchForTerm = async (rawTerm: string) => {
    const term = rawTerm.trim();
    if (!term || loading) return;
    setLoading(true);
    setError('');
    setSelected(null);
    setShowSaved(false);
    setResults([]);

    try {
      // Always try the online recipe services first. Bundled recipes remain a
      // fallback only when the online services return no suitable recipe.
      const englishTerm = await getEnglishSearchTerm(term);
      const mealUrl = new URL(MEAL_DB_API);
      mealUrl.searchParams.set('s', englishTerm);
      const mealResponse = await fetch(mealUrl.toString());
      if (!mealResponse.ok) throw new Error('meal-service');
      const mealData = await mealResponse.json();
      const meals = (Array.isArray(mealData.meals) ? mealData.meals : []) as MealDbMeal[];
      // The external API can return loose matches. Never show a result unless
      // its title or source text actually matches the requested dish.
      const relevantMeals = meals.filter(meal =>
        isRelevantRecipe(englishTerm, meal.strMeal || '', meal.strInstructions || '')
      );
      const mappedResults = await Promise.allSettled(relevantMeals.slice(0, 8).map(meal => mapMeal(meal, familySize)));
      let mapped: OnlineRecipe[] = mappedResults.flatMap(item =>
        item.status === 'fulfilled' ? [item.value] : [],
      );

      if (!mapped.length) {
        const localMatches = LOCAL_RECIPES.filter(item =>
          item.terms.some(alias => matchesArabicSearchAlias(term, alias) || matchesArabicSearchAlias(englishTerm, alias))
        ).map(item => ({ ...item.recipe }));
        mapped = localMatches;
      }

      if (!mapped.length) {
        const wikiUrl = new URL(WIKIBOOKS_API);
        wikiUrl.search = new URLSearchParams({
          action: 'query',
          list: 'search',
          srsearch: `"${englishTerm}" recipe OR cookbook`,
          srlimit: '8',
          format: 'json',
          origin: '*',
        }).toString();
        const wikiResponse = await fetch(wikiUrl.toString());
        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json();
          const hits = (wikiData.query?.search || []) as Array<{ title: string; pageid: number; snippet?: string }>;
          const recipeHits = hits.filter(hit =>
            /cookbook:/i.test(hit.title) &&
            isRelevantRecipe(englishTerm, hit.title, hit.snippet || '')
          );
          if (recipeHits.length) {
            const pageUrl = new URL(WIKIBOOKS_API);
            pageUrl.search = new URLSearchParams({
              action: 'query', prop: 'extracts', explaintext: '1', exchars: '7000',
              pageids: recipeHits.slice(0, 8).map(hit => String(hit.pageid)).join('|'),
              format: 'json', origin: '*',
            }).toString();
            const pageResponse = await fetch(pageUrl.toString());
            if (pageResponse.ok) {
              const pageData = await pageResponse.json();
              const wikiPages = (Object.values(pageData.query?.pages || {}) as Array<{ pageid: number; title: string; extract?: string }>)
                .filter(page => (page.extract || '').trim().length > 100 &&
                  isRelevantRecipe(englishTerm, page.title, page.extract || '') &&
                  /ingredient|ingredients|method|preheat|cook|bake|fry|mix|stir|serve/i.test(page.extract || '') &&
                  /ingredient|flour|salt|oil|water|onion|tomato|meat|chicken|egg|rice|sugar|milk/i.test(page.extract || '')
                );
              const translatedPages = await Promise.allSettled(wikiPages.map(async page => {
                const [title, extract] = await Promise.all([
                  translateText(page.title.replace(/^Cookbook:/i, '').replace(/_/g, ' '), 'en', 'ar'),
                  translateText((page.extract || '').trim(), 'en', 'ar'),
                ]);
                if (!hasArabic(title) || !hasArabic(extract)) throw new Error('تعذر ترجمة الوصفة إلى العربية.');
                return {
                  title,
                  servings: 4,
                  pageId: page.pageid,
                  url: `https://en.wikibooks.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
                  extract: `المقادير محسوبة لـ ${familySize} أفراد تقريبًا.\n\n${extract}`,
                };
              }));
              mapped = translatedPages.flatMap(item =>
                item.status === 'fulfilled' ? [item.value] : [],
              );
            }
          }
        }
      }

      if (!mapped.length) {
        setError('ملقيناش وصفة عربية مطابقة حاليًا. جرّب اسم أكلة تانية أو استخدم الوصفات المصرية الجاهزة. مش هنعرض وصفة بالإنجليزي.');
        return;
      }

      setResults(mapped);
      setSelected(mapped[0]);
    } catch {
      const fallbackLocalMatches = LOCAL_RECIPES.filter(item =>
        item.terms.some(alias => matchesArabicSearchAlias(term, alias))
      ).map(item => ({ ...item.recipe }));
      if (fallbackLocalMatches.length) {
        setResults(fallbackLocalMatches);
        setSelected(fallbackLocalMatches[0]);
      } else {
        setError('تعذر الاتصال بمكتبة الوصفات المجانية. تأكد من الإنترنت وحاول مرة أخرى؛ تقدر تستخدم الوصفات المحفوظة بدون اتصال.');
      }
    } finally {
      setLoading(false);
    }
  };

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    void searchForTerm(query);
  };

  const stopVoiceSearch = async () => {
    try {
      recognitionRef.current?.stop?.();
      recognitionRef.current = null;
      if (Capacitor.isNativePlatform()) await recipeVoice.stopListening();
    } catch { /* recognition may already have stopped */ }
    setVoiceListening(false);
  };

  const startVoiceSearch = async () => {
    if (voiceListening) {
      await stopVoiceSearch();
      return;
    }
    setVoiceMessage('');
    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await recipeVoice.request();
        if (!permission.granted) {
          setVoiceMessage('اسمح لتدبيرة باستخدام الميكروفون من إعدادات الجهاز ثم حاول مرة أخرى.');
          return;
        }
        voiceListenersRef.current.forEach(listener => { void listener.remove(); });
        voiceListenersRef.current = [];
        const resultListener = await recipeVoice.addListener('speechResult', event => {
          const transcript = (event.transcript || '').trim();
          setVoiceListening(false);
          if (!transcript) {
            setVoiceMessage('ملقطناش كلام واضح. اضغط على الميكروفون وجرب تاني.');
            return;
          }
          setQuery(transcript);
          setVoiceMessage(`سمعت: ${transcript}`);
          void searchForTerm(transcript);
        });
        const errorListener = await recipeVoice.addListener('speechError', event => {
          setVoiceListening(false);
          const reason = event.error === 'no-speech' ? 'ملقطناش صوت. اتكلم بوضوح وجرب تاني.' :
            event.error === 'network' ? 'خدمة التعرف على الكلام محتاجة إنترنت.' :
            event.error === 'not-allowed' ? 'إذن الميكروفون غير متاح. فعّله من إعدادات التطبيق.' :
            'تعذر تشغيل الميكروفون. تأكد من توفر خدمة التعرف على الكلام على جهازك.';
          setVoiceMessage(reason);
        });
        voiceListenersRef.current = [resultListener, errorListener];
        await recipeVoice.startListening();
        setVoiceListening(true);
        setVoiceMessage('بتسمعك دلوقتي… قول اسم الأكلة 🎙️');
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setVoiceMessage('البحث الصوتي غير مدعوم في المتصفح الحالي. استخدم الكتابة أو افتح التطبيق على جهاز يدعم التعرف على الكلام.');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        setVoiceListening(true);
        setVoiceMessage('بتسمعك دلوقتي… قول اسم الأكلة 🎙️');
      };
      recognition.onresult = (event: any) => {
        const transcript = (event.results?.[0]?.[0]?.transcript || '').trim();
        setVoiceListening(false);
        if (transcript) {
          setQuery(transcript);
          setVoiceMessage(`سمعت: ${transcript}`);
          void searchForTerm(transcript);
        } else {
          setVoiceMessage('ملقطناش كلام واضح. جرب تاني.');
        }
      };
      recognition.onerror = (event: any) => {
        setVoiceListening(false);
        setVoiceMessage(event.error === 'not-allowed' ? 'فعّل إذن الميكروفون من إعدادات الجهاز.' : 'تعذر سماع طلبك. حاول مرة أخرى.');
      };
      recognition.onend = () => setVoiceListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setVoiceListening(false);
      setVoiceMessage('مش قادرين نشغل الميكروفون دلوقتي. راجع الإذن وحاول تاني.');
    }
  };

  const stopRecipeSpeech = async () => {
    try {
      if (Capacitor.isNativePlatform()) await recipeVoice.stopSpeaking();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch { /* playback may already have stopped */ }
    setSpeaking(false);
  };

  const speakRecipe = async (recipe: OnlineRecipe) => {
    const sections = parseRecipeSections(recipe.extract, familySize, recipe.servings || 4);
    const spokenText = [
      recipe.title,
      `المقادير محسوبة لعدد ${familySize} أفراد`,
      'المكونات',
      ...sections.ingredients,
      'طريقة التحضير',
      ...sections.steps.map((step, index) => `الخطوة ${index + 1}. ${step}`),
    ].filter(Boolean).join('. ');
    try {
      if (Capacitor.isNativePlatform()) {
        await recipeVoice.speak({ text: spokenText });
        setSpeaking(true);
        return;
      }
      if (!('speechSynthesis' in window)) {
        setVoiceMessage('تشغيل الصوت غير مدعوم على هذا الجهاز.');
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = 'ar-EG';
      utterance.rate = 0.88;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => {
        setSpeaking(false);
        setVoiceMessage('تعذر تشغيل الصوت. تأكد من تثبيت صوت عربي على الجهاز.');
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeaking(false);
      setVoiceMessage('تعذر تشغيل الصوت العربي. تأكد من وجود محرك تحويل النص إلى كلام وصوت عربي على الجهاز.');
    }
  };

  useEffect(() => {
    let playbackListener: { remove(): Promise<void> } | undefined;
    if (Capacitor.isNativePlatform()) {
      void recipeVoice.addListener('speechPlaybackStatus', event => {
        if (event.status === 'completed' || event.status === 'stopped' || event.status === 'error') setSpeaking(false);
        if (event.status === 'speaking') setSpeaking(true);
      }).then(listener => { playbackListener = listener; });
    }
    return () => {
      try { recognitionRef.current?.stop?.(); } catch {}
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      voiceListenersRef.current.forEach(listener => { void listener.remove(); });
      if (playbackListener) void playbackListener.remove();
      if (Capacitor.isNativePlatform()) {
        void recipeVoice.stopListening();
        void recipeVoice.stopSpeaking();
      }
    };
  }, []);

  const saveRecipe = (recipe: OnlineRecipe) => {
    setSaved(current => current.some(item => item.pageId === recipe.pageId) ? current : [recipe, ...current]);
  };
  const removeSaved = (pageId: number) => setSaved(current => current.filter(item => item.pageId !== pageId));
  const currentItems = showSaved ? saved : results;

  return (
    <section dir="rtl" className="min-h-full space-y-3" aria-label="البحث الصوتي عن الوصفات أونلاين">
      <div className="flex items-center gap-2">
        {onBack && <button type="button" onClick={onBack} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700"><ArrowRight className="h-4 w-4" /> رجوع</button>}
        <div className="min-w-0 flex-1 rounded-2xl bg-gradient-to-l from-[#EEF6EC] to-white p-3">
          <h3 className="text-base font-black text-gray-900">مساعد الوصفات الصوتي 🎙️</h3>
          <p className="mt-1 text-[11px] leading-5 text-gray-600">ابحث بالكلام أو الكتابة، واسمع المكونات وطريقة التحضير بالعربي.</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-gray-500">لأسرة من {familySize} أفراد</span>
        <button type="button" onClick={() => { setShowSaved(value => !value); setSelected(null); }}
          className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
          {showSaved ? 'نتائج البحث' : 'المحفوظات'} ({saved.length})
        </button>
      </div>

      {!showSaved && (
        <form onSubmit={search} className="flex gap-2">
          <input value={query} onChange={event => setQuery(event.target.value)}
            placeholder="قول أو اكتب اسم الأكلة..." maxLength={80}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-emerald-500" />
          <button type="button" onClick={() => void startVoiceSearch()} disabled={loading}
            aria-label={voiceListening ? 'إيقاف الاستماع' : 'البحث بالصوت'}
            className={`rounded-xl px-3 py-2 text-white disabled:opacity-50 ${voiceListening ? 'bg-red-600' : 'bg-[#667B58]'}`}>
            {voiceListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button type="submit" disabled={loading || !query.trim()}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
            {loading ? 'جاري البحث…' : <><Search className="inline h-4 w-4 ml-1" /> ابحث</>}
          </button>
        </form>
      )}

      {voiceMessage && <p role="status" className="rounded-xl bg-blue-50 p-3 text-xs leading-6 text-blue-900">{voiceMessage}</p>}
      {error && <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">{error}</p>}

      {currentItems.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {currentItems.map(item => (
            <button key={item.pageId} type="button" onClick={() => setSelected(item)}
              className={`rounded-xl border p-3 text-right text-xs font-bold transition ${selected?.pageId === item.pageId ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
              {item.title}
              <span className="mt-1 block text-[10px] font-normal text-gray-500">وصفة ومكونات وطريقة التحضير</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <article className="overflow-hidden rounded-2xl border border-gray-200">
          {selected.imageUrl && <img src={selected.imageUrl} alt={selected.title} loading="lazy" className="max-h-56 w-full object-cover" />}
          <div className="space-y-3 p-3">
            <h4 className="text-base font-black text-gray-900">{selected.title}</h4>
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800">المقادير محسوبة لـ {familySize} أفراد</p>
            {(() => {
              const sections = parseRecipeSections(selected.extract, familySize, selected.servings || 4);
              return <div className="space-y-3">
                {sections.ingredients.length > 0 && <section>
                  <h5 className="mb-1 text-base font-black text-gray-900">المكونات المطلوبة</h5>
                  <ul className="list-disc space-y-1 pr-5 text-sm leading-8 text-gray-800">{sections.ingredients.map((ingredient,index)=><li key={index}>{ingredient}</li>)}</ul>
                </section>}
                <section>
                  <h5 className="mb-1 text-base font-black text-gray-900">طريقة التحضير خطوة بخطوة</h5>
                  <ol className="list-decimal space-y-2 pr-5 text-sm leading-8 text-gray-800">{sections.steps.map((step,index)=><li key={index}>{step}</li>)}</ol>
                </section>
              </div>;
            })()}
            {selected.imageUrl && <p className="text-[9px] leading-5 text-gray-500">الصورة: {selected.imageCredit || 'TheMealDB'} — {selected.imageLicense || 'راجع المصدر الأصلي'}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void (speaking ? stopRecipeSpeech() : speakRecipe(selected))}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-[11px] font-bold text-white">
                {speaking ? <><VolumeX className="h-4 w-4" /> إيقاف الاستماع</> : <><Volume2 className="h-4 w-4" /> اسمع الوصفة</>}
              </button>
              <button type="button" onClick={() => saveRecipe(selected)}
                className="rounded-xl bg-amber-100 px-3 py-2 text-[11px] font-bold text-amber-900">
                {saved.some(item => item.pageId === selected.pageId) ? '✓ محفوظة' : '☆ احفظ الوصفة'}
              </button>
              {showSaved && <button type="button" onClick={() => removeSaved(selected.pageId)}
                className="rounded-xl bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">حذف من المحفوظات</button>}
              <a href={selected.url} target="_blank" rel="noreferrer"
                className="rounded-xl bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-800">المصدر الأصلي ↗</a>
            </div>
          </div>
        </article>
      )}

      {!loading && showSaved && saved.length === 0 && <p className="rounded-xl bg-gray-50 p-4 text-center text-xs text-gray-500">لسه مفيش وصفات أونلاين محفوظة.</p>}
      {!loading && !showSaved && results.length === 0 && !error && <p className="text-[10px] leading-5 text-gray-400">اكتب اسم الأكلة بالعربي أو الإنجليزي، وهندور في مكتبة الوصفات المجانية.</p>}
    </section>
  );
}
