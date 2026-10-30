import { Sparkles } from 'lucide-react';
import type { ShoppingItem, ShoppingTotals } from '../../data/calculationUtils';

interface ShoppingTotalsSummaryProps {
  totals: ShoppingTotals;
  items: ShoppingItem[];
}

/** Displays priced and pending shopping totals without owning or mutating app state. */
export function ShoppingTotalsSummary({ totals, items }: ShoppingTotalsSummaryProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] text-gray-400 block">
            {totals.isFullyPriced ? 'إجمالي النواقص التقديري:' : 'مجموع تقديري جزئي (للأصناف المسعرة):'}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-[#0D47A1]">
              {totals.knownTotal} جنيه مصري
            </span>
            {!totals.isFullyPriced && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
                ⚠️ {totals.unpricedCount} بدون تسعير
              </span>
            )}
          </div>
          {!totals.isFullyPriced && (
            <p className="text-[10px] text-amber-700 mt-0.5">
              * المجموع النهائي غير مكتمل حتى تحديد أسعار الأصناف المتبقية.
            </p>
          )}
        </div>

        <div className="text-left">
          <span className="text-[10px] text-gray-400 block">المتبقي للشراء:</span>
          <span className="text-sm font-bold text-amber-700">
            {totals.pendingKnownTotal} ج.م
          </span>
        </div>
      </div>

      {items.length > 0 && items.every(item => item.isChecked) && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>🎉 شطبت كل طلباتك ووفرت صح!</span>
        </div>
      )}
    </>
  );
}
