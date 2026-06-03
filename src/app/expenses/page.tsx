'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  TrendingDown, 
  Plus, 
  Trash2, 
  Cloud, 
  CloudOff, 
  Calendar, 
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  ShoppingBag,
  Sparkles,
  Edit3,
  X,
  AlertCircle,
  Home,
  Heart,
  GraduationCap,
  HelpCircle
} from 'lucide-react';
import { Expense } from '@/core/entities/Expense';
import { ExportService } from '@/utils/export';
import { useSyncStore } from '@/store/useSyncStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useAlertStore } from '@/store/useAlertStore';
import { translations } from '@/lib/translations';
import { initOfflineDB } from '@/lib/offlineDb';
import { formatCurrencyValue } from '@/utils/currency';

const expenseSchema = z.object({
  description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres / Description must be at least 3 characters'),
  amount: z.number().positive('El monto debe ser mayor a cero / Amount must be greater than zero'),
  category: z.string().min(1, 'Selecciona una categoría / Select a category'),
  date: z.string().min(1, 'Selecciona una fecha / Select a date'),
  paymentMethod: z.string().min(1, 'Selecciona un método de pago / Select a payment method'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'budgets'>('expenses');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [editableBudgets, setEditableBudgets] = useState<Record<string, number>>({});
  const [savingBudgets, setSavingBudgets] = useState(false);
  const isOnline = useSyncStore(state => state.isOnline);
  const { language } = useLanguageStore();
  const t = translations[language] || translations['es'];

  const { user } = useAuthStore();
  const searchQuery = useSearchStore(state => state.searchQuery);
  const isSearching = useSearchStore(state => state.isSearching);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Tarjeta',
      category: 'Alimentación',
    }
  });

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.success && data.profile) {
          const budgets = data.profile.categoryBudgets || {};
          setCategoryBudgets(budgets);
          setEditableBudgets(budgets);
        }
      } catch (err) {
        console.error('Error fetching profile budgets:', err);
      }
    }
    loadProfile();
  }, []);

  const handleInputChange = (categoryKey: string, value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    setEditableBudgets(prev => ({
      ...prev,
      [categoryKey]: numValue
    }));
  };

  const handleSaveBudgets = async () => {
    setSavingBudgets(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryBudgets: editableBudgets })
      });
      const data = await res.json();
      if (data.success && data.profile) {
        const budgets = data.profile.categoryBudgets || {};
        setCategoryBudgets(budgets);
        setEditableBudgets(budgets);
        alert(language === 'es' ? '¡Presupuestos guardados con éxito!' : 'Budgets saved successfully!');
      }
    } catch (err) {
      console.error('Error saving category budgets:', err);
      alert(language === 'es' ? 'Error al guardar los presupuestos' : 'Error saving budgets');
    } finally {
      setSavingBudgets(false);
    }
  };

  const getCategorySpentThisMonth = (category: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return expenses
      .filter(e => {
        const eDate = new Date(e.date);
        return e.category === category && 
               eDate.getFullYear() === currentYear && 
               eDate.getMonth() === currentMonth;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    const id = crypto.randomUUID();
    const newExpense: Expense = {
      id,
      userId: user?.id || 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6',
      description: data.description,
      amount: data.amount,
      category: data.category,
      date: data.date,
      paymentMethod: data.paymentMethod,
    };

    if (!isOnline) {
      // Offline-first IndexedDB storage
      try {
        const db = await initOfflineDB();
        await db.put('pending_expenses', newExpense);
        // Instantly update UI locally
        setExpenses(prev => [newExpense, ...prev]);
        reset();
        alert(t.noConnectionMsg);
      } catch (err) {
        console.error('Error saving pending expense to IDB:', err);
      }
    } else {
      // Normal online fetch request
      try {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newExpense),
        });
        const result = await res.json();
        if (result.success) {
          setExpenses(prev => [result.expense, ...prev]);
          reset();
          alert(language === 'es' ? '¡Gasto registrado con éxito!' : 'Expense registered successfully!');
        }
      } catch (err) {
        console.error('Error creating expense:', err);
      }
    }
  };

  const deleteExpense = async (id: string) => {
    const confirmed = await useAlertStore.getState().showConfirm(t.confirmDelete);
    if (!confirmed) return;
    try {
      if (!isOnline) {
        const db = await initOfflineDB();
        await db.delete('pending_expenses', id);
        setExpenses(prev => prev.filter(e => e.id !== id));
        return;
      }

      // Online API request
      await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const filteredExpenses = expenses.filter(e => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const amountStr = `$${e.amount.toFixed(2)}`;
    const categoryName = (e.category === 'Alimentación' || e.category === 'Food' ? t.alimentacion :
                           e.category === 'Transporte' || e.category === 'Transport' ? t.transporte :
                           e.category === 'Ocio' || e.category === 'Leisure' ? t.ocio :
                           e.category === 'Vivienda' || e.category === 'Housing' ? t.vivienda :
                           e.category === 'Salud' || e.category === 'Health' ? t.salud :
                           e.category === 'Educación' || e.category === 'Education' ? t.educacion : t.otros).toLowerCase();

    return e.description.toLowerCase().includes(query) ||
           e.category.toLowerCase().includes(query) ||
           categoryName.includes(query) ||
           e.date.toLowerCase().includes(query) ||
           amountStr.includes(query) ||
           e.amount.toString().includes(query);
  });

  const handleExportPDF = () => {
    const title = language === 'es' ? 'Historial de Gastos' : 'Expenses History';
    const headers = [
      language === 'es' ? 'Fecha' : 'Date',
      language === 'es' ? 'Descripción' : 'Description',
      language === 'es' ? 'Categoría' : 'Category',
      language === 'es' ? 'Método de Pago' : 'Payment Method',
      language === 'es' ? 'Importe' : 'Amount'
    ];
    const rows = filteredExpenses.map(e => [
      e.date,
      e.description,
      e.category,
      e.paymentMethod,
      formatCurrencyValue(e.amount, user?.currency || 'EUR', language)
    ]);
    const totalLabel = language === 'es' ? 'TOTAL GASTADO:' : 'TOTAL SPENT:';
    const totalSum = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalValue = formatCurrencyValue(totalSum, user?.currency || 'EUR', language);
    
    ExportService.exportToPDF(title, headers, rows, 'fincontrol_gastos', totalLabel, totalValue);
    alert(language === 'es' ? 'Exportación a PDF realizada con éxito.' : 'PDF exported successfully.');
  };

  const handleExportExcel = () => {
    const headersMap = {
      date: language === 'es' ? 'Fecha' : 'Date',
      description: language === 'es' ? 'Descripción' : 'Description',
      category: language === 'es' ? 'Categoría' : 'Category',
      paymentMethod: language === 'es' ? 'Método de Pago' : 'Payment Method',
      amount: language === 'es' ? 'Importe' : 'Amount'
    };
    
    const formattedData = filteredExpenses.map(e => ({
      date: e.date,
      description: e.description,
      category: e.category,
      paymentMethod: e.paymentMethod,
      amount: formatCurrencyValue(e.amount, user?.currency || 'EUR', language)
    }));
    
    ExportService.exportToExcel(formattedData, headersMap, 'fincontrol_gastos');
    alert(language === 'es' ? 'Exportación a Excel realizada con éxito.' : 'Excel exported successfully.');
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const dailyAverage = expenses.length > 0 ? totalExpenses / 30 : 0;

  return (
    <div className="space-y-6">
      
      {/* Summary Card */}
      <section className="bg-card border border-border p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden min-h-[140px]">
        <div className="z-10">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{t.gastoTotal}</p>
          <h1 className="text-4xl font-black text-error">{formatCurrencyValue(totalExpenses, user?.currency || 'EUR', language)}</h1>
          <p className="text-xs mt-3 flex items-center gap-1.5 text-muted-foreground font-medium">
            <TrendingDown className="w-3.5 h-3.5 text-error" />
            <span>{t.gastosControlled}</span>
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-white/5 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-4 shrink-0 pb-1">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'expenses' 
              ? 'border-[var(--primary)] text-[var(--primary)]' 
              : 'border-transparent text-muted-foreground hover:text-[var(--foreground)]'
          }`}
        >
          {language === 'es' ? 'Gastos' : 'Expenses'}
        </button>
        <button
          onClick={() => setActiveTab('budgets')}
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'budgets' 
              ? 'border-[var(--primary)] text-[var(--primary)]' 
              : 'border-transparent text-muted-foreground hover:text-[var(--foreground)]'
          }`}
        >
          {language === 'es' ? 'Presupuestos por Categoría' : 'Category Budgets'}
        </button>
      </div>

      {activeTab === 'expenses' ? (
        <>
          {/* Main Grid Layout: Form vs History */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            
            {/* Registration Form */}
            <div className="xl:col-span-4 bg-card p-6 rounded-2xl shadow-sm border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-[var(--foreground)]">{t.registrarGasto}</h2>
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <span className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Cloud className="w-3 h-3" /> {t.connected}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-error/10 text-error px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                      <CloudOff className="w-3 h-3" /> {t.offline}
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">{t.descripcion}</label>
                  <input 
                    {...register('description')}
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                    placeholder={language === 'es' ? 'Ej: Compra Mercadona' : 'e.g., Grocery Shopping'} 
                    type="text"
                  />
                  {errors.description && <p className="text-xs text-error font-medium">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">{t.categoria}</label>
                    <select 
                      {...register('category')}
                      className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all cursor-pointer"
                    >
                      <option value="Alimentación">{t.alimentacion}</option>
                      <option value="Transporte">{t.transporte}</option>
                      <option value="Ocio">{t.ocio}</option>
                      <option value="Vivienda">{t.vivienda}</option>
                      <option value="Salud">{t.salud}</option>
                      <option value="Educación">{t.educacion}</option>
                      <option value="Otros">{t.otros}</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">{t.fecha}</label>
                    <input 
                      {...register('date')}
                      className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                      type="date"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">{t.importe}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                    <input 
                      {...register('amount', { valueAsNumber: true })}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all font-semibold" 
                      placeholder="0,00" 
                      step="0.01" 
                      type="number"
                    />
                  </div>
                  {errors.amount && <p className="text-xs text-error font-medium">{errors.amount.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">{t.metodoPago}</label>
                  <select 
                    {...register('paymentMethod')}
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all cursor-pointer"
                  >
                    <option value="Tarjeta">{t.tarjeta}</option>
                    <option value="Efectivo">{t.efectivo}</option>
                    <option value="Transferencia">{t.transferencia}</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full mt-4 bg-[var(--primary)] text-[var(--primary-foreground)] py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition-all active:scale-[0.98]"
                >
                  {t.guardarGasto}
                </button>
              </form>
            </div>

            {/* History Table */}
            <div className="xl:col-span-8 bg-card p-6 rounded-2xl shadow-sm border border-border space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-black text-[var(--foreground)]">{t.historialGastos}</h2>
                  <p className="text-xs text-muted-foreground font-medium">{language === 'es' ? 'Movimientos de salida registrados' : 'Recorded cash outflows'}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 shrink-0">
                  <button 
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted-foreground/10 text-muted-foreground rounded-full text-xs font-bold transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted-foreground/10 text-muted-foreground rounded-full text-xs font-bold transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Excel
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3">{t.fecha}</th>
                      <th className="pb-3">{t.descripcion}</th>
                      <th className="pb-3">{t.categoria}</th>
                      <th className="pb-3 text-right">{t.importe}</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {loading || isSearching ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                            <span>{language === 'es' ? 'Buscando gastos...' : 'Searching expenses...'}</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredExpenses.length > 0 ? (
                      filteredExpenses.map((e) => (
                        <tr key={e.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="py-4 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {e.date}
                          </td>
                          <td className="py-4 font-bold text-sm text-[var(--foreground)]">{e.description}</td>
                          <td className="py-4">
                            <span className="px-2.5 py-0.5 bg-error/10 text-error rounded-full text-xs font-bold">
                              {e.category === 'Alimentación' || e.category === 'Food' ? t.alimentacion :
                               e.category === 'Transporte' || e.category === 'Transport' ? t.transporte :
                               e.category === 'Ocio' || e.category === 'Leisure' ? t.ocio :
                               e.category === 'Vivienda' || e.category === 'Housing' ? t.vivienda :
                               e.category === 'Salud' || e.category === 'Health' ? t.salud :
                               e.category === 'Educación' || e.category === 'Education' ? t.educacion : t.otros}
                            </span>
                          </td>
                          <td className="py-4 text-right font-black text-error text-sm">
                            -{formatCurrencyValue(e.amount, user?.currency || 'EUR', language)}
                          </td>
                          <td className="py-4 text-right w-10">
                            <button 
                              onClick={() => deleteExpense(e.id)}
                              className="p-1.5 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-all active:scale-90"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground font-medium">
                          {searchQuery 
                            ? (language === 'es' ? 'No se encontraron gastos coincidentes' : 'No matching expenses found')
                            : t.noExpenses}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center text-xs text-muted-foreground font-medium pt-4 border-t border-border/60">
                <p>{language === 'es' ? `Mostrando ${filteredExpenses.length} gastos` : `Showing ${filteredExpenses.length} expenses`}</p>
                <div className="flex gap-2">
                  <button className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-30" disabled>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-30" disabled>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Insight (Bento style small cards) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
            <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4 shadow-sm relative group overflow-hidden">
              <div className="bg-error/10 p-3 rounded-full text-error shrink-0">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">{t.promedioDiario}</p>
                <p className="text-xl font-black">{formatCurrencyValue(dailyAverage, user?.currency || 'EUR', language)}</p>
              </div>
            </div>
          </section>
        </>
      ) : (
        /* Budgets Tab Manager */
        <section className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-black text-[var(--foreground)]">
              {language === 'es' ? 'Presupuestos por Categoría' : 'Category Budgets'}
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              {language === 'es' 
                ? 'Establece límites mensuales de gasto por categoría. Las barras cambiarán de color automáticamente (verde, ámbar o rojo) para advertirte del consumo.'
                : 'Set monthly category spending limits. Progress bars will automatically change color (green, amber, or red) to warn you.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { key: 'Alimentación', name: t.alimentacion, icon: ShoppingBag, color: 'text-rose-500 bg-rose-500/10' },
              { key: 'Transporte', name: t.transporte, icon: CreditCard, color: 'text-blue-500 bg-blue-500/10' },
              { key: 'Ocio', name: t.ocio || (language === 'es' ? 'Ocio' : 'Leisure'), icon: Sparkles, color: 'text-amber-500 bg-amber-500/10' },
              { key: 'Vivienda', name: t.vivienda, icon: Home, color: 'text-indigo-500 bg-indigo-500/10' },
              { key: 'Salud', name: t.salud, icon: Heart, color: 'text-emerald-500 bg-emerald-500/10' },
              { key: 'Educación', name: t.educacion, icon: GraduationCap, color: 'text-purple-500 bg-purple-500/10' },
              { key: 'Otros', name: t.otros, icon: HelpCircle, color: 'text-slate-500 bg-slate-500/10' }
            ].map(cat => {
              const IconComponent = cat.icon;
              const limit = categoryBudgets[cat.key] || 0;
              const spent = getCategorySpentThisMonth(cat.key);
              const progressPct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
              
              let barColor = 'bg-emerald-500';
              if (progressPct >= 90) barColor = 'bg-rose-500';
              else if (progressPct >= 70) barColor = 'bg-amber-500';

              const editValue = editableBudgets[cat.key] !== undefined && editableBudgets[cat.key] !== 0 ? editableBudgets[cat.key].toString() : '';

              return (
                <div key={cat.key} className="p-5 border border-border rounded-2xl bg-muted/10 space-y-4">
                  {/* Category Title + Input */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--foreground)]">{cat.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                          {language === 'es' ? 'Consumo actual' : 'Current spent'}
                        </p>
                      </div>
                    </div>

                    {/* Limit Input */}
                    <div className="flex items-center gap-1.5 max-w-[150px]">
                      <span className="text-[10px] text-muted-foreground font-bold">{user?.currency || 'EUR'}</span>
                      <input
                        type="number"
                        placeholder="Sin límite"
                        value={editValue}
                        onChange={(e) => handleInputChange(cat.key, e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-card focus:ring-1 focus:ring-[var(--primary)] outline-none text-xs font-bold text-right"
                      />
                    </div>
                  </div>

                  {/* Progress bar */}
                  {limit > 0 ? (
                    <div className="space-y-1.5">
                      <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${Math.min(100, progressPct)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-muted-foreground">
                          {formatCurrencyValue(spent, user?.currency || 'EUR', language)} / {formatCurrencyValue(limit, user?.currency || 'EUR', language)}
                        </span>
                        <span className={progressPct >= 90 ? 'text-rose-500' : progressPct >= 70 ? 'text-amber-500' : 'text-emerald-500'}>
                          {progressPct >= 100 
                            ? (language === 'es' ? `¡Límite superado! (${progressPct}%)` : `Limit exceeded! (${progressPct}%)`)
                            : `${progressPct}%`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground font-semibold bg-muted/20 py-2 px-3 rounded-lg flex items-center justify-between">
                      <span>{language === 'es' ? 'Sin límite mensual establecido' : 'No monthly limit set'}</span>
                      <span className="font-bold text-[var(--foreground)]">
                        {language === 'es' ? `Total gastado: ` : `Total spent: `}{formatCurrencyValue(spent, user?.currency || 'EUR', language)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-4 border-t border-border/40">
            <button
              onClick={handleSaveBudgets}
              disabled={savingBudgets}
              className="px-8 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {savingBudgets 
                ? (language === 'es' ? 'Guardando...' : 'Saving...')
                : (language === 'es' ? 'Guardar límites de presupuesto' : 'Save budget limits')}
            </button>
          </div>
        </section>
      )}

    </div>
  );
}
