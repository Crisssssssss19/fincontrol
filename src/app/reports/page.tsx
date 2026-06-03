'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { translations } from '@/lib/translations';
import { 
  TrendingUp, 
  ShoppingCart, 
  Wallet, 
  FileText, 
  Download,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Percent,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Income } from '@/core/entities/Income';
import { Expense } from '@/core/entities/Expense';
import { formatCurrencyValue, formatCompactNumber } from '@/utils/currency';
import { ExportService } from '@/utils/export';


// Dynamically import Recharts to avoid SSR hydration mismatches
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const ComposedChart = dynamic(() => import('recharts').then(m => m.ComposedChart), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false });

export default function ReportsPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { language } = useLanguageStore();
  const t = translations[language] || translations['es'];
  const { user } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    async function fetchData() {
      try {
        const [incRes, expRes] = await Promise.all([
          fetch('/api/incomes').then(r => r.json()),
          fetch('/api/expenses').then(r => r.json()),
        ]);

        if (incRes.success) setIncomes(incRes.incomes || []);
        if (expRes.success) setExpenses(expRes.expenses || []);
      } catch (err) {
        console.error('Error fetching reports data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalIncomes = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSavings = totalIncomes > totalExpenses ? totalIncomes - totalExpenses : 0;
  const savingsRate = totalIncomes > 0 ? (totalSavings / totalIncomes) * 100 : 0;

  // Group expenses by category and map default ones if empty
  const expenseCategories: Record<string, number> = {
    'Alimentación': 0,
    'Transporte': 0,
    'Vivienda': 0,
    'Servicios': 0,
    'Entretenimiento': 0,
    'Salud': 0,
    'Educación': 0,
    'Otros': 0
  };

  expenses.forEach(e => {
    let matchedCat = e.category;
    // Map English categories to Spanish for consistent grouping keys
    if (e.category === 'Food') matchedCat = 'Alimentación';
    if (e.category === 'Transport') matchedCat = 'Transporte';
    if (e.category === 'Housing') matchedCat = 'Vivienda';
    if (e.category === 'Utilities' || e.category === 'Services') matchedCat = 'Servicios';
    if (e.category === 'Leisure' || e.category === 'Entertainment') matchedCat = 'Entretenimiento';
    if (e.category === 'Health') matchedCat = 'Salud';
    if (e.category === 'Education') matchedCat = 'Educación';
    if (e.category === 'Others') matchedCat = 'Otros';

    expenseCategories[matchedCat] = (expenseCategories[matchedCat] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(expenseCategories)
    .filter(([_, amount]) => amount > 0)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const topCategoryName = sortedCategories[0]?.name || '—';
  const topCategoryAmount = sortedCategories[0]?.amount || 0;

  // Last 6 months trend calculator
  const getMonthlyTrends = () => {
    const monthNames = [t.ene, t.feb, t.mar, t.abr, t.may, t.jun, t.jul, t.ago, t.sep, t.oct, t.nov, t.dic];
    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        name: monthNames[d.getMonth()],
        incomes: 0,
        expenses: 0,
        balance: 0
      };
    });

    incomes.forEach(inc => {
      try {
        const incDate = new Date(inc.date);
        const target = last6Months.find(m => m.monthIndex === incDate.getMonth() && m.year === incDate.getFullYear());
        if (target) target.incomes += inc.amount;
      } catch (e) {}
    });

    expenses.forEach(exp => {
      try {
        const expDate = new Date(exp.date);
        const target = last6Months.find(m => m.monthIndex === expDate.getMonth() && m.year === expDate.getFullYear());
        if (target) target.expenses += exp.amount;
      } catch (e) {}
    });

    last6Months.forEach(m => {
      m.balance = m.incomes - m.expenses;
    });

    return last6Months;
  };

  const monthlyData = getMonthlyTrends();

  // Dynamic Chart Color Palette based on current active theme
  const getThemePalette = (themeName: string) => {
    if (themeName === 'rose_finance') {
      return ['#db2777', '#f43f5e', '#a855f7', '#ec4899', '#f472b6', '#c084fc', '#fb7185', '#fda4af'];
    }
    if (themeName === 'cyberpunk') {
      return ['#ffff00', '#ff007f', '#00ffff', '#d946ef', '#f97316', '#22c55e', '#3b82f6', '#6366f1'];
    }
    if (themeName === 'dracula') {
      return ['#ff79c6', '#bd93f9', '#8be9fd', '#50fa7b', '#ffb86c', '#f1fa8c', '#ff5555', '#6272a4'];
    }
    if (themeName === 'midnight') {
      return ['#38bdf8', '#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#94a3b8'];
    }
    // Emerald Slate default
    return ['#006c49', '#10b981', '#0284c7', '#6366f1', '#eab308', '#f43f5e', '#d97706', '#64748b'];
  };

  const donutColors = getThemePalette(theme);

  const handleExport = (format: 'pdf' | 'excel') => {
    try {
      const combinedData = [
        ...incomes.map(i => ({
          date: i.date,
          description: i.description,
          category: i.category === 'Salary' || i.category === 'Nómina' ? (t.nomina || 'Nómina') : i.category,
          type: language === 'es' ? 'Ingreso' : 'Income',
          amount: i.amount
        })),
        ...expenses.map(e => ({
          date: e.date,
          description: e.description,
          category: e.category === 'Alimentación' || e.category === 'Food' ? (t.alimentacion || 'Alimentación') : 
                    e.category === 'Transporte' || e.category === 'Transport' ? (t.transporte || 'Transporte') :
                    e.category === 'Vivienda' || e.category === 'Housing' ? (t.vivienda || 'Vivienda') : e.category,
          type: language === 'es' ? 'Gasto' : 'Expense',
          amount: -e.amount
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const filename = language === 'es' ? 'Informe_Gastos_FinControl' : 'FinControl_Expense_Report';

      if (format === 'pdf') {
        const titleText = language === 'es' ? 'Informe de Análisis de Gastos e Ingresos' : 'Expense & Income Analysis Report';
        const headers = language === 'es' 
          ? ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto']
          : ['Date', 'Description', 'Category', 'Type', 'Amount'];
        
        const rows = combinedData.map(item => [
          item.date,
          item.description,
          item.category,
          item.type,
          formatCurrencyValue(item.amount, user?.currency || 'EUR', language)
        ]);

        const totalLabel = language === 'es' ? 'Balance General' : 'Total Balance';
        const totalValue = formatCurrencyValue(totalIncomes - totalExpenses, user?.currency || 'EUR', language);

        ExportService.exportToPDF(titleText, headers, rows, filename, totalLabel, totalValue);
      } else {
        const headersMap = language === 'es' ? {
          date: 'Fecha',
          description: 'Descripción',
          category: 'Categoría',
          type: 'Tipo',
          amount: 'Monto'
        } : {
          date: 'Date',
          description: 'Description',
          category: 'Category',
          type: 'Type',
          amount: 'Amount'
        };

        ExportService.exportToExcel(combinedData, headersMap, filename);
      }
    } catch (err) {
      console.error('Error exporting files:', err);
      alert(language === 'es' ? 'Error al exportar el archivo' : 'Error exporting file');
    }
  };

  if (!loading && incomes.length === 0 && expenses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">{language === 'es' ? 'Análisis de Gastos' : 'Expense Analysis'}</h1>
          <p className="text-xs text-muted-foreground font-medium">{t.descripcionInformes}</p>
        </div>

        <div className="bg-card border border-border p-12 rounded-2xl text-center max-w-2xl mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4 stroke-[1.5]" />
          <h2 className="text-lg font-black text-[var(--foreground)]">
            {language === 'es' ? 'No hay suficientes datos financieros' : 'Not enough financial data'}
          </h2>
          <p className="text-xs text-muted-foreground/80 mt-2 max-w-md mx-auto leading-relaxed">
            {language === 'es' 
              ? 'Para visualizar tus análisis detallados, informes interactivos y distribución de gastos por categoría, primero debes registrar transacciones en el sistema.' 
              : 'To visualize your detailed analysis, interactive reports, and spending distribution by category, you must first register transactions in the system.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link 
              href="/incomes"
              className="px-5 py-2.5 bg-card border border-border hover:bg-muted text-muted-foreground text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              {language === 'es' ? 'Registrar Ingreso' : 'Register Income'}
            </Link>
            <Link 
              href="/expenses"
              className="px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md cursor-pointer"
            >
              {language === 'es' ? 'Registrar Gasto' : 'Register Expense'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">
            {language === 'es' ? 'Análisis de Gastos' : 'Expense Analysis'}
          </h1>
          <p className="text-xs text-muted-foreground font-medium">{t.descripcionInformes}</p>
        </div>
        
        {/* Export triggers */}
        <div className="flex gap-2">
          <button 
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-card border border-border hover:bg-muted text-muted-foreground rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
            {t.exportarPDF}
          </button>
          <button 
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-xs font-bold hover:opacity-95 transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {t.exportarExcel}
          </button>
        </div>
      </div>

      {/* Bento Grid KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1: Savings Rate */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.tasaAhorro}</span>
              <Wallet className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div className="text-3xl font-black text-[var(--primary)]">{savingsRate.toFixed(1)}%</div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-[var(--primary)] font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+2.1% {t.desdeMesPasado}</span>
          </div>
        </div>

        {/* KPI 2: Most Expensive Category */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.categoriaCostosa}</span>
              <ShoppingCart className="w-5 h-5 text-rose-500" />
            </div>
            <h3 className="text-lg font-black text-[var(--foreground)] truncate">
              {topCategoryName === 'Alimentación' ? t.alimentacion : 
               topCategoryName === 'Transporte' ? t.transporte : 
               topCategoryName === 'Entretenimiento' ? (language === 'es' ? 'Entretenimiento' : 'Entertainment') : 
               topCategoryName === 'Vivienda' ? t.vivienda : 
               topCategoryName === 'Salud' ? t.salud : 
               topCategoryName === 'Educación' ? t.educacion : topCategoryName}
            </h3>
            <div className="text-base font-extrabold text-muted-foreground">{formatCurrencyValue(topCategoryAmount, user?.currency || 'EUR', language)}</div>
          </div>
          <div className="mt-4 w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full animate-pulse" style={{ width: '45%' }}></div>
          </div>
        </div>

        {/* KPI 3: Cash Flow Balance */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {language === 'es' ? 'Balance del Mes' : 'Monthly Balance'}
              </span>
              <ArrowUpDown className="w-5 h-5 text-indigo-500" />
            </div>
            <div className={`text-3xl font-black ${totalIncomes >= totalExpenses ? 'text-[var(--primary)]' : 'text-rose-500'}`}>
              {formatCurrencyValue(totalIncomes - totalExpenses, user?.currency || 'EUR', language)}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
            <span>
              {language === 'es' 
                ? `Ingresos: ${formatCurrencyValue(totalIncomes, user?.currency || 'EUR', language)} | Gastos: ${formatCurrencyValue(totalExpenses, user?.currency || 'EUR', language)}`
                : `Incomes: ${formatCurrencyValue(totalIncomes, user?.currency || 'EUR', language)} | Expenses: ${formatCurrencyValue(totalExpenses, user?.currency || 'EUR', language)}`}
            </span>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Span: Spending trends area chart */}
        <div className="lg:col-span-8 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider">{t.tendenciasGasto}</h3>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {language === 'es' ? 'Evolución de gastos por mes' : 'Monthly expense evolution'}
            </span>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: 'var(--muted-foreground)' }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={formatCompactNumber} style={{ fontSize: '11px', fill: 'var(--muted-foreground)' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    color: 'var(--foreground)'
                  }} 
                  formatter={(value: any) => [formatCurrencyValue(Number(value), user?.currency || 'EUR', language), t.expenses]}
                />
                <Area type="monotone" dataKey="expenses" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#trendsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Span: Donut chart for Categories distribution */}
        <div className="lg:col-span-4 bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider mb-4">
            {language === 'es' ? 'Distribución de Gastos' : 'Expense Distribution'}
          </h3>
          
          <div className="h-44 w-full relative flex items-center justify-center">
            {sortedCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sortedCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                    {sortedCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      borderColor: 'var(--border)',
                      borderRadius: 'var(--radius)',
                      fontSize: '12px',
                      color: 'var(--foreground)'
                    }} 
                    formatter={(value: any, name: any, props: any) => {
                      const categoryName = props?.payload?.name;
                      const localizedCategory = categoryName === 'Alimentación' ? t.alimentacion : 
                                                categoryName === 'Transporte' ? t.transporte : 
                                                categoryName === 'Entretenimiento' ? (language === 'es' ? 'Entretenimiento' : 'Entertainment') : 
                                                categoryName === 'Vivienda' ? t.vivienda : 
                                                categoryName === 'Salud' ? t.salud : 
                                                categoryName === 'Educación' ? t.educacion : categoryName;
                      return [formatCurrencyValue(Number(value), user?.currency || 'EUR', language), localizedCategory];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-muted-foreground font-semibold">
                {language === 'es' ? 'Sin gastos' : 'No expenses'}
              </div>
            )}
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-[var(--foreground)]">{formatCurrencyValue(totalExpenses, user?.currency || 'EUR', language)}</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold">{t.total}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-4 border-t border-border/40 max-h-[140px] overflow-y-auto pr-1">
            {sortedCategories.map((d, index) => {
              const pct = totalExpenses > 0 ? (d.amount / totalExpenses) * 100 : 0;
              return (
                <div key={index} className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: donutColors[index % donutColors.length] }}></div>
                    <span className="text-muted-foreground truncate max-w-[130px] font-medium">
                      {d.name === 'Alimentación' ? t.alimentacion : 
                       d.name === 'Transporte' ? t.transporte : 
                       d.name === 'Entretenimiento' ? (language === 'es' ? 'Entretenimiento' : 'Entertainment') : 
                       d.name === 'Vivienda' ? t.vivienda : 
                       d.name === 'Salud' ? t.salud : 
                       d.name === 'Educación' ? t.educacion : d.name}
                    </span>
                  </div>
                  <span className="text-[var(--foreground)]">{formatCurrencyValue(d.amount, user?.currency || 'EUR', language)} <span className="text-[9px] text-muted-foreground">({pct.toFixed(0)}%)</span></span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Composed Chart: Income vs Expenses & Balance */}
        <div className="lg:col-span-8 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider">
              {language === 'es' ? 'Comparación Ingresos vs Gastos y Balance' : 'Income vs Expenses & Balance'}
            </h3>
            
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]"></div>
                {t.incomes}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></div>
                {t.expenses}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                <div className="w-2.5 h-1.5 bg-indigo-500 rounded-full"></div>
                Balance
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} barGap="-100%" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: 'var(--muted-foreground)' }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={formatCompactNumber} style={{ fontSize: '11px', fill: 'var(--muted-foreground)' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    color: 'var(--foreground)'
                  }} 
                  formatter={(value: any, name: any) => {
                    const formattedValue = formatCurrencyValue(Number(value), user?.currency || 'EUR', language);
                    let displayName = name;
                    if (name === 'incomes') displayName = t.incomes;
                    else if (name === 'expenses') displayName = t.expenses;
                    else if (name === 'balance') displayName = 'Balance';
                    return [formattedValue, displayName];
                  }}
                />
                 <Bar dataKey="incomes" fill="var(--primary)" barSize={20} radius={[4, 4, 0, 0]} />
                 <Bar dataKey="expenses" fill="#f43f5e" fillOpacity={0.7} barSize={12} radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 1 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Span: Category Ranking list */}
        <div className="lg:col-span-4 bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider mb-4">
              {language === 'es' ? 'Categorías más Costosas' : 'Most Costly Categories'}
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-4">
              {language === 'es' ? 'Ranking automático de consumos' : 'Automated consumption ranking'}
            </p>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 flex-1 mt-2">
            {sortedCategories.length > 0 ? (
              sortedCategories.map((cat, index) => {
                const pct = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[var(--foreground)]">
                        {index + 1}. {cat.name === 'Alimentación' ? t.alimentacion : 
                         cat.name === 'Transporte' ? t.transporte : 
                         cat.name === 'Entretenimiento' ? (language === 'es' ? 'Entretenimiento' : 'Entertainment') : 
                         cat.name === 'Vivienda' ? t.vivienda : 
                         cat.name === 'Salud' ? t.salud : 
                         cat.name === 'Educación' ? t.educacion : cat.name}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrencyValue(cat.amount, user?.currency || 'EUR', language)} <span className="text-[9px]">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/20">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${pct}%`,
                          backgroundColor: donutColors[index % donutColors.length]
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
                {language === 'es' ? 'No hay transacciones registradas' : 'No transactions registered'}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
