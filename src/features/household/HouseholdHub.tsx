import React, { useMemo, useState } from 'react';
import { inventoryRepository } from '../inventory/inventoryRepository';
import { getLowStockItems, getExpiringInventoryItems, type InventoryItem, type InventoryUnit } from '../inventory/inventoryModels';
import { householdTasksRepository } from './householdTaskRepository';
import { sortHouseholdTasks, type HouseholdTask } from './householdTaskModels';
import { savingsGoalsRepository } from '../savings/savingsRepository';
import { getSavingsProgress, type SavingsGoal } from '../savings/savingsModels';
import { financeTransactionsRepository } from '../finance/financeRepository';
import { createFinanceTransaction, summarizeMonthlyFinance, type FinanceTransaction } from '../finance/financeModels';

const units: InventoryUnit[] = ['قطعة', 'كيلو', 'جرام', 'لتر', 'عبوة', 'علبة', 'رغيف'];
const todayKey = () => new Date().toLocaleDateString('en-CA');

export function HouseholdHub() {
  const [items, setItems] = useState<InventoryItem[]>(() => inventoryRepository.read());
  const [tasks, setTasks] = useState<HouseholdTask[]>(() => sortHouseholdTasks(householdTasksRepository.read()));
  const [goals, setGoals] = useState<SavingsGoal[]>(() => savingsGoalsRepository.read());
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() => financeTransactionsRepository.read());
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemMin, setItemMin] = useState('1');
  const [itemExpiry, setItemExpiry] = useState('');
  const [itemUnit, setItemUnit] = useState<InventoryUnit>('قطعة');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [contributions, setContributions] = useState<Record<string, string>>({});
  const [financeType, setFinanceType] = useState<'income' | 'expense'>('expense');
  const [financeAmount, setFinanceAmount] = useState('');
  const [financeDescription, setFinanceDescription] = useState('');
  const [financeCategory, setFinanceCategory] = useState('عام');

  const persistItems = (next: InventoryItem[]) => { setItems(next); inventoryRepository.write(next); };
  const persistTasks = (next: HouseholdTask[]) => { setTasks(sortHouseholdTasks(next)); householdTasksRepository.write(next); };
  const persistGoals = (next: SavingsGoal[]) => { setGoals(next); savingsGoalsRepository.write(next); };
  const persistTransactions = (next: FinanceTransaction[]) => { setTransactions(next); financeTransactionsRepository.write(next); };
  const lowStock = useMemo(() => getLowStockItems(items), [items]);
  const expiring = useMemo(() => getExpiringInventoryItems(items, 7), [items]);
  const month = todayKey().slice(0, 7);
  const finance = useMemo(() => summarizeMonthlyFinance(transactions, month), [transactions, month]);

  const addItem = () => {
    const name = itemName.trim(), quantity = Number(itemQty), minimumQuantity = Number(itemMin);
    if (!name || !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(minimumQuantity) || minimumQuantity < 0) return;
    persistItems([...items, { id: crypto.randomUUID(), name, quantity, unit: itemUnit, minimumQuantity, updatedAt: new Date().toISOString(), expiresOn: itemExpiry || null }]);
    setItemName(''); setItemQty('1'); setItemMin('1'); setItemExpiry('');
  };
  const updateItem = (id: string, patch: Partial<InventoryItem>) => persistItems(items.map(item => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item));
  const addTask = () => {
    const title = taskTitle.trim();
    if (!title) return;
    persistTasks([...tasks, { id: crypto.randomUUID(), title, notes: '', dueDate: taskDue || null, completed: false, createdAt: new Date().toISOString() }]);
    setTaskTitle(''); setTaskDue('');
  };
  const addGoal = () => {
    const title = goalTitle.trim(), targetAmount = Number(goalTarget);
    if (!title || !Number.isFinite(targetAmount) || targetAmount <= 0) return;
    persistGoals([...goals, { id: crypto.randomUUID(), title, targetAmount, currentAmount: 0, targetDate: null, createdAt: new Date().toISOString() }]);
    setGoalTitle(''); setGoalTarget('');
  };
  const addContribution = (goal: SavingsGoal) => {
    const amount = Number(contributions[goal.id] || 0);
    if (!Number.isFinite(amount) || amount <= 0) return;
    persistGoals(goals.map(g => g.id === goal.id ? { ...g, currentAmount: g.currentAmount + amount } : g));
    setContributions(prev => ({ ...prev, [goal.id]: '' }));
  };
  const addTransaction = () => {
    const amount = Number(financeAmount), description = financeDescription.trim();
    if (!Number.isFinite(amount) || amount <= 0 || !description) return;
    persistTransactions([createFinanceTransaction({ type: financeType, amount, categoryId: financeCategory, description, date: todayKey() }), ...transactions]);
    setFinanceAmount(''); setFinanceDescription('');
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
        <h3 className="font-extrabold text-sm text-[#0D47A1]">إدارة البيت 🏠</h3>
        <p className="mt-1 text-[11px] text-gray-600">المخزون والميزانية والمهام وأهداف التوفير — محفوظة محليًا وتعمل بدون إنترنت.</p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-extrabold text-sm">مخزون البيت 🧺</h4>
          <span className="text-[10px] rounded-full bg-amber-50 px-2 py-1 text-amber-800">نواقص: {lowStock.length}</span>
        </div>
        {(lowStock.length > 0 || expiring.length > 0) && <div className="rounded-xl bg-amber-50 p-2 text-[11px] text-amber-900 space-y-1">
          {lowStock.length > 0 && <p>⚠️ أصناف وصلت للحد الأدنى: {lowStock.map(x => x.name).join('، ')}</p>}
          {expiring.length > 0 && <p>⏳ أصناف تنتهي خلال 7 أيام: {expiring.map(x => x.name).join('، ')}</p>}
        </div>}
        <div className="grid grid-cols-2 gap-2">
          <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="اسم الصنف" maxLength={60} className="rounded-xl border p-2 text-xs min-w-0" />
          <input value={itemQty} onChange={e => setItemQty(e.target.value)} type="number" min="0" step="0.1" placeholder="الكمية الحالية" className="rounded-xl border p-2 text-xs min-w-0" />
          <input value={itemMin} onChange={e => setItemMin(e.target.value)} type="number" min="0" step="0.1" placeholder="حد التنبيه" className="rounded-xl border p-2 text-xs min-w-0" />
          <select value={itemUnit} onChange={e => setItemUnit(e.target.value as InventoryUnit)} className="rounded-xl border p-2 text-xs">{units.map(unit => <option key={unit}>{unit}</option>)}</select>
          <label className="col-span-2 text-[11px] text-gray-600">تاريخ الصلاحية (اختياري)<input type="date" min={todayKey()} value={itemExpiry} onChange={e => setItemExpiry(e.target.value)} className="mt-1 block w-full rounded-xl border p-2 text-xs" /></label>
          <button type="button" onClick={addItem} className="col-span-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold p-2">إضافة للمخزون</button>
        </div>
        {items.length === 0 ? <p className="text-xs text-gray-500">لسه مفيش أصناف في المخزون.</p> : items.map(item => (
          <div key={item.id} className="border-t pt-2 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <strong>{item.name} <span className="font-normal text-gray-500">({item.quantity} {item.unit})</span></strong>
              <button type="button" onClick={() => persistItems(items.filter(x => x.id !== item.id))} className="text-red-600">حذف</button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-600">
              <label>الكمية <input aria-label={'كمية ' + item.name} type="number" min="0" step="0.1" value={item.quantity} onChange={e => updateItem(item.id, { quantity: Math.max(0, Number(e.target.value) || 0) })} className="w-16 rounded border p-1" /></label>
              <label>حد التنبيه <input aria-label={'حد التنبيه ' + item.name} type="number" min="0" step="0.1" value={item.minimumQuantity} onChange={e => updateItem(item.id, { minimumQuantity: Math.max(0, Number(e.target.value) || 0) })} className="w-16 rounded border p-1" /></label>
              <label>الصلاحية <input aria-label={'صلاحية ' + item.name} type="date" min={todayKey()} value={item.expiresOn || ''} onChange={e => updateItem(item.id, { expiresOn: e.target.value || null })} className="rounded border p-1" /></label>
              {item.quantity <= item.minimumQuantity && <span className="font-bold text-amber-700">ناقص</span>}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-3 space-y-3">
        <h4 className="font-extrabold text-sm">الدخل والمصروفات 💳</h4>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="rounded-xl bg-emerald-50 p-2"><span>الدخل</span><strong className="block text-sm">{finance.income.toLocaleString('ar-EG')} ج.م</strong></div>
          <div className="rounded-xl bg-rose-50 p-2"><span>المصروف</span><strong className="block text-sm">{finance.expenses.toLocaleString('ar-EG')} ج.م</strong></div>
          <div className="rounded-xl bg-blue-50 p-2"><span>المتبقي</span><strong className="block text-sm">{finance.balance.toLocaleString('ar-EG')} ج.م</strong></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={financeType} onChange={e => setFinanceType(e.target.value as 'income' | 'expense')} className="rounded-xl border p-2 text-xs"><option value="expense">مصروف</option><option value="income">دخل</option></select>
          <select value={financeCategory} onChange={e => setFinanceCategory(e.target.value)} className="rounded-xl border p-2 text-xs"><option>عام</option><option>طعام</option><option>فواتير</option><option>مواصلات</option><option>تعليم</option><option>صحة</option><option>راتب</option><option>أخرى</option></select>
          <input type="number" min="0.01" step="0.01" value={financeAmount} onChange={e => setFinanceAmount(e.target.value)} placeholder="المبلغ بالجنيه" className="rounded-xl border p-2 text-xs min-w-0" />
          <input value={financeDescription} onChange={e => setFinanceDescription(e.target.value)} maxLength={80} placeholder="البيان" className="rounded-xl border p-2 text-xs min-w-0" />
        </div>
        <button type="button" onClick={addTransaction} className="w-full rounded-xl bg-[#0D47A1] p-2 text-xs font-bold text-white">تسجيل الحركة</button>
        {transactions.filter(t => t.date.startsWith(month)).slice(0, 8).map(t => <div key={t.id} className="flex items-center justify-between gap-2 border-t pt-2 text-xs">
          <span>{t.description} <span className="text-gray-400">({t.categoryId})</span></span>
          <span className={t.type === 'income' ? 'font-bold text-emerald-700' : 'font-bold text-rose-700'}>{t.type === 'income' ? '+' : '−'}{t.amount.toLocaleString('ar-EG')} ج.م</span>
          <button type="button" aria-label={'حذف ' + t.description} onClick={() => persistTransactions(transactions.filter(x => x.id !== t.id))} className="text-red-600">حذف</button>
        </div>)}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-3 space-y-3">
        <h4 className="font-extrabold text-sm">مهام البيت ✅</h4>
        <div className="grid grid-cols-2 gap-2">
          <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="مثال: ترتيب المطبخ" maxLength={100} className="min-w-0 rounded-xl border p-2 text-xs" />
          <input type="date" value={taskDue} min={todayKey()} onChange={e => setTaskDue(e.target.value)} className="rounded-xl border p-2 text-xs" aria-label="موعد المهمة" />
        </div>
        <button type="button" onClick={addTask} className="w-full rounded-xl bg-[#0D47A1] p-2 text-xs font-bold text-white">إضافة مهمة</button>
        {tasks.length === 0 ? <p className="text-xs text-gray-500">أضف أول مهمة للبيت.</p> : tasks.map(task => (
          <div key={task.id} className="flex items-center gap-2 border-t pt-2 text-xs">
            <input type="checkbox" checked={task.completed} onChange={e => persistTasks(tasks.map(t => t.id === task.id ? { ...t, completed: e.target.checked } : t))} />
            <span className={task.completed ? 'flex-1 text-gray-400 line-through' : 'flex-1'}>{task.title}<small className="block text-gray-400">{task.dueDate || 'بدون موعد'}</small></span>
            <button type="button" onClick={() => persistTasks(tasks.filter(t => t.id !== task.id))} className="text-red-600">حذف</button>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-3 space-y-3">
        <h4 className="font-extrabold text-sm">أهداف التوفير 🪙</h4>
        <div className="grid grid-cols-2 gap-2">
          <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="اسم الهدف" maxLength={70} className="rounded-xl border p-2 text-xs min-w-0" />
          <input value={goalTarget} onChange={e => setGoalTarget(e.target.value)} type="number" min="1" placeholder="المبلغ بالجنيه" className="rounded-xl border p-2 text-xs min-w-0" />
        </div>
        <button type="button" onClick={addGoal} className="w-full rounded-xl bg-[#0D47A1] p-2 text-xs font-bold text-white">إنشاء هدف توفير</button>
        {goals.length === 0 ? <p className="text-xs text-gray-500">حدد هدفًا مثل مصاريف المدرسة أو جهاز جديد.</p> : goals.map(goal => {
          const progress = getSavingsProgress(goal);
          return <div key={goal.id} className="space-y-2 border-t pt-2">
            <div className="flex justify-between gap-2 text-xs"><strong>{goal.title}</strong><span>{Math.round(progress.saved)} / {goal.targetAmount} ج.م ({progress.percentage}%)</span></div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: progress.percentage + '%' }} /></div>
            <div className="flex gap-2">
              <input type="number" min="1" value={contributions[goal.id] || ''} onChange={e => setContributions(prev => ({ ...prev, [goal.id]: e.target.value }))} placeholder="إضافة مبلغ" className="min-w-0 flex-1 rounded-xl border p-2 text-xs" />
              <button type="button" onClick={() => addContribution(goal)} className="rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white">ادخار</button>
              <button type="button" onClick={() => persistGoals(goals.filter(g => g.id !== goal.id))} className="text-xs text-red-600">حذف</button>
            </div>
          </div>;
        })}
      </section>
    </div>
  );
}
