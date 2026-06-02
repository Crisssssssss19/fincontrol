'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Zap, 
  Wifi, 
  Home, 
  Briefcase, 
  HeartPulse, 
  GraduationCap, 
  HelpCircle,
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Cloud, 
  CloudOff, 
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Upload,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Invoice, InvoiceType, InvoiceStatus } from '@/core/entities/Invoice';
import { ExportService } from '@/utils/export';
import { useSyncStore } from '@/store/useSyncStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useAlertStore } from '@/store/useAlertStore';
import { translations } from '@/lib/translations';
import { initOfflineDB } from '@/lib/offlineDb';
import { formatCurrencyValue } from '@/utils/currency';

const invoiceSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres / Name must be at least 3 characters'),
  type: z.enum(['Agua', 'Energía', 'Internet', 'Gas', 'Educación', 'Salud', 'Transporte', 'Entretenimiento', 'Otros'], {
    message: 'Selecciona un tipo de servicio / Select a service type'
  }),
  description: z.string().optional(),
  amount: z.number().positive('El monto debe ser mayor a cero / Amount must be greater than zero'),
  issueDate: z.string().min(1, 'Selecciona una fecha de emisión / Select an issue date'),
  dueDate: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  status: z.enum(['paid', 'pending', 'overdue']),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const { user } = useAuthStore();
  const { searchQuery, setSearchQuery, debouncedQuery, isSearching } = useSearchStore();
  
  const isOnline = useSyncStore(state => state.isOnline);
  const { language } = useLanguageStore();
  const t = translations[language] || translations['es'];

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      status: 'pending',
      type: 'Otros',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      paymentDate: '',
    }
  });

  const selectedStatus = watch('status');

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const onSubmit = async (data: InvoiceFormValues) => {
    const id = crypto.randomUUID();
    
    const resolvedDueDate = data.status === 'paid' 
      ? (data.paymentDate || new Date().toISOString().split('T')[0]) 
      : (data.dueDate || new Date().toISOString().split('T')[0]);
      
    const resolvedPaymentDate = data.status === 'paid' 
      ? (data.paymentDate || new Date().toISOString().split('T')[0]) 
      : null;

    const newInvoice: Invoice = {
      id,
      userId: user?.id || 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6',
      name: data.name,
      type: data.type,
      description: data.description || '',
      amount: data.amount,
      issueDate: data.issueDate,
      dueDate: resolvedDueDate,
      paymentDate: resolvedPaymentDate,
      status: data.status,
      attachmentUrl: '/placeholder-bill.pdf',
    };

    const isOverdue = data.status === 'overdue' || 
      (data.status === 'pending' && new Date(resolvedDueDate) < new Date(new Date().setHours(0,0,0,0)));

    if (!isOnline) {
      try {
        const db = await initOfflineDB();
        await db.put('pending_invoices', newInvoice);
        setInvoices(prev => [newInvoice, ...prev]);
        reset();
        setShowForm(false);
        if (isOverdue) {
          alert(language === 'es' ? '⚠️ ¡Atención! Esta factura se encuentra vencida.' : '⚠️ Attention! This bill is overdue.');
        } else {
          alert(t.noConnectionMsg);
        }
      } catch (err) {
        console.error('Error saving pending invoice to IDB:', err);
      }
    } else {
      try {
        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newInvoice),
        });
        const result = await res.json();
        if (result.success) {
          setInvoices(prev => [result.invoice, ...prev]);
          reset();
          setShowForm(false);
          if (isOverdue) {
            alert(language === 'es' ? '⚠️ ¡Atención! Esta factura se encuentra vencida y requiere pago inmediato.' : '⚠️ Attention! This bill is overdue and requires immediate payment.');
          } else {
            alert(language === 'es' ? '¡Factura registrada con éxito!' : 'Invoice registered successfully!');
          }
        }
      } catch (err) {
        console.error('Error creating invoice:', err);
      }
    }
  };

  const deleteInvoice = async (id: string) => {
    const confirmed = await useAlertStore.getState().showConfirm(t.confirmDelete);
    if (!confirmed) return;
    try {
      if (!isOnline) {
        const db = await initOfflineDB();
        await db.delete('pending_invoices', id);
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        return;
      }
      await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (err) {
      console.error('Error deleting invoice:', err);
    }
  };

  const toggleInvoiceStatus = async (invoice: Invoice) => {
    const updatedStatus = invoice.status === 'paid' ? 'pending' : 'paid';
    const updatedPaymentDate = updatedStatus === 'paid' ? new Date().toISOString().split('T')[0] : null;
    
    setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, status: updatedStatus, paymentDate: updatedPaymentDate } : inv));
    
    if (isOnline) {
      try {
        await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...invoice, status: updatedStatus, paymentDate: updatedPaymentDate }),
        });
      } catch (err) {
        console.error('Failed to sync updated status online:', err);
      }
    } else {
      try {
        const db = await initOfflineDB();
        await db.put('pending_invoices', { ...invoice, status: updatedStatus, paymentDate: updatedPaymentDate });
      } catch (err) {
        console.error('Failed to update IDB status:', err);
      }
    }
  };

  const getCategoryIcon = (type: InvoiceType) => {
    switch (type) {
      case 'Energía':
        return <Zap className="w-5 h-5" />;
      case 'Agua':
        return <Cloud className="w-5 h-5" />;
      case 'Internet':
        return <Wifi className="w-5 h-5" />;
      case 'Educación':
        return <GraduationCap className="w-5 h-5" />;
      case 'Salud':
        return <HeartPulse className="w-5 h-5" />;
      case 'Transporte':
      case 'Entretenimiento':
        return <Briefcase className="w-5 h-5" />;
      case 'Gas':
        return <Home className="w-5 h-5" />;
      default:
        return <HelpCircle className="w-5 h-5" />;
    }
  };

  const getInvoiceLifecycle = (inv: Invoice) => {
    if (inv.status === 'paid') {
      return {
        label: language === 'es' ? 'Pagada' : 'Paid',
        colorClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        badgeColor: 'bg-emerald-500',
        daysText: language === 'es' ? `Pagado el ${inv.paymentDate}` : `Paid on ${inv.paymentDate}`,
        urgency: 'safe'
      };
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(inv.dueDate);
    due.setHours(0,0,0,0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (inv.status === 'overdue' || diffDays < 0) {
      const delay = Math.abs(diffDays);
      return {
        label: language === 'es' ? 'Vencida' : 'Overdue',
        colorClass: 'bg-rose-500/15 text-rose-500 border-rose-500/30 animate-pulse',
        badgeColor: 'bg-rose-500',
        daysText: language === 'es' ? `${delay} días de retraso` : `${delay} days overdue`,
        urgency: 'overdue'
      };
    }

    let proximityClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    let badgeColor = 'bg-emerald-500';
    let urgency = 'safe';

    if (diffDays <= 2) {
      proximityClass = 'bg-red-500/15 text-red-500 border-red-500/30';
      badgeColor = 'bg-red-500';
      urgency = 'critical';
    } else if (diffDays <= 7) {
      proximityClass = 'bg-amber-500/15 text-amber-500 border-amber-500/30';
      badgeColor = 'bg-amber-500';
      urgency = 'warning';
    }

    return {
      label: language === 'es' ? 'Pendiente' : 'Pending',
      colorClass: proximityClass,
      badgeColor,
      daysText: language === 'es' ? `Vence en ${diffDays} días` : `Due in ${diffDays} days`,
      urgency
    };
  };

  const processedInvoices = invoices.map(inv => {
    const lifecycle = getInvoiceLifecycle(inv);
    const resolvedStatus: InvoiceStatus = 
      inv.status === 'paid' ? 'paid' :
      lifecycle.urgency === 'overdue' ? 'overdue' : 'pending';
    
    return {
      ...inv,
      resolvedStatus,
      lifecycle
    };
  });

  const filteredInvoices = processedInvoices.filter(inv => {
    const isStatusMatch = filterStatus === 'all' || inv.resolvedStatus === filterStatus;
    if (!searchQuery) return isStatusMatch;

    const query = searchQuery.toLowerCase();
    const amountStr = `$${inv.amount.toFixed(2)}`;
    const matchesSearch = inv.name.toLowerCase().includes(query) || 
                          (inv.description || '').toLowerCase().includes(query) ||
                          inv.type.toLowerCase().includes(query) ||
                          inv.dueDate.toLowerCase().includes(query) ||
                          amountStr.includes(query) ||
                          inv.amount.toString().includes(query);
    
    return isStatusMatch && matchesSearch;
  });

  const handleExportPDF = () => {
    const title = language === 'es' ? 'Historial de Facturas y Pagos' : 'Bills and Invoices History';
    const headers = [
      language === 'es' ? 'Nombre' : 'Name',
      language === 'es' ? 'Tipo de Servicio' : 'Service Type',
      language === 'es' ? 'F. Emisión' : 'Issue Date',
      language === 'es' ? 'F. Vencimiento' : 'Due Date',
      language === 'es' ? 'F. Pago' : 'Payment Date',
      language === 'es' ? 'Estado' : 'Status',
      language === 'es' ? 'Importe' : 'Amount'
    ];
    const rows = filteredInvoices.map(inv => [
      inv.name,
      inv.type,
      inv.issueDate,
      inv.dueDate,
      inv.paymentDate || '—',
      inv.lifecycle.label,
      formatCurrencyValue(inv.amount, user?.currency || 'EUR', language)
    ]);
    const totalLabel = language === 'es' ? 'IMPORTE TOTAL:' : 'TOTAL AMOUNT:';
    const totalSum = filteredInvoices.reduce((acc, curr) => acc + curr.amount, 0);
    const totalValue = formatCurrencyValue(totalSum, user?.currency || 'EUR', language);
    
    ExportService.exportToPDF(title, headers, rows, 'fincontrol_facturas', totalLabel, totalValue);
    alert(language === 'es' ? 'Exportación a PDF realizada con éxito.' : 'PDF exported successfully.');
  };

  const handleExportExcel = () => {
    const headersMap = {
      name: language === 'es' ? 'Nombre' : 'Name',
      type: language === 'es' ? 'Tipo de Servicio' : 'Service Type',
      issueDate: language === 'es' ? 'F. Emisión' : 'Issue Date',
      dueDate: language === 'es' ? 'F. Vencimiento' : 'Due Date',
      paymentDate: language === 'es' ? 'F. Pago' : 'Payment Date',
      status: language === 'es' ? 'Estado' : 'Status',
      amount: language === 'es' ? 'Importe' : 'Amount'
    };
    
    const formattedData = filteredInvoices.map(inv => ({
      name: inv.name,
      type: inv.type,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      paymentDate: inv.paymentDate || '',
      status: inv.lifecycle.label,
      amount: formatCurrencyValue(inv.amount, user?.currency || 'EUR', language)
    }));
    
    ExportService.exportToExcel(formattedData, headersMap, 'fincontrol_facturas');
    alert(language === 'es' ? 'Exportación a Excel realizada con éxito.' : 'Excel exported successfully.');
  };

  return (
    <div className="space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">{t.gestionFacturas}</h1>
          <p className="text-xs text-muted-foreground font-medium">{t.descripcionFacturas}</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              window.scrollTo({ top: 120, behavior: 'smooth' });
            }
          }}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-95 transition-all active:scale-[0.98] text-xs shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t.nuevaFactura}
        </button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black text-[var(--foreground)]">{t.registrarPago}</h2>
            <button 
              onClick={() => setShowForm(false)}
              className="text-muted-foreground hover:bg-muted p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{t.nombreFactura}</label>
              <input 
                {...register('name')}
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                placeholder={language === 'es' ? 'Ej. Factura Energía Endesa' : 'e.g., Electricity Bill'} 
                type="text"
              />
              {errors.name && <p className="text-xs text-error font-medium">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{t.tipoServicio}</label>
              <select 
                {...register('type')}
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all cursor-pointer"
              >
                <option value="Energía">{language === 'es' ? 'Energía' : 'Electricity'}</option>
                <option value="Agua">{language === 'es' ? 'Agua' : 'Water'}</option>
                <option value="Gas">{language === 'es' ? 'Gas' : 'Gas'}</option>
                <option value="Internet">{language === 'es' ? 'Internet' : 'Internet'}</option>
                <option value="Educación">{t.educacion}</option>
                <option value="Salud">{t.salud}</option>
                <option value="Transporte">{language === 'es' ? 'Transporte' : 'Transport'}</option>
                <option value="Entretenimiento">{language === 'es' ? 'Entretenimiento' : 'Entertainment'}</option>
                <option value="Otros">{t.otros}</option>
              </select>
              {errors.type && <p className="text-xs text-error font-medium">{errors.type.message}</p>}
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{t.descripcion}</label>
              <textarea 
                {...register('description')}
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all resize-none" 
                placeholder={language === 'es' ? 'Detalles adicionales de la factura...' : 'Additional billing details...'} 
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">
                {language === 'es' ? 'Fecha de Emisión' : 'Issue Date'}
              </label>
              <input 
                {...register('issueDate')}
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                type="date"
              />
              {errors.issueDate && <p className="text-xs text-error font-medium">{errors.issueDate.message}</p>}
            </div>

            {selectedStatus !== 'paid' ? (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-muted-foreground">
                  {language === 'es' ? 'Fecha Límite de Pago' : 'Due Date'}
                </label>
                <input 
                  {...register('dueDate')}
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                  type="date"
                />
                {errors.dueDate && <p className="text-xs text-error font-medium">{errors.dueDate.message}</p>}
              </div>
            ) : (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-muted-foreground">
                  {language === 'es' ? 'Fecha en que se Pagó' : 'Payment Date'}
                </label>
                <input 
                  {...register('paymentDate')}
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                  type="date"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{t.importe}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                <input 
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all font-semibold" 
                  placeholder="0.00" 
                  step="0.01" 
                  type="number"
                />
              </div>
              {errors.amount && <p className="text-xs text-error font-medium">{errors.amount.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">{t.status}</label>
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 p-2.5 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[var(--primary)]/5 font-bold text-[10px] uppercase">
                  <input {...register('status')} className="hidden" type="radio" value="paid" />
                  {t.pagado}
                </label>
                <label className="flex-1 flex items-center justify-center gap-1.5 p-2.5 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/5 font-bold text-[10px] uppercase">
                  <input {...register('status')} className="hidden" type="radio" value="pending" />
                  {t.pendiente}
                </label>
                <label className="flex-1 flex items-center justify-center gap-1.5 p-2.5 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-rose-500 has-[:checked]:bg-rose-500/5 font-bold text-[10px] uppercase">
                  <input {...register('status')} className="hidden" type="radio" value="overdue" />
                  {language === 'es' ? 'Vencida' : 'Overdue'}
                </label>
              </div>
            </div>

            {/* Conditional input replaced in grid layout above */}

            <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-border/40">
              <button 
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-border text-muted-foreground rounded-xl font-bold text-xs hover:bg-muted transition-colors cursor-pointer" 
                type="button"
              >
                {t.cancelar}
              </button>
              <button 
                className="px-8 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition-all cursor-pointer" 
                type="submit"
              >
                {t.guardarFactura}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-2xs">
        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-muted/10 focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
            placeholder={language === 'es' ? 'Buscar facturas por nombre...' : 'Search bills by name...'} 
            type="text"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 shrink-0">
          <button 
            onClick={() => setFilterStatus('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
              filterStatus === 'all' 
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs' 
                : 'bg-muted text-muted-foreground hover:bg-border'
            }`}
          >
            {t.todos}
          </button>
          <button 
            onClick={() => setFilterStatus('paid')}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
              filterStatus === 'paid' 
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs' 
                : 'bg-muted text-muted-foreground hover:bg-border'
            }`}
          >
            {t.pagados}
          </button>
          <button 
            onClick={() => setFilterStatus('pending')}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
              filterStatus === 'pending' 
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs' 
                : 'bg-muted text-muted-foreground hover:bg-border'
            }`}
          >
            {t.pendientes}
          </button>
          <button 
            onClick={() => setFilterStatus('overdue')}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
              filterStatus === 'overdue' 
                ? 'bg-rose-500 text-white shadow-xs' 
                : 'bg-muted text-muted-foreground hover:bg-border'
            }`}
          >
            {language === 'es' ? 'Vencidas' : 'Overdue'}
          </button>

          <div className="h-6 w-[1px] bg-border mx-1 hidden xl:block shrink-0"></div>

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

      {/* Mobile Card List (visible only on mobile) */}
      <div className="block md:hidden space-y-4">
        {loading || isSearching ? (
          <div className="p-8 text-center text-sm text-muted-foreground font-medium bg-card border border-border rounded-2xl shadow-xs">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
              <span>{language === 'es' ? 'Buscando facturas...' : 'Searching bills...'}</span>
            </div>
          </div>
        ) : filteredInvoices.length > 0 ? (
          filteredInvoices.map((inv) => (
            <div 
              key={inv.id} 
              className={`p-4 bg-card border rounded-2xl shadow-xs space-y-3 relative overflow-hidden transition-all ${
                inv.resolvedStatus === 'overdue' ? 'border-rose-500/30 bg-rose-500/[0.02]' : 'border-border'
              }`}
            >
              {/* Top Row: Icon + Title + Trash */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    inv.resolvedStatus === 'overdue' 
                      ? 'bg-rose-500/10 text-rose-500' 
                      : 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  }`}>
                    {getCategoryIcon(inv.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--foreground)] leading-tight">{inv.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {inv.type === 'Energía' ? (language === 'es' ? 'Energía' : 'Electricity') :
                       inv.type === 'Agua' ? (language === 'es' ? 'Agua' : 'Water') :
                       inv.type === 'Gas' ? (language === 'es' ? 'Gas' : 'Gas') :
                       inv.type === 'Internet' ? (language === 'es' ? 'Internet' : 'Internet') :
                       inv.type === 'Educación' ? t.educacion :
                       inv.type === 'Salud' ? t.salud :
                       inv.type === 'Transporte' ? (language === 'es' ? 'Transporte' : 'Transport') :
                       inv.type === 'Entretenimiento' ? (language === 'es' ? 'Entretenimiento' : 'Entertainment') :
                       t.otros} • {inv.description || t.otros}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => deleteInvoice(inv.id)}
                  className="p-1.5 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-all active:scale-90 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Middle Row: Dates */}
              <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-border/40 text-[11px]">
                <div>
                  <span className="text-muted-foreground block font-medium mb-0.5">{language === 'es' ? 'Emisión' : 'Issued'}</span>
                  <span className="font-semibold text-[var(--foreground)]">{inv.issueDate}</span>
                </div>
                <div>
                  {inv.resolvedStatus === 'paid' ? (
                    <div>
                      <span className="text-emerald-500 block font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {inv.lifecycle.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-semibold">
                        {inv.paymentDate}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-muted-foreground block font-medium mb-0.5">{language === 'es' ? 'Vencimiento' : 'Due'}</span>
                      <span className={`font-bold ${inv.resolvedStatus === 'overdue' ? 'text-rose-500' : 'text-[var(--foreground)]'}`}>
                        {inv.dueDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Amount + Status Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-black text-[var(--foreground)]">
                  {formatCurrencyValue(inv.amount, user?.currency || 'EUR', language)}
                </span>
                
                <button 
                  onClick={() => toggleInvoiceStatus(inv)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all active:scale-95 cursor-pointer ${
                    inv.resolvedStatus === 'paid' 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                      : inv.resolvedStatus === 'overdue'
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-xs'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    inv.resolvedStatus === 'paid' ? 'bg-emerald-500' :
                    inv.resolvedStatus === 'overdue' ? 'bg-rose-500 animate-ping' :
                    'bg-amber-500'
                  }`}></span>
                  {inv.lifecycle.label}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground font-medium bg-card border border-border rounded-2xl shadow-xs">
            {searchQuery 
              ? (language === 'es' ? 'No se encontraron facturas coincidentes' : 'No matching bills found')
              : t.noInvoices}
          </div>
        )}
      </div>

      {/* Invoices Table (Desktop/Tablet) */}
      <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-6 py-4 font-bold text-xs text-muted-foreground uppercase tracking-wider">{t.factura}</th>
                <th className="px-6 py-4 font-bold text-xs text-muted-foreground uppercase tracking-wider">{t.categoria}</th>
                <th className="px-6 py-4 font-bold text-xs text-muted-foreground uppercase tracking-wider">
                  {language === 'es' ? 'F. Emisión' : 'Issue Date'}
                </th>
                <th className="px-6 py-4 font-bold text-xs text-muted-foreground uppercase tracking-wider text-center">
                  {language === 'es' ? 'Vencimiento / Pago' : 'Due / Payment Date'}
                </th>
                <th className="px-6 py-4 font-bold text-xs text-muted-foreground uppercase tracking-wider text-right">{t.importe}</th>
                <th className="px-6 py-4 font-bold text-xs text-muted-foreground uppercase tracking-wider text-center">{t.status}</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading || isSearching ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                      <span>{language === 'es' ? 'Buscando facturas...' : 'Searching bills...'}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr 
                    key={inv.id} 
                    className={`hover:bg-muted/10 transition-colors ${
                      inv.resolvedStatus === 'overdue' ? 'bg-rose-500/[0.02]' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          inv.resolvedStatus === 'overdue' 
                            ? 'bg-rose-500/10 text-rose-500' 
                            : 'bg-[var(--primary)]/10 text-[var(--primary)]'
                        }`}>
                          {getCategoryIcon(inv.type)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[var(--foreground)]">{inv.name}</p>
                          <p className="text-[10px] text-muted-foreground">{inv.description || t.otros}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {inv.type === 'Energía' ? (language === 'es' ? 'Energía' : 'Electricity') :
                         inv.type === 'Agua' ? (language === 'es' ? 'Agua' : 'Water') :
                         inv.type === 'Gas' ? (language === 'es' ? 'Gas' : 'Gas') :
                         inv.type === 'Internet' ? (language === 'es' ? 'Internet' : 'Internet') :
                         inv.type === 'Educación' ? t.educacion :
                         inv.type === 'Salud' ? t.salud :
                         inv.type === 'Transporte' ? (language === 'es' ? 'Transporte' : 'Transport') :
                         inv.type === 'Entretenimiento' ? (language === 'es' ? 'Entretenimiento' : 'Entertainment') :
                         t.otros}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-muted-foreground">{inv.issueDate}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {inv.resolvedStatus === 'paid' ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {inv.lifecycle.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            {language === 'es' ? `Pagado el: ` : `Paid: `}{inv.paymentDate}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-semibold text-muted-foreground">{inv.dueDate}</span>
                          <span className={`text-[10px] px-2 py-0.5 mt-1 rounded-full font-bold border ${inv.lifecycle.colorClass}`}>
                            {inv.lifecycle.daysText}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-sm text-[var(--foreground)]">
                      {formatCurrencyValue(inv.amount, user?.currency || 'EUR', language)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => toggleInvoiceStatus(inv)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                          inv.resolvedStatus === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : inv.resolvedStatus === 'overdue'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-xs'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          inv.resolvedStatus === 'paid' ? 'bg-emerald-500' :
                          inv.resolvedStatus === 'overdue' ? 'bg-rose-500 animate-ping' :
                          'bg-amber-500'
                        }`}></span>
                        {inv.lifecycle.label}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteInvoice(inv.id)}
                        className="p-1.5 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-all active:scale-90 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground font-medium">
                    {searchQuery 
                      ? (language === 'es' ? 'No se encontraron facturas coincidentes' : 'No matching bills found')
                      : t.noInvoices}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-border/60">
          <p className="text-xs text-muted-foreground font-medium">
            {language === 'es' ? `Mostrando ${filteredInvoices.length} facturas` : `Showing ${filteredInvoices.length} bills`}
          </p>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
