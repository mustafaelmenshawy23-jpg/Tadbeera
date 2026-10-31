import React, { useEffect, useState } from 'react';
import { inventoryRepository } from '../inventory/inventoryRepository';
import { getLowStockItems, getExpiringInventoryItems, INVENTORY_UNITS, type InventoryItem, type InventoryUnit } from '../inventory/inventoryModels';
import { householdTasksRepository } from './householdTaskRepository';
import { sortHouseholdTasks, type HouseholdTask } from './householdTaskModels';
import { savingsGoalsRepository } from '../savings/savingsRepository';
import { getSavingsProgress, type SavingsGoal } from '../savings/savingsModels';
import { refreshInventoryAlerts } from '../../services/inventoryAlertService';

export function HouseholdHub() {
  const [items, setItems] = useState<InventoryItem[]>(() => inventoryRepository.read());
  const [tasks, setTasks] = useState<HouseholdTask[]>(() => sortHouseholdTasks(householdTasksRepository.read()));
  const [goals, setGoals] = useState<SavingsGoal[]>(() => savingsGoalsRepository.read());
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemUnit, setItemUnit] = useState<InventoryUnit>('قطعة');
  const [itemMinimum, setItemMinimum] = useState('1');
  const [itemExpiry, setItemExpiry] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [contributions, setContributions] = useState<Record<string, string>>({});

  const persistItems = (next: InventoryItem[]) => {
    setItems(next);
    inventoryRepository.write(next);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('tedbeera:inventory-updated'));
  };
  useEffect(() => { void refreshInventoryAlerts(items); }, [items]);
  const persistTasks = (next: HouseholdTask[]) => { setTasks(sortHouseholdTasks(next)); householdTasksRepository.write(next); };
  const persistGoals = (next: SavingsGoal[]) => { setGoals(next); savingsGoalsRepository.write(next); };

  const addItem = () => {
    const name = itemName.trim();
    const quantity = Number(itemQty);
    const minimumQuantity = Number(itemMinimum);
    if (!name || !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(minimumQuantity) || minimumQuantity < 0) return;
    persistItems([...items, { id: crypto.randomUUID(), name, quantity, unit: itemUnit, minimumQuantity, updatedAt: new Date().toISOString(), expiresOn: itemExpiry || null }]);
    setItemName(''); setItemQty('1'); setItemMinimum('1'); setItemExpiry('');
  };

  const addTask = () => {
    const title = taskTitle.trim();
    if (!title) return;
    persistTasks([...tasks, { id: crypto.randomUUID(), title, notes: '', dueDate: null, completed: false, createdAt: new Date().toISOString() }]);
    setTaskTitle('');
  };

  const addGoal = () => {
    const title = goalTitle.trim();
    const targetAmount = Number(goalTarget);
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

  return (
    <div className="space-y-4" dir="rtl">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
        <h3 className="font-extrabold text-sm text-[#0D47A1]">إدارة البيت 🏠</h3>
        <p className="mt-1 text-[11px] text-gray-600">المخزون والمهام وأهداف التوفير — محفوظة على جهازك وتعمل بدون إنترنت.</p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm">مخزون البيت 🧺</h4>
          <span className="text-[10px] rounded-full bg-amber-50 px-2 py-1 text-amber-800">نواقص: {getLowStockItems(items).length}</span>
        </div>
        {(getLowStockItems(items).length > 0 || getExpiringInventoryItems(items, 7).length > 0) && <div className="rounded-xl bg-amber-50 border border-amber-100 p-2 text-[11px] text-amber-900">
          {getLowStockItems(items).length > 0 && <p>⚠️ أصناف قربت تخلص: {getLowStockItems(items).map(item => item.name).join('، ')}</p>}
          {getExpiringInventoryItems(items, 7).length > 0 && <p className="mt-1">⏰ أصناف صلاحيتها خلال 7 أيام: {getExpiringInventoryItems(items, 7).map(item => item.name).join('، ')}</p>}
        </div>}
        <div className="grid grid-cols-2 gap-2">
          <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="اسم الصنف" maxLength={60} className="rounded-xl border p-2 text-xs min-w-0" />
          <input value={itemQty} onChange={e => setItemQty(e.target.value)} type="number" min="0" step="0.1" placeholder="الكمية" className="rounded-xl border p-2 text-xs min-w-0" />
          <select value={itemUnit} onChange={e => setItemUnit(e.target.value as InventoryUnit)} className="rounded-xl border p-2 text-xs">{INVENTORY_UNITS.map(unit => <option key={unit}>{unit}</option>)}</select>
          <input value={itemMinimum} onChange={e => setItemMinimum(e.target.value)} type="number" min="0" step="0.1" placeholder="حد التنبيه" className="rounded-xl border p-2 text-xs min-w-0" />
          <input value={itemExpiry} onChange={e => setItemExpiry(e.target.value)} type="date" aria-label="تاريخ الصلاحية" className="rounded-xl border p-2 text-xs min-w-0" />
          <button type="button" onClick={addItem} className="rounded-xl bg-[#0D47A1] text-white text-xs font-bold p-2">إضافة للمخزون</button>
        </div>
        {items.length === 0 ? <p className="text-xs text-gray-500">لسه مفيش أصناف في المخزون.</p> : items.map(item => (
          <div key={item.id} className="flex items-center justify-between gap-2 border-t pt-2 text-xs">
            <span className="font-bold">{item.name} <span className="font-normal text-gray-500">({item.quantity} {item.unit})</span></span>
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" aria-label={'تقليل ' + item.name} onClick={() => persistItems(items.map(x => x.id === item.id ? { ...x, quantity: Math.max(0, Math.round((x.quantity - 1) * 10) / 10), updatedAt: new Date().toISOString() } : x))} className="rounded bg-gray-100 px-2 py-1">−</button>
              <button type="button" aria-label={'زيادة ' + item.name} onClick={() => persistItems(items.map(x => x.id === item.id ? { ...x, quantity: Math.round((x.quantity + 1) * 10) / 10, updatedAt: new Date().toISOString() } : x))} className="rounded bg-gray-100 px-2 py-1">+</button>
              {item.quantity <= item.minimumQuantity && <span className="text-[10px] text-amber-700">قارب يخلص</span>}
              {item.expiresOn && <span className="text-[10px] text-orange-700">الصلاحية: {item.expiresOn}</span>}
              <button type="button" onClick={() => persistItems(items.filter(x => x.id !== item.id))} className="text-red-600">حذف</button>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-3 space-y-3">
        <h4 className="font-extrabold text-sm">مهام البيت ✅</h4>
        <div className="flex gap-2">
          <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="مثال: ترتيب المطبخ" maxLength={100} className="min-w-0 flex-1 rounded-xl border p-2 text-xs" />
          <button type="button" onClick={addTask} className="rounded-xl bg-[#0D47A1] px-3 text-xs font-bold text-white">إضافة</button>
        </div>
        {tasks.length === 0 ? <p className="text-xs text-gray-500">أضف أول مهمة للبيت.</p> : tasks.map(task => (
          <div key={task.id} className="flex items-center gap-2 border-t pt-2 text-xs">
            <input type="checkbox" checked={task.completed} onChange={e => persistTasks(tasks.map(t => t.id === task.id ? { ...t, completed: e.target.checked } : t))} />
            <span className={task.completed ? 'flex-1 text-gray-400 line-through' : 'flex-1'}>{task.title}</span>
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
