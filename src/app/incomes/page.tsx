'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Cloud, 
  CloudOff, 
  Calendar, 
  DollarSign, 
  ChevronLeft,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';
import { Income } from '@/core/entities/Income';
import { ExportService } from '@/utils/export';
import { useSyncStore } from '@/store/useSyncStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useAlertStore } from '@/store/useAlertStore';
import { translations } from '@/lib/translations';
import { initOfflineDB } from '@/lib/offlineDb';
import { formatCurrencyValue } from '@/utils/currency';

const incomeSchema = z.object({
  description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres / Description must be at least 3 characters'),
  amount: z.number().positive('El monto debe ser mayor a cero / Amount must be greater than zero'),
  category: z.string().min(1, 'Selecciona una categoría / Select a category'),
  date: z.string().min(1, 'Selecciona una fecha / Select a date'),
  paymentMethod: z.string().min(1, 'Selecciona un método de pago / Select a payment method'),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useSyncStore(state => state.isOnline);
  const { language } = useLanguageStore();
  const t = translations[language] || translations['es'];

  const { user } = useAuthStore();
  const searchQuery = useSearchStore(state => state.searchQuery);
  const isSearching = useSearchStore(state => state.isSearching);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Transferencia',
      category: 'Nómina',
    }
  });

  const fetchIncomes = async () => {
    try {
      const res = await fetch('/api/incomes');
      const data = await res.json();
      if (data.success) {
        setIncomes(data.incomes || []);
      }
    } catch (err) {
      console.error('Error fetching incomes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const onSubmit = async (data: IncomeFormValues) => {
    const id = crypto.randomUUID();
    const newIncome: Income = {
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
        await db.put('pending_incomes', newIncome);
        // Instantly update UI locally
        setIncomes(prev => [newIncome, ...prev]);
        reset();
        alert(t.noConnectionMsg);
      } catch (err) {
        console.error('Error saving pending income to IDB:', err);
      }
    } else {
      // Normal online fetch request
      try {
        const res = await fetch('/api/incomes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newIncome),
        });
        const result = await res.json();
        if (result.success) {
          setIncomes(prev => [result.income, ...prev]);
          reset();
          alert(language === 'es' ? '¡Ingreso registrado con éxito!' : 'Income registered successfully!');
        }
      } catch (err) {
        console.error('Error creating income:', err);
      }
    }
  };

  const deleteIncome = async (id: string) => {
    const confirmed = await useAlertStore.getState().showConfirm(t.confirmDelete);
    if (!confirmed) return;
    try {
      if (!isOnline) {
        const db = await initOfflineDB();
        await db.delete('pending_incomes', id);
        setIncomes(prev => prev.filter(i => i.id !== id));
        return;
      }

      // Online API request
      await fetch(`/api/incomes?id=${id}`, { method: 'DELETE' });
      setIncomes(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Error deleting income:', err);
    }
  };

  const filteredIncomes = incomes.filter(i => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const amountStr = `$${i.amount.toFixed(2)}`;
    const categoryName = (i.category === 'Nómina' || i.category === 'Salary' ? t.nomina :
                           i.category === 'Freelance' ? t.freelance :
                           i.category === 'Inversiones' || i.category === 'Investments' ? t.inversiones :
                           i.category === 'Regalo' || i.category === 'Gift' ? t.regalo : t.otros).toLowerCase();

    return i.description.toLowerCase().includes(query) ||
           i.category.toLowerCase().includes(query) ||
           categoryName.includes(query) ||
           i.date.toLowerCase().includes(query) ||
           amountStr.includes(query) ||
           i.amount.toString().includes(query);
  });

  const handleExportPDF = () => {
    const title = language === 'es' ? 'Historial de Ingresos' : 'Incomes History';
    const headers = [
      language === 'es' ? 'Fecha' : 'Date',
      language === 'es' ? 'Descripción' : 'Description',
      language === 'es' ? 'Categoría' : 'Category',
      language === 'es' ? 'Método de Pago' : 'Payment Method',
      language === 'es' ? 'Importe' : 'Amount'
    ];
    const rows = filteredIncomes.map(i => [
      i.date,
      i.description,
      i.category,
      i.paymentMethod,
      formatCurrencyValue(i.amount, user?.currency || 'EUR', language)
    ]);
    const totalLabel = language === 'es' ? 'TOTAL INGRESADO:' : 'TOTAL RECEIVED:';
    const totalSum = filteredIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalValue = formatCurrencyValue(totalSum, user?.currency || 'EUR', language);
    
    ExportService.exportToPDF(title, headers, rows, 'fincontrol_ingresos', totalLabel, totalValue);
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
    
    const formattedData = filteredIncomes.map(i => ({
      date: i.date,
      description: i.description,
      category: i.category,
      paymentMethod: i.paymentMethod,
      amount: formatCurrencyValue(i.amount, user?.currency || 'EUR', language)
    }));
    
    ExportService.exportToExcel(formattedData, headersMap, 'fincontrol_ingresos');
    alert(language === 'es' ? 'Exportación a Excel realizada con éxito.' : 'Excel exported successfully.');
  };

  const totalIncomes = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Summary Card */}
      <section className="bg-[var(--primary)] text-[var(--primary-foreground)] p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden min-h-[140px]">
        <div className="z-10">
          <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1.5">{t.ingresoTotal}</p>
          <h1 className="text-4xl font-black">{formatCurrencyValue(totalIncomes, user?.currency || 'EUR', language)}</h1>
          <p className="text-xs mt-3 flex items-center gap-1.5 opacity-80 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t.incomesControlled}</span>
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-white/5 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Main Grid Layout: Form vs History */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Registration Form */}
        <div className="xl:col-span-4 bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-[var(--foreground)]">{t.registrarIngreso}</h2>
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
                placeholder={language === 'es' ? 'Ej: Nómina Mensual' : 'e.g., Monthly Salary'} 
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
                  <option value="Nómina">{t.nomina}</option>
                  <option value="Freelance">{t.freelance}</option>
                  <option value="Inversiones">{t.inversiones}</option>
                  <option value="Regalo">{t.regalo}</option>
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
                <option value="Transferencia">{t.transferencia}</option>
                <option value="Efectivo">{t.efectivo}</option>
                <option value="Tarjeta">{t.tarjeta}</option>
                <option value="PayPal">{t.paypal}</option>
              </select>
            </div>

            <button 
              type="submit"
              className="w-full mt-4 bg-[var(--primary)] text-[var(--primary-foreground)] py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition-all active:scale-[0.98]"
            >
              {t.guardarIngreso}
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="xl:col-span-8 bg-card p-6 rounded-2xl shadow-sm border border-border space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-[var(--foreground)]">{t.historialIngresos}</h2>
              <p className="text-xs text-muted-foreground font-medium">{language === 'es' ? 'Movimientos de entrada registrados' : 'Recorded cash inflows'}</p>
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
                        <span>{language === 'es' ? 'Buscando ingresos...' : 'Searching incomes...'}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredIncomes.length > 0 ? (
                  filteredIncomes.map((i) => (
                    <tr key={i.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-4 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {i.date}
                      </td>
                      <td className="py-4 font-bold text-sm text-[var(--foreground)]">{i.description}</td>
                      <td className="py-4">
                        <span className="px-2.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs font-bold">
                          {i.category === 'Nómina' || i.category === 'Salary' ? t.nomina :
                           i.category === 'Freelance' ? t.freelance :
                           i.category === 'Inversiones' || i.category === 'Investments' ? t.inversiones :
                           i.category === 'Regalo' || i.category === 'Gift' ? t.regalo : t.otros}
                        </span>
                      </td>
                      <td className="py-4 text-right font-black text-[var(--primary)] text-sm">
                        +{formatCurrencyValue(i.amount, user?.currency || 'EUR', language)}
                      </td>
                      <td className="py-4 text-right w-10">
                        <button 
                          onClick={() => deleteIncome(i.id)}
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
                        ? (language === 'es' ? 'No se encontraron ingresos coincidentes' : 'No matching incomes found')
                        : t.noIncomes}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center text-xs text-muted-foreground font-medium pt-4 border-t border-border/60">
            <p>{language === 'es' ? `Mostrando ${filteredIncomes.length} ingresos` : `Showing ${filteredIncomes.length} incomes`}</p>
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
    </div>
  );
}
