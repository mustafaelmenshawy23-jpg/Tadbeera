import React, { useState } from 'react';

type Meal = {
  idMeal: string; strMeal: string; strMealThumb?: string; strInstructions?: string;
  strSource?: string; [key: string]: string | undefined;
};
type Result = { id: string; title: string; image?: string; ingredients: string[]; isLocal?: boolean; matched: number; total: number; missing: string[]; instructions: string; url: string };

const API = 'https://www.themealdb.com/api/json/v1/1';
const INGREDIENTS: Record<string, string> = {
  'رز':'rice','ارز':'rice','مكرونة':'pasta','بتنجان':'aubergine','باذنجان':'aubergine',
  'بطاطس':'potatoes','بصل':'onion','طماطم':'tomato','ثوم':'garlic','بيض':'eggs',
  'فراخ':'chicken','دجاج':'chicken','لحمة':'beef','لحم':'beef','سمك':'fish',
  'فلفل':'pepper','جزر':'carrots','كوسة':'courgette','عدس':'lentils','حمص':'chickpeas',
  'فول':'broad beans','سبانخ':'spinach','جبنة':'cheese','لبن':'milk'
};
const normalize = (s: string) => s.toLocaleLowerCase('ar').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/[\u064B-\u065F]/g,'').trim();
const local = [
  { name:'مسقعة مصرية', terms:['بتنجان','باذنجان','طماطم','بصل','ثوم'], instructions:'قطّع البتنجان وحمّره أو اشوه. حضّر صلصة من البصل والثوم والطماطم، ثم رصّ البتنجان معها واتركه يتسبك.' },
  { name:'بطاطس بالصلصة', terms:['بطاطس','طماطم','بصل','ثوم'], instructions:'شوّح البصل والثوم، أضف الطماطم والتوابل ثم البطاطس والماء واتركها حتى تنضج.' },
  { name:'كشري مصري', terms:['رز','ارز','مكرونة','بصل','طماطم','عدس','حمص'], instructions:'اسلق العدس والأرز والمكرونة كلًّا على حدة. حضّر صلصة الطماطم وحمّر البصل وقدّم المكونات معًا.' },
  { name:'شكشوكة', terms:['بيض','طماطم','بصل','فلفل'], instructions:'شوّح البصل والفلفل، أضف الطماطم حتى تتسبك، ثم أضف البيض واتركه حتى ينضج.' },
  { name:'صينية بطاطس بالباذنجان', terms:['بطاطس','بتنجان','باذنجان','طماطم','بصل'], instructions:'قطّع الخضروات ورصّها في صينية مع عصير الطماطم والبصل والتوابل، ثم اخبزها حتى تنضج.' }
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
  const match = value.match(/^\s*(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)(.*)$/);
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
    try {
      const english = await Promise.all(availableIngredients.map(async name => {
        const key = normalize(name);
        return INGREDIENTS[key] || INGREDIENTS[name] || await translate(name);
      }));
      const ingredientLists = await Promise.all(english.map(async ingredient => {
        const response = await fetch(`${API}/filter.php?i=${encodeURIComponent(ingredient)}`);
        if (!response.ok) return [];
        const data = await response.json();
        return (Array.isArray(data.meals) ? data.meals : []) as Array<{idMeal:string;strMeal:string;strMealThumb?:string}>;
      }));
      const matchCounts = new Map<string, number>();
      ingredientLists.forEach(list => list.forEach(meal => {
        matchCounts.set(meal.idMeal, (matchCounts.get(meal.idMeal) || 0) + 1);
      }));
      const ids = [...matchCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([id]) => id);
      const details = await Promise.all(ids.map(async id => {
        const response = await fetch(`${API}/lookup.php?i=${id}`);
        if (!response.ok) return null;
        const data = await response.json();
        return (data.meals?.[0] || null) as Meal|null;
      }));
      const valid = details.filter((meal): meal is Meal => !!meal);
      const mappedResults = await Promise.allSettled(valid.map(async meal => {
        const mealIngredients = Array.from({length:20},(_,i)=>meal[`strIngredient${i+1}`]?.trim() || '').filter(Boolean);
        const normalizedMealIngredients = mealIngredients.map(normalize);
        const matched = ingredientLists.filter(list => list.some(entry => entry.idMeal === meal.idMeal)).length;
        const raw = meal.strInstructions || 'لا تتوفر طريقة التحضير في المصدر.';
        const rawIngredients = Array.from({length:20},(_,i) => {
          const name = meal[`strIngredient${i+1}`]?.trim() || '';
          const measure = meal[`strMeasure${i+1}`]?.trim() || '';
          return name ? `${scaleMeasure(measure, familySize)} ${name}`.trim() : '';
        }).filter(Boolean).join('\n');
        const [title,ingredientsText,instructions] = await Promise.all([
          translateToArabic(meal.strMeal),
          translateToArabic(rawIngredients),
          translateToArabic(raw),
        ]);
        return {id:meal.idMeal,title,image:meal.strMealThumb,ingredients:ingredientsText.split('\n').filter(Boolean),matched,total:availableIngredients.length,missing:[],instructions,url:meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`};
      }));
      const mapped = mappedResults
        .filter((item): item is PromiseFulfilledResult<Result> => item.status === 'fulfilled')
        .map(item => item.value);
      const localResults: Result[] = local.map((recipe,index)=> {
        const matched = availableIngredients.filter(name => recipe.terms.some(term => normalize(term) === normalize(name))).length;
        return {id:`local-${index}`,title:recipe.name,ingredients:recipe.terms,isLocal:true,matched,total:availableIngredients.length,missing:[],instructions:recipe.instructions,url:'https://www.themealdb.com/'};
      }).filter(item=>item.matched>0);
      const combined = [...mapped,...localResults].filter(item=>item.matched>0);
      const unique = Array.from(new Map(combined.map(item=>[item.title,item])).values())
        .sort((a,b)=>b.matched-a.matched);
      setResults(cuisine === 'egyptian' ? unique.filter(item=>/مصري|كشري|مسقعة|شكشوكة|بطاطس|صينية/i.test(item.title)) : unique);
      if (!unique.length) setError('ملقيناش وصفات مناسبة للمكونات دي في المصادر المتاحة. جرّب إضافة مكونات تانية.');
    } catch {
      const fallback = local.map((recipe,index)=> {
        const matched = availableIngredients.filter(name => recipe.terms.some(term => normalize(term) === normalize(name))).length;
        return {id:`local-${index}`,title:recipe.name,ingredients:[],matched,total:availableIngredients.length,missing:[],instructions:recipe.instructions,url:'https://www.themealdb.com/'};
      }).filter(item=>item.matched>0).sort((a,b)=>b.matched-a.matched);
      setResults(fallback);
      if (!fallback.length) setError('تعذر الاتصال بمكتبة الوصفات. تحقق من الإنترنت وحاول مرة أخرى.');
    } finally { setLoading(false); }
  };

  return <section dir="rtl" className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-3">
    <div><h3 className="text-sm font-black text-emerald-900">🍲 اطبخ بالموجود عندك</h3>
      <p className="mt-1 text-[11px] text-gray-600">ابحث بالمكونات المتوفرة، والوصفات المترجمة بتظهر بالعربي مع مقادير مضبوطة لـ {familySize} أفراد.</p></div>
    <div className="flex flex-wrap gap-2 items-center">
      <button type="button" onClick={()=>setCuisine('all')} className={`rounded-lg px-3 py-2 text-xs font-bold ${cuisine==='all'?'bg-emerald-700 text-white':'bg-white text-gray-700 border'}`}>كل المطابخ</button>
      <button type="button" onClick={()=>setCuisine('egyptian')} className={`rounded-lg px-3 py-2 text-xs font-bold ${cuisine==='egyptian'?'bg-emerald-700 text-white':'bg-white text-gray-700 border'}`}>أكلات مصرية</button>
      <button type="button" disabled={!availableIngredients.length||loading} onClick={search} className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{loading?'جاري البحث أونلاين…':'دور بالمكونات دي'}</button>
    </div>
    <p className="text-[10px] text-gray-500">المكونات المختارة: {availableIngredients.join('، ') || 'اختار مكونات البيت أولاً'}</p>
    {error && <p role="status" className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">{error}</p>}
    {results.length>0 && <div className="space-y-2">{results.map(item=><button type="button" key={item.id} onClick={()=>setSelected(item)} className={`w-full rounded-xl border bg-white p-3 text-right ${selected?.id===item.id?'border-emerald-600':'border-gray-200'}`}>
      <span className="block text-xs font-bold text-gray-900">{item.title}</span><span className="mt-1 block text-[10px] text-emerald-700">مطابقة {item.matched} من {item.total} مكوّن مختار</span>
    </button>)}</div>}
    {selected && <article className="rounded-xl border bg-white p-3 space-y-2">
      {selected.image && <img src={selected.image} alt={selected.title} loading="lazy" className="max-h-48 w-full rounded-lg object-cover"/>}
      <h4 className="text-sm font-black">{selected.title}</h4>{selected.ingredients.length > 0 && <div className="space-y-1"><b className="text-xs">{selected.isLocal ? 'المكونات الأساسية' : `المكونات لـ ${familySize} أفراد`}</b><ul className="list-disc pr-5 text-xs leading-6">{selected.ingredients.map((item,index)=><li key={index}>{item}</li>)}</ul></div>}<b className="text-xs">طريقة التحضير</b><p className="whitespace-pre-wrap text-xs leading-6 text-gray-700">{selected.instructions}</p>
      <a href={selected.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700 underline">المصدر الأصلي</a>
    </article>}
  </section>;
}
