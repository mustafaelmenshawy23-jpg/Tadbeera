import React, { useEffect, useState } from 'react';

type OnlineRecipe = {
  title: string;
  pageId: number;
  url: string;
  extract: string;
  imageUrl?: string;
  imageLicense?: string;
  imageCredit?: string;
};

const SAVED_KEY = 'tadbeera_online_recipes_v1';
const API = 'https://en.wikibooks.org/w/api.php';

function readSaved(): OnlineRecipe[] {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(value) ? value.filter(item => item && typeof item.title === 'string') : [];
  } catch {
    return [];
  }
}

export function OnlineRecipeSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OnlineRecipe[]>([]);
  const [selected, setSelected] = useState<OnlineRecipe | null>(null);
  const [saved, setSaved] = useState<OnlineRecipe[]>(readSaved);
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch { /* storage may be full */ }
  }, [saved]);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    if (!term || loading) return;
    setLoading(true);
    setError('');
    setSelected(null);
    setShowSaved(false);
    setResults([]);
    try {
      const searchUrl = new URL(API);
      searchUrl.search = new URLSearchParams({
        action: 'query', list: 'search', srsearch: term,
        srlimit: '12', format: 'json', origin: '*'
      }).toString();
      const searchResponse = await fetch(searchUrl.toString());
      if (!searchResponse.ok) throw new Error('search');
      const searchData = await searchResponse.json();
      const hits = (searchData.query?.search || []) as Array<{ title: string; pageid: number }>;
      if (!hits.length) {
        setError('ملقيناش وصفة مطابقة في كتب الطبخ المفتوحة. جرّب الاسم بالإنجليزي أو اسمًا أبسط.');
        return;
      }

      const pagesUrl = new URL(API);
      pagesUrl.search = new URLSearchParams({
        action: 'query', prop: 'extracts', explaintext: '1',
        exchars: '9000', pageids: hits.map(hit => String(hit.pageid)).join('|'),
        format: 'json', origin: '*'
      }).toString();
      const pagesResponse = await fetch(pagesUrl.toString());
      if (!pagesResponse.ok) throw new Error('pages');
      const pagesData = await pagesResponse.json();
      const pages = Object.values(pagesData.query?.pages || {}) as Array<{ pageid: number; title: string; extract?: string }>;
      const mapped = pages.map(page => ({
        title: page.title.replace(/^Cookbook:/i, '').replace(/_/g, ' '),
        pageId: page.pageid,
        url: 'https://en.wikibooks.org/wiki/' + encodeURIComponent(page.title.replace(/ /g, '_')),
        extract: (page.extract || '').trim()
      })).filter(page => page.extract.length > 0);

      if (!mapped.length) {
        setError('المصدر رجّع عناوين، لكن تفاصيل الوصفات غير متاحة حاليًا.');
        return;
      }
      setResults(mapped);
      setSelected(mapped[0]);

      // Wikimedia Commons is a free, community-maintained image source.
      try {
        const imageUrl = new URL('https://commons.wikimedia.org/w/api.php');
        imageUrl.search = new URLSearchParams({
          action: 'query', generator: 'search', gsrsearch: term + ' food dish',
          gsrnamespace: '6', gsrlimit: '1', prop: 'imageinfo',
          iiprop: 'url|extmetadata', iiurlwidth: '900', format: 'json', origin: '*'
        }).toString();
        const imageResponse = await fetch(imageUrl.toString());
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const imagePage = Object.values(imageData.query?.pages || {})[0] as any;
          const info = imagePage?.imageinfo?.[0];
          if (info?.thumburl) {
            const image = {
              imageUrl: info.thumburl,
              imageLicense: String(info.extmetadata?.LicenseShortName?.value || 'راجع صفحة الملف للترخيص'),
              imageCredit: String(info.extmetadata?.Artist?.value || 'Wikimedia Commons')
            };
            setResults(current => current.map(item => ({ ...item, ...image })));
            setSelected(current => current ? { ...current, ...image } : current);
          }
        }
      } catch { /* recipe text remains available if image lookup fails */ }
    } catch {
      setError('تعذر الاتصال بمصدر الوصفات المجاني. راجع الإنترنت وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = (recipe: OnlineRecipe) => {
    setSaved(current => current.some(item => item.pageId === recipe.pageId) ? current : [recipe, ...current]);
  };
  const removeSaved = (pageId: number) => setSaved(current => current.filter(item => item.pageId !== pageId));
  const currentItems = showSaved ? saved : results;

  return (
    <section dir="rtl" className="rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-gray-900">🌍 ابحث عن وصفة من العالم</h3>
          <p className="text-[10px] text-gray-500 mt-1">بحث مجاني في كتب الطبخ المفتوحة — بدون مفتاح API أو اشتراك</p>
        </div>
        <button type="button" onClick={() => { setShowSaved(value => !value); setSelected(null); }}
          className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
          {showSaved ? 'نتائج البحث' : 'المحفوظات'} ({saved.length})
        </button>
      </div>

      {!showSaved && (
        <form onSubmit={search} className="flex gap-2">
          <input value={query} onChange={event => setQuery(event.target.value)}
            placeholder="مثال: كبسة، ملوخية، sushi..." maxLength={80}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
          <button type="submit" disabled={loading || !query.trim()}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
            {loading ? 'جاري البحث…' : 'ابحث'}
          </button>
        </form>
      )}

      {error && <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">{error}</p>}

      {currentItems.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {currentItems.map(item => (
            <button key={item.pageId} type="button" onClick={() => setSelected(item)}
              className={`rounded-xl border p-3 text-right text-xs font-bold transition ${selected?.pageId === item.pageId ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
              {item.title}
              <span className="mt-1 block text-[10px] font-normal text-gray-500">من كتاب طبخ مفتوح</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <article className="overflow-hidden rounded-2xl border border-gray-200">
          {selected.imageUrl && <img src={selected.imageUrl} alt={selected.title} loading="lazy" className="max-h-56 w-full object-cover" />}
          <div className="space-y-3 p-3">
            <h4 className="text-base font-black text-gray-900">{selected.title}</h4>
            <p className="whitespace-pre-wrap break-words text-xs leading-7 text-gray-700">{selected.extract}</p>
            {selected.imageUrl && <p className="text-[9px] leading-5 text-gray-500">الصورة: {selected.imageCredit} — الترخيص الظاهر: {selected.imageLicense}. راجع صفحة الصورة قبل إعادة النشر.</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => saveRecipe(selected)}
                className="rounded-xl bg-amber-100 px-3 py-2 text-[11px] font-bold text-amber-900">
                {saved.some(item => item.pageId === selected.pageId) ? '✓ محفوظة' : '☆ احفظ الوصفة'}
              </button>
              {showSaved && <button type="button" onClick={() => removeSaved(selected.pageId)}
                className="rounded-xl bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">حذف من المحفوظات</button>}
              <a href={selected.url} target="_blank" rel="noreferrer"
                className="rounded-xl bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-800">المصدر الأصلي ↗</a>
            </div>
            <p className="text-[9px] leading-5 text-gray-400">المحتوى من Wikibooks (مرخّص غالبًا وفق CC BY-SA مع استثناءات موضحة في صفحة المصدر). قد تختلف طريقة عرض المقادير والخطوات حسب الصفحة؛ راجع المصدر للتفاصيل الدقيقة.</p>
          </div>
        </article>
      )}

      {!loading && showSaved && saved.length === 0 && <p className="rounded-xl bg-gray-50 p-4 text-center text-xs text-gray-500">لسه مفيش وصفات أونلاين محفوظة.</p>}
      {!loading && !showSaved && results.length === 0 && !error && <p className="text-[10px] leading-5 text-gray-400">اكتب اسم الأكلة بالعربي أو الإنجليزي. تغطية البحث حسب الوصفات المنشورة في المصدر المفتوح.</p>}
    </section>
  );
}
