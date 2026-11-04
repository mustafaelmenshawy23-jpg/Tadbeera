import React, { useState } from 'react';
import { RECIPES } from '../../data/seedData';

type Meal = {
  idMeal: string; strMeal: string; strMealThumb?: string; strInstructions?: string;
  strSource?: string; [key: string]: string | undefined;
};
type Result = {
  id: string; title: string; image?: string; ingredients: string[]; isLocal?: boolean;
  matched: number; total: number; selectedCount: number; missing: string[];
  instructions: string; url: string;
};

const API = 'https://www.themealdb.com/api/json/v1/1';
const normalize = (s: string) => s.toLocaleLowerCase('ar').normalize('NFD')
  .replace(/[\u064B-\u065F\u0300-\u036f]/g, '').replace(/[أإآ]/g, 'ا')
  .replace(/ة/g, 'ه').replace(/[ـ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const INGREDIENTS: Record<string, string> = {
  'رز':'rice','ارز':'rice','ارز ابيض':'rice','مكرونه':'pasta','مكرونة':'pasta',
  'بتنجان':'aubergine','باذنجان':'aubergine','بطاطس':'potatoes','بصل':'onion',
  'طماطم':'tomato','ثوم':'garlic','بيض':'eggs','فراخ':'chicken','دجاج':'chicken',
  'لحمه':'beef','لحمة':'beef','لحم':'beef','سمك':'fish','فلفل':'pepper',
  'فلفل رومي':'green pepper','جزر':'carrots','كوسه':'courgette','كوسة':'courgette',
  'عدس':'lentils','عدس اصفر':'red lentils','عدس بجبه':'brown lentils',
  'حمص':'chickpeas','فول':'broad beans','سبانخ':'spinach','جبنه':'cheese',
  'جبنة':'cheese','لبن':'milk','حليب':'milk','تونه':'tuna','تونة':'tuna',
  'عيش':'bread','خبز':'bread','ليمون':'lemon','زيت':'olive oil','سمن':'butter',
  'كريمه':'cream','كريمة':'cream','مشروم':'mushrooms','بسله':'peas','بسلة':'peas',
  'بواقي فراخ':'chicken','بواقي لحمه':'beef','بواقي لحمة':'beef','لحم مفروم':'beef',
  'فلفل اخضر':'green pepper','فلفل أخضر':'green pepper','عصير طماطم':'tomato',
  'عدس بجبة':'brown lentils','عدس بجبه':'brown lentils','عدس اصفر':'red lentils','عدس أصفر':'red lentils',
  'لبن كامل الدسم':'milk','حليب':'milk','جبنة قريش':'cheese','عيش بلدي':'bread',
  'زيت':'olive oil','زيت زيتون':'olive oil','سمنة':'butter','سمن':'butter'
};
const EN_ALIASES: Record<string,string> = {
  'chicken breast':'chicken','chicken thighs':'chicken','chicken legs':'chicken',
  'beef mince':'beef','ground beef':'beef','minced beef':'beef',
  'aubergine':'aubergine','eggplant':'aubergine','courgette':'courgette','zucchini':'courgette',
  'bell pepper':'green pepper','green peppers':'green pepper','red pepper':'pepper',
  'tomatoes':'tomato','onions':'onion','potato':'potatoes','eggs':'eggs',
  'garlic cloves':'garlic','plain flour':'flour','all purpose flour':'flour',
  'fresh milk':'milk','double cream':'cream','heavy cream':'cream'
};
const canonicalArabic = (value: string) => {
  const n = normalize(value);
  return INGREDIENTS[n] || n;
};

const buildLocalResults = (pantry: Set<string>, selectedCount: number): Result[] => RECIPES.map(recipe => {
  const names = recipe.ingredients.map(item => item.name);
  const terms = names.map(canonicalArabic);
  const matched = terms.filter(term => pantry.has(term)).length;
  const missing = names.filter((name,index) => !pantry.has(terms[index]));
  return {
    id: recipe.id,
    title: recipe.name,
    image: recipe.imageUrl,
    ingredients: recipe.ingredients.map(item => `${item.quantity} ${item.name}`),
    isLocal: true,
    matched,
    total: Math.max(1, names.length),
    selectedCount,
    missing,
    instructions: recipe.steps.join('\\n'),
    url: 'https://www.themealdb.com/'
  };
});
const canonicalEnglish = (value: string) => {
  const n = value.toLowerCase().replace(/[_-]/g,' ').replace(/\s+/g,' ').trim();
  return EN_ALIASES[n] || n;
};
const local = [
  { name:'مسقعة مصرية', terms:['باذنجان','طماطم','بصل','ثوم'], instructions:'قطّع الباذنجان وحمّره أو اشوه. حضّر صلصة من البصل والثوم والطماطم، ثم رصّ الباذنجان معها واتركه يتسبك.' },
  { name:'بطاطس بالصلصة', terms:['بطاطس','طماطم','بصل','ثوم'], instructions:'شوّح البصل والثوم، أضف الطماطم والتوابل ثم البطاطس والماء واتركها حتى تنضج.' },
  { name:'كشري مصري', terms:['أرز','مكرونة','بصل','طماطم','عدس بجبة','حمص'], instructions:'اسلق العدس والأرز والمكرونة كلًّا على حدة. حضّر صلصة الطماطم وحمّر البصل وقدّم المكونات معًا.' },
  { name:'شكشوكة', terms:['بيض','طماطم','بصل','فلفل رومي'], instructions:'شوّح البصل والفلفل، أضف الطماطم حتى تتسبك، ثم أضف البيض واتركه حتى ينضج.' },
  { name:'صينية بطاطس بالباذنجان', terms:['بطاطس','باذنجان','طماطم','بصل'], instructions:'قطّع الخضروات ورصّها في صينية مع عصير الطماطم والبصل والتوابل، ثم اخبزها حتى تنضج.' }
];

async function translate(value: string): Promise<string> {
  try {
    const url = new URL('https://translate.googleapis.com/translate_a/single');
    url.search = new URLSearchParams({client:'gtx',sl:'ar',tl:'en',dt:'t',q:value}).toString();
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('translation-failed');
    const data = await response.json();
    return Array.isArray(data?.[0]) ? data[0].map((part: unknown[]) => typeof part?.[0] === 'string' ? part[0] : '').join('') : value;
  } catch { return value; }
}

export function scaleMeasure(value: string, familySize: number, baseServings = 4): string {
  const match = value.match(/^\s*(\d+\/\d+|\d+(?:\.\d+)?(?:\s+\d+\/\d+)?)(.*)$/);
  if (!match) return value;
  const amount = match[1].trim().split(/\s+/).reduce((total, part) => {
    if (!part.includes('/')) return total + Number(part);
    const [numerator, denominator] = part.split('/').map(Number);
    return total + (denominator ? numerator / denominator : 0);
  }, 0);
  if (!Number.isFinite(amount) || amount <= 0) return value;
  return (Math.round(amount * Math.max(1, Math.min(30, Math.round(familySize))) / baseServings * 100) / 100).toString() + ' ' + match[2].trim();
}

async function translateToArabic(value: string): Promise<string> {
  if (!value.trim()) return '';
  try {
    const url = new URL('https://translate.googleapis.com/translate_a/single');
    url.search = new URLSearchParams({client:'gtx',sl:'en',tl:'ar',dt:'t',q:value.slice(0,4500)}).toString();
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('translation-failed');
    const data = await response.json();
    const translated = Array.isArray(data?.[0]) ? data[0].map((part: unknown[]) => typeof part?.[0] === 'string' ? part[0] : '').join('') : '';
    if (!translated.trim() || !/[\u0600-\u06FF]/.test(translated)) throw new Error('arabic-translation-unavailable');
    return translated;
  } catch { throw new Error('تعذر ترجمة الوصفة إلى العربية'); }
}

export function IngredientRecipeFinder({ availableIngredients, familySize = 4 }: { availableIngredients: string[]; familySize?: number }) {
  const [results,setResults] = useState<Result[]>([]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [cuisine,setCuisine] = useState<'all'|'egyptian'>('all');
  const [selected,setSelected] = useState<Result|null>(null);

  const search = async () => {
    if (!availableIngredients.length || loading) return;
    setLoading(true); setError(''); setSelected(null); setResults([]);
    const pantry = new Set(availableIngredients.map(canonicalArabic));
    try {
      const englishRaw = await Promise.all(availableIngredients.map(async name => {
        const known = INGREDIENTS[normalize(name)];
        return known || canonicalEnglish(await translate(name));
      }));
      const english = Array.from(new Set(englishRaw.map(canonicalEnglish)));
      const ingredientLists = await Promise.all(english.map(async ingredient => {
        const response = await fetch(`${API}/filter.php?i=${encodeURIComponent(ingredient)}`);
        if (!response.ok) return [];
        const data = await response.json();
        return (Array.isArray(data.meals) ? data.meals : []) as Array<{idMeal:string;strMeal:string;strMealThumb?:string}>;
      }));
      const candidateIds = new Set<string>();
      ingredientLists.forEach(list => list.forEach(meal => candidateIds.add(meal.idMeal)));
      const ids = [...candidateIds].slice(0, 60);
      const details = await Promise.all(ids.map(async id => {
        try {
          const response = await fetch(`${API}/lookup.php?i=${id}`);
          if (!response.ok) return null;
          const data = await response.json();
          return (data.meals?.[0] || null) as Meal|null;
        } catch { return null; }
      }));
      const valid = details.filter((meal): meal is Meal => !!meal);
      const mappedResults = await Promise.allSettled(valid.slice(0, 20).map(async meal => {
        const rawIngredients = Array.from({length:20},(_,i) => {
          const name = meal[`strIngredient${i+1}`]?.trim() || '';
          const measure = meal[`strMeasure${i+1}`]?.trim() || '';
          return name ? `${measure} ${name}`.trim() : '';
        }).filter(Boolean);
        const ingredientNames = Array.from({length:20},(_,i)=>meal[`strIngredient${i+1}`]?.trim() || '').filter(Boolean);
        const recipeSet = new Set(ingredientNames.map(canonicalEnglish));
        const matched = english.filter(item => recipeSet.has(canonicalEnglish(item))).length;
        const missing = ingredientNames.filter(item => !english.some(available => canonicalEnglish(available) === canonicalEnglish(item)));
        const [title,ingredientsText,instructions] = await Promise.all([
          translateToArabic(meal.strMeal),
          translateToArabic(rawIngredients.join('\n')),
          translateToArabic(meal.strInstructions || 'لا تتوفر طريقة التحضير في المصدر.')
        ]);
        return {
          id:meal.idMeal,title,image:meal.strMealThumb,ingredients:ingredientsText.split('\n').filter(Boolean),
          matched,total:ingredientNames.length,selectedCount:availableIngredients.length,missing:missing.map(item=>item),
          instructions,url:meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`
        } as Result;
      }));
      const mapped: Result[] = mappedResults.flatMap(item => item.status === 'fulfilled' ? [item.value] : []);
      const localResults = buildLocalResults(pantry, availableIngredients.length);
      const combined = [...localResults,...mapped];
      const unique = Array.from(new Map(combined.map(item=>[item.id,item])).values())
        .sort((a,b) => (b.matched/b.total)-(a.matched/a.total) || b.matched-a.matched || a.missing.length-b.missing.length);
      const filtered = cuisine === 'egyptian'
        ? unique.filter(item => item.isLocal || /مصري|كشري|مسقعة|شكشوكة|فول|طعمية|ملوخية|فتة|محشي|بسبوسة|كنافة|حواوشي/i.test(item.title))
        : unique;
      setResults(filtered);
      if (!filtered.length) setError('ملقيناش وصفات مناسبة في المصادر المتاحة. جرّب مكونات تانية أو اختار كل المطابخ.');
    } catch {
      const fallback = buildLocalResults(pantry, availableIngredients.length)
        .sort((a,b)=>(b.matched/b.total)-(a.matched/a.total)||b.matched-a.matched);
      setResults(fallback);
      setError('تعذر الاتصال بمكتبة الوصفات أونلاين؛ المعروض الآن وصفات تدبيرة المحلية فقط.');
    } finally { setLoading(false); }
  };

  return <section dir="rtl" className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-3">
    <div><h3 className="text-sm font-black text-emerald-900">🍲 اطبخ بالموجود عندك</h3>
      <p className="mt-1 text-[11px] text-gray-600">الوصفات مرتبة حسب نسبة المكونات المتوفرة عندك، من الأعلى للأقل، والمكونات الناقصة ظاهرة.</p></div>
    <div className="flex flex-wrap gap-2 items-center">
      <button type="button" onClick={()=>setCuisine('all')} className={`rounded-lg px-3 py-2 text-xs font-bold ${cuisine==='all'?'bg-emerald-700 text-white':'bg-white text-gray-700 border'}`}>كل المطابخ</button>
      <button type="button" onClick={()=>setCuisine('egyptian')} className={`rounded-lg px-3 py-2 text-xs font-bold ${cuisine==='egyptian'?'bg-emerald-700 text-white':'bg-white text-gray-700 border'}`}>أكلات مصرية</button>
      <button type="button" disabled={!availableIngredients.length||loading} onClick={search} className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{loading?'جاري البحث أونلاين…':'دور بالمكونات دي'}</button>
    </div>
    <p className="text-[10px] text-gray-500">المكونات المختارة: {availableIngredients.join('، ') || 'اختار مكونات البيت أولاً'}</p>
    {error && <p role="status" className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">{error}</p>}
    {results.length>0 && <div className="space-y-2">{results.map(item=><button type="button" key={item.id} onClick={()=>setSelected(item)} className={`w-full rounded-xl border bg-white p-3 text-right ${selected?.id===item.id?'border-emerald-600':'border-gray-200'}`}>
      <span className="block text-xs font-bold text-gray-900">{item.title}</span>
      <span className="mt-1 block text-[10px] text-emerald-700">متوفر {item.matched} من {item.total} مكوّن في الوصفة</span>
      {item.missing.length>0 && <span className="mt-1 block text-[10px] text-amber-700">الناقص: {item.missing.slice(0,5).join('، ')}{item.missing.length>5?'…':''}</span>}
    </button>)}</div>}
    {selected && <article className="rounded-xl border bg-white p-3 space-y-2">
      {selected.image && <img src={selected.image} alt={selected.title} loading="lazy" className="max-h-48 w-full rounded-lg object-cover"/>}
      <h4 className="text-sm font-black">{selected.title}</h4>
      <p className="text-xs text-emerald-700">المتوفر {selected.matched} من {selected.total} مكوّن أساسي</p>
      {selected.missing.length>0 && <p className="text-xs text-amber-700">المكونات الناقصة: {selected.missing.join('، ')}</p>}
      {selected.ingredients.length > 0 && <div className="space-y-1"><b className="text-xs">{selected.isLocal ? 'المكونات الأساسية' : `المكونات لـ ${familySize} أفراد`}</b><ul className="list-disc pr-5 text-xs leading-6">{selected.ingredients.map((item,index)=><li key={index}>{scaleMeasure(item, familySize)}</li>)}</ul></div>}
      <b className="text-xs">طريقة التحضير</b><p className="whitespace-pre-wrap text-xs leading-6 text-gray-700">{selected.instructions}</p>
      <a href={selected.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700 underline">المصدر الأصلي</a>
    </article>}
  </section>;
}
