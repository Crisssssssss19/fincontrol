'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertStore } from '@/store/useAlertStore';
import { translations } from '@/lib/translations';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShoppingBag, 
  Briefcase, 
  Car, 
  Film, 
  Zap, 
  Home, 
  AlertCircle, 
  Sparkles,
  ChevronRight,
  Plus,
  PiggyBank,
  Target,
  PlusCircle,
  Calendar,
  DollarSign,
  Info,
  Trash2
} from 'lucide-react';
import { Income } from '@/core/entities/Income';
import { Expense } from '@/core/entities/Expense';
import { Invoice } from '@/core/entities/Invoice';
import { SavingsGoal } from '@/core/entities/SavingsGoal';
import { formatCurrencyValue } from '@/utils/currency';

// Dynamically import Recharts to avoid SSR hydration mismatches
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });

const getCategoryBadgeColor = (category: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('ahorro') || cat.includes('save') || cat.includes('saving')) {
    return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
  }
  if (cat.includes('gasto') || cat.includes('expense')) {
    return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
  }
  if (cat.includes('invers') || cat.includes('invest')) {
    return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
  }
  if (cat.includes('ingres') || cat.includes('income') || cat.includes('salario') || cat.includes('salary')) {
    return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
  }
  return 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20';
};

const getImpactBadgeColor = (impact: string) => {
  const imp = (impact || '').toLowerCase();
  if (imp.includes('alto') || imp.includes('high')) {
    return 'bg-red-500/10 text-red-500 border border-red-500/20';
  }
  if (imp.includes('medio') || imp.includes('medium')) {
    return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
  }
  return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
};

export default function DashboardPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Savings Goal form states
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState<number | ''>('');
  const [goalDate, setGoalDate] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  // Deposit form states
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<number | ''>('');

  const { language } = useLanguageStore();
  const t = translations[language] || translations['es'];
  const { user } = useAuthStore();

  const fetchDashboardData = async () => {
    try {
      const [incRes, expRes, invRes, goalRes] = await Promise.all([
        fetch('/api/incomes').then(r => r.json()),
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/invoices').then(r => r.json()),
        fetch('/api/savings-goals').then(r => r.json()),
      ]);

      if (incRes.success) setIncomes(incRes.incomes || []);
      if (expRes.success) setExpenses(expRes.expenses || []);
      if (invRes.success) setInvoices(invRes.invoices || []);
      if (goalRes.success) setGoals(goalRes.goals || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };
  const [advisorTips, setAdvisorTips] = useState<any[]>([]);
  const [loadingTips, setLoadingTips] = useState(true);

  const fetchAdvisorTips = async (lang: string) => {
    try {
      setLoadingTips(true);
      const res = await fetch(`/api/advisor?lang=${lang}`);
      const data = await res.json();
      if (data.success && data.tips) {
        setAdvisorTips(data.tips);
      }
    } catch (err) {
      console.error('Error fetching advisor tips:', err);
    } finally {
      setLoadingTips(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (incomes.length > 0 || expenses.length > 0) {
        fetchAdvisorTips(language);
      } else {
        setAdvisorTips([]);
        setLoadingTips(false);
      }
    }
  }, [loading, incomes.length, expenses.length, language]);

  // Summary calculations
  const totalIncomes = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const currentBalance = totalIncomes - totalExpenses;

  // Real Savings estimations
  const monthlySavings = currentBalance > 0 ? currentBalance : 0;
  const projectedAnnualSavings = monthlySavings * 12;
  const savingsRate = totalIncomes > 0 ? Math.max(0, Math.min(100, Math.round((currentBalance / totalIncomes) * 100))) : 0;
  const strokeDashoffset = 251.2 - (251.2 * savingsRate) / 100;

  const savingsQuote = totalIncomes > 0 
    ? (savingsRate >= 20 
        ? t.savingsRateQuote 
        : (language === 'es' ? 'Intenta reducir gastos hormiga para subir tu tasa de ahorro.' : 'Try reducing small expenses to increase your savings rate.'))
    : (language === 'es' ? 'Registra ingresos y gastos para medir tu tasa de ahorro.' : 'Register income and expenses to view your savings rate.');

  // "En qué se va tu dinero" Smart Engine
  const getSmartSpendingAnalysis = () => {
    if (expenses.length === 0) {
      return {
        hasData: false,
        dominantCategory: '',
        dominantPct: 0,
        recommendation: language === 'es' ? 'Comienza a registrar tus gastos para recibir sugerencias inteligentes de ahorro.' : 'Start logging expenses to receive smart saving suggestions.'
      };
    }

    const categories: Record<string, number> = {};
    expenses.forEach(e => {
      let cat = e.category;
      if (cat === 'Food') cat = 'Alimentación';
      if (cat === 'Transport') cat = 'Transporte';
      if (cat === 'Housing') cat = 'Vivienda';
      if (cat === 'Utilities' || cat === 'Services') cat = 'Servicios';
      if (cat === 'Leisure' || cat === 'Entertainment') cat = 'Entretenimiento';
      if (cat === 'Health') cat = 'Salud';
      if (cat === 'Education') cat = 'Educación';
      if (cat === 'Others') cat = 'Otros';
      categories[cat] = (categories[cat] || 0) + e.amount;
    });

    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const [dominantCat, amount] = sorted[0];
    const dominantPct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;

    let recommendation = '';
    const localizedCat = dominantCat === 'Alimentación' ? t.alimentacion :
      dominantCat === 'Transporte' ? t.transporte :
      dominantCat === 'Entretenimiento' ? (language === 'es' ? 'Entretenimiento' : 'Entertainment') :
      dominantCat === 'Vivienda' ? t.vivienda :
      dominantCat === 'Salud' ? t.salud :
      dominantCat === 'Educación' ? t.educacion : dominantCat;

    if (dominantCat === 'Alimentación') {
      recommendation = language === 'es'
        ? `El ${dominantPct}% de tus gastos corresponden a alimentación. Planifica compras semanales o reduce delivery para ahorrar hasta un 15% este mes.`
        : `Food accounts for ${dominantPct}% of your total expenses. Plan weekly groceries or cut down on delivery to save up to 15% this month.`;
    } else if (dominantCat === 'Entretenimiento') {
      recommendation = language === 'es'
        ? `Tu gasto en entretenimiento representa el ${dominantPct}% del total. Intenta posponer suscripciones inactivas para liberar balance.`
        : `Entertainment accounts for ${dominantPct}% of your expenses. Try cancelling inactive streaming services to free up balance.`;
    } else if (dominantCat === 'Transporte') {
      recommendation = language === 'es'
        ? `Un ${dominantPct}% de tu dinero se va en transporte. Considera alternativas compartidas o transporte público para optimizar tu flujo.`
        : `Transport represents ${dominantPct}% of your expenses. Consider carpooling or public transit to optimize cash flows.`;
    } else {
      recommendation = language === 'es'
        ? `La categoría ${localizedCat} domina tus egresos con el ${dominantPct}%. Te sugerimos vigilar este comportamiento la próxima semana.`
        : `${localizedCat} dominates your expenditures with ${dominantPct}%. We suggest checking this category closely next week.`;
    }

    return {
      hasData: true,
      dominantCategory: localizedCat,
      dominantPct,
      recommendation
    };
  };

  const spendingAnalysis = getSmartSpendingAnalysis();

  // Create Saving Goal
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !goalTarget || !goalDate) return;
    try {
      setSavingGoal(true);
      const res = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: goalName,
          targetAmount: Number(goalTarget),
          targetDate: goalDate,
          currentAmount: 0
        })
      });
      const data = await res.json();
      if (data.success && data.goal) {
        setGoals(prev => [data.goal, ...prev]);
        setGoalName('');
        setGoalTarget('');
        setGoalDate('');
        setShowGoalForm(false);
        alert(language === 'es' ? '¡Meta de ahorro creada con éxito!' : 'Savings goal created successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingGoal(false);
    }
  };

  // Deposit Savings into Goal
  const handleGoalDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !depositAmount) return;
    const goal = goals.find(g => g.id === selectedGoalId);
    if (!goal) return;

    try {
      const updatedAmount = Number(goal.currentAmount) + Number(depositAmount);
      const res = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goal.id,
          name: goal.name,
          targetAmount: goal.targetAmount,
          targetDate: goal.targetDate,
          currentAmount: updatedAmount
        })
      });
      const data = await res.json();
      if (data.success && data.goal) {
        setGoals(prev => prev.map(g => g.id === goal.id ? data.goal : g));
        setDepositAmount('');
        setSelectedGoalId(null);
        alert(language === 'es' ? '¡Depósito registrado con éxito!' : 'Deposit registered successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id: string) => {
    const confirmed = await useAlertStore.getState().showConfirm(t.confirmDelete);
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/savings-goals?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setGoals(prev => prev.filter(g => g.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic chart data generation based on actual user transactions
  const getChartData = () => {
    const points = [
      { label: '01', incomes: 0, expenses: 0 },
      { label: '08', incomes: 0, expenses: 0 },
      { label: '15', incomes: 0, expenses: 0 },
      { label: '22', incomes: 0, expenses: 0 },
      { label: '30', incomes: 0, expenses: 0 },
    ];

    const currentMonthLabel = new Date().toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short' });

    if (incomes.length === 0 && expenses.length === 0) {
      return points.map(p => ({ day: `${p.label} ${currentMonthLabel}`, incomes: 0, expenses: 0 }));
    }

    incomes.forEach(inc => {
      try {
        const day = new Date(inc.date).getDate();
        if (day <= 7) points[0].incomes += inc.amount;
        else if (day <= 14) points[1].incomes += inc.amount;
        else if (day <= 21) points[2].incomes += inc.amount;
        else if (day <= 28) points[3].incomes += inc.amount;
        else points[4].incomes += inc.amount;
      } catch (e) {}
    });

    expenses.forEach(exp => {
      try {
        const day = new Date(exp.date).getDate();
        if (day <= 7) points[0].expenses += exp.amount;
        else if (day <= 14) points[1].expenses += exp.amount;
        else if (day <= 21) points[2].expenses += exp.amount;
        else if (day <= 28) points[3].expenses += exp.amount;
        else points[4].expenses += exp.amount;
      } catch (e) {}
    });

    return points.map(p => ({
      day: `${p.label} ${currentMonthLabel}`,
      incomes: p.incomes,
      expenses: p.expenses
    }));
  };

  const chartData = getChartData();

  // Combine incomes & expenses into recent actions
  const recentActivities = [
    ...incomes.map(i => ({ ...i, type: 'income', icon: Briefcase, colorClass: 'text-[var(--primary)] bg-[var(--primary)]/10' })),
    ...expenses.map(e => ({
      ...e,
      type: 'expense',
      icon: e.category === 'Alimentación' || e.category === 'Food' ? ShoppingBag : e.category === 'Transporte' || e.category === 'Transport' ? Car : e.category === 'Ocio' || e.category === 'Leisure' ? Film : ShoppingBag,
      colorClass: 'text-error bg-error/10'
    }))
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* 1. Hero row: Balance, Savings rate & Ahorro Proyectado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total balance available */}
        <div className="md:col-span-2 bg-[var(--primary)] p-6 rounded-2xl text-[var(--primary-foreground)] relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[220px]">
          <div className="relative z-10">
            <h2 className="text-xs font-bold uppercase opacity-80 tracking-wider mb-2">{t.totalBalance}</h2>
            <div className="flex items-end flex-wrap gap-4">
              <span className="text-4xl md:text-5xl font-black tracking-tight">
                {formatCurrencyValue(currentBalance, user?.currency || 'EUR', language)}
              </span>
              <div className="flex items-center bg-white/20 px-3 py-1 rounded-full mb-1.5 text-[10px] font-bold">
                {currentBalance >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                <span>{currentBalance >= 0 ? '+' : ''}{savingsRate}% {language === 'es' ? 'ahorrado' : 'saved'}</span>
              </div>
            </div>
            
            {/* Functional Savings details */}
            <div className="grid grid-cols-2 gap-4 mt-6 max-w-sm">
              <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/80 block uppercase font-bold">
                  {language === 'es' ? 'Ahorro Mensual Real' : 'Real Monthly Savings'}
                </span>
                <span className="text-sm font-black">{formatCurrencyValue(monthlySavings, user?.currency || 'EUR', language)}</span>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/80 block uppercase font-bold">
                  {language === 'es' ? 'Proyección de Ahorro Anual' : 'Projected Annual Savings'}
                </span>
                <span className="text-sm font-black">{formatCurrencyValue(projectedAnnualSavings, user?.currency || 'EUR', language)}</span>
              </div>
            </div>
          </div>
          <p className="text-[9px] opacity-75 mt-4 relative z-10">
            {language === 'es' ? 'Última actualización: hace unos instantes • Conexión local activa' : 'Last updated: just now • Local connection active'}
          </p>
          
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <svg fill="none" height="150" viewBox="0 0 400 200" width="300" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 200C0 200 50 100 150 150C250 200 350 50 400 100V200H0Z" fill="white"></path>
            </svg>
          </div>
        </div>

        {/* Circular Savings Rate gauge */}
        <div className="bg-card border border-border p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">{t.savingsRate}</h3>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle className="text-muted/10" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
              <circle 
                className="text-[var(--primary)]" 
                cx="48" 
                cy="48" 
                fill="transparent" 
                r="40" 
                stroke="currentColor" 
                strokeDasharray="251.2" 
                strokeDashoffset={strokeDashoffset} 
                strokeWidth="8" 
                strokeLinecap="round"
              ></circle>
            </svg>
            <span className="absolute text-xl font-extrabold text-[var(--foreground)]">{savingsRate}%</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground italic leading-relaxed">
            {savingsQuote}
          </p>
        </div>
      </div>

      {/* 2. Monthly Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Incomes Summary */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex justify-between items-center group hover:border-[var(--primary)] transition-all">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <ArrowDownLeft className="w-4 h-4 text-[var(--primary)]" />
              {t.monthlyIncomes}
            </span>
            <p className="text-2xl font-black text-[var(--foreground)]">
              {formatCurrencyValue(totalIncomes, user?.currency || 'EUR', language)}
            </p>
          </div>
          <div className="w-20 h-10 flex items-end gap-[3px]">
            <div className="bg-[var(--primary)]/20 h-[30%] w-full rounded-t-xs"></div>
            <div className="bg-[var(--primary)]/40 h-[60%] w-full rounded-t-xs"></div>
            <div className="bg-[var(--primary)]/60 h-[45%] w-full rounded-t-xs"></div>
            <div className="bg-[var(--primary)] h-full w-full rounded-t-xs animate-pulse"></div>
          </div>
        </div>

        {/* Expenses Summary */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex justify-between items-center group hover:border-error transition-all">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4 text-error" />
              {t.monthlyExpenses}
            </span>
            <p className="text-2xl font-black text-[var(--foreground)]">
              {formatCurrencyValue(totalExpenses, user?.currency || 'EUR', language)}
            </p>
          </div>
          <div className="w-20 h-10 flex items-end gap-[3px]">
            <div className="bg-error/20 h-[50%] w-full rounded-t-xs"></div>
            <div className="bg-error/40 h-[35%] w-full rounded-t-xs"></div>
            <div className="bg-error h-full w-full rounded-t-xs"></div>
            <div className="bg-error/60 h-[70%] w-full rounded-t-xs"></div>
          </div>
        </div>
      </div>

      {/* 3. Cash Flow Chart */}
      <section className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider">{t.cashFlow}</h3>
            <p className="text-xs text-muted-foreground font-medium">{t.last30Days}</p>
          </div>
          <select className="bg-muted border-none rounded-xl text-xs font-bold py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-[var(--primary)] outline-none cursor-pointer">
            <option>{t.last30Days}</option>
            <option>{t.last3Months}</option>
            <option>{t.currentYear}</option>
          </select>
        </div>
        
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncomes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--error)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--error)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: 'var(--muted-foreground)' }} />
              <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: 'var(--muted-foreground)' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  borderColor: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '12px',
                  color: 'var(--foreground)'
                }} 
              />
              <Area type="monotone" dataKey="incomes" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorIncomes)" />
              <Area type="monotone" dataKey="expenses" stroke="var(--error)" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorExpenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 4. Transactions List & Smart Analysis Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider">{t.recentTransactions}</h3>
            <Link href="/expenses" className="text-[var(--primary)] font-bold text-xs hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> {t.addGastoQuick}
            </Link>
          </div>
          
          <div className="space-y-1">
            {recentActivities.length > 0 ? (
              recentActivities.map((t: any, idx) => {
                const IconComp = t.icon;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-xl group animate-in fade-in duration-200">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.colorClass}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--foreground)]">{t.description}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {t.category === 'Nómina' || t.category === 'Salary' ? t.nomina : 
                           t.category === 'Freelance' ? t.freelance : 
                           t.category === 'Inversiones' || t.category === 'Investments' ? t.inversiones :
                           t.category === 'Alimentación' || t.category === 'Food' ? t.alimentacion : 
                           t.category === 'Transporte' || t.category === 'Transport' ? t.transporte : 
                           t.category === 'Ocio' || t.category === 'Leisure' ? t.ocio : t.category} • {t.date}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-extrabold ${t.type === 'expense' ? 'text-error' : 'text-[var(--primary)]'}`}>
                      {t.type === 'expense' ? '-' : '+'}{formatCurrencyValue(t.amount, user?.currency || 'EUR', language)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3 stroke-[1.5]" />
                <p className="text-sm font-bold text-[var(--foreground)]">
                  {language === 'es' ? 'No hay transacciones aún' : 'No transactions registered yet'}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  {language === 'es' 
                    ? 'Tus ingresos y gastos recientes aparecerán aquí una vez que los registres.' 
                    : 'Your recent incomes and expenses will appear here once registered.'}
                </p>
              </div>
            )}
          </div>
          
          <Link 
            href="/expenses"
            className="w-full block text-center mt-6 py-3 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-all cursor-pointer"
          >
            {t.verHistorialCompleto}
          </Link>
        </div>

        {/* "Asesor Financiero IA" Smart Dashboard Card */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-3 top-3 opacity-5 group-hover:scale-110 transition-all pointer-events-none">
            <Sparkles className="w-20 h-20 text-[var(--primary)]" />
          </div>

          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--primary)] animate-pulse" />
                  {language === 'es' ? 'Asistente IA OpenRouter' : 'OpenRouter AI Coach'}
                </span>
                <h3 className="text-lg font-black text-[var(--foreground)]">
                  {language === 'es' ? 'Asesor Financiero' : 'Financial Advisor'}
                </h3>
              </div>
              
              <button
                onClick={() => fetchAdvisorTips(language)}
                disabled={loadingTips || (incomes.length === 0 && expenses.length === 0)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                title={language === 'es' ? 'Recargar Consejos' : 'Reload Advice'}
              >
                <svg className={`w-4 h-4 ${loadingTips ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>

            {incomes.length === 0 && expenses.length === 0 ? (
              <div className="py-8 px-4 text-center bg-muted/10 border border-dashed border-border/40 rounded-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-3 border border-[var(--primary)]/20">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Descubre tu Asesor de IA' : 'Discover your AI Coach'}
                </h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[220px]">
                  {language === 'es'
                    ? 'Registra tus primeros movimientos en FinControl para recibir consejos inteligentes y personalizados de ahorro e inversión.'
                    : 'Register your first movements in FinControl to receive smart, personalized saving and investment advice.'}
                </p>
              </div>
            ) : loadingTips ? (
              <div className="space-y-3 py-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex flex-col gap-2 p-3 bg-muted/20 border border-border/50 rounded-xl">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-muted-foreground/20 rounded-md w-1/3"></div>
                      <div className="h-4 bg-muted-foreground/20 rounded-md w-12"></div>
                    </div>
                    <div className="h-3 bg-muted-foreground/10 rounded-md w-full"></div>
                    <div className="h-3 bg-muted-foreground/10 rounded-md w-5/6"></div>
                  </div>
                ))}
              </div>
            ) : advisorTips.length > 0 ? (
              <div className="space-y-3 py-1">
                {advisorTips.map((tip, idx) => (
                  <div key={idx} className="p-3 bg-muted/20 hover:bg-muted/40 border border-border/50 rounded-xl transition-all duration-200 flex flex-col gap-1.5 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${getCategoryBadgeColor(tip.category)}`}>
                        {tip.category}
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-extrabold uppercase ${getImpactBadgeColor(tip.impact)}`}>
                        {language === 'es' ? 'Impacto' : 'Impact'}: {tip.impact}
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-[var(--foreground)] tracking-tight">
                      {tip.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-muted/10 border border-dashed border-border/50 rounded-xl">
                <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs font-bold text-muted-foreground">
                  {language === 'es' ? 'No se pudieron generar consejos' : 'Could not generate advice'}
                </p>
                <button
                  onClick={() => fetchAdvisorTips(language)}
                  className="mt-2 text-[10px] text-[var(--primary)] font-bold hover:underline cursor-pointer"
                >
                  {language === 'es' ? 'Reintentar ahora' : 'Retry now'}
                </button>
              </div>
            )}
          </div>

          <Link 
            href="/reports" 
            className="w-full text-center mt-6 py-2.5 bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-xs rounded-xl hover:bg-[var(--primary)] hover:text-white transition-all active:scale-98 cursor-pointer"
          >
            {language === 'es' ? 'Ver Análisis Detallado' : 'View Detailed Analysis'}
          </Link>
        </div>

      </div>

      {/* 5. Savings Goals CRUD & Upcoming Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Savings Goals List and CRUD */}
        <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider">
                {language === 'es' ? 'Objetivos de Ahorro' : 'Savings Goals'}
              </h3>
            </div>
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              className="text-[var(--primary)] hover:bg-[var(--primary)]/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              {showGoalForm ? t.cancelar : (language === 'es' ? 'Crear Meta' : 'Create Goal')}
            </button>
          </div>

          {/* New Savings Goal Form */}
          {showGoalForm && (
            <form onSubmit={handleCreateGoal} className="p-4 bg-muted/20 border border-border rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
              <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider">
                {language === 'es' ? 'Nueva Meta de Ahorro' : 'New Savings Goal'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'es' ? 'Nombre' : 'Name'}</label>
                  <input
                    type="text"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    placeholder="e.g. Fondo de Emergencias"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'es' ? 'Monto Objetivo ($)' : 'Target Amount ($)'}</label>
                  <input
                    type="number"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    placeholder="e.g. 5000"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'es' ? 'Fecha Objetivo' : 'Target Date'}</label>
                  <input
                    type="date"
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="submit" 
                  disabled={savingGoal}
                  className="px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-xs font-bold hover:opacity-95 transition-all shadow-xs cursor-pointer"
                >
                  {savingGoal ? (language === 'es' ? 'Guardando...' : 'Saving...') : (language === 'es' ? 'Crear' : 'Create')}
                </button>
              </div>
            </form>
          )}

          {/* Savings Goals Listings */}
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {goals.length > 0 ? (
              goals.map((g) => {
                const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
                
                const today = new Date();
                today.setHours(0,0,0,0);
                const target = new Date(g.targetDate);
                target.setHours(0,0,0,0);
                const diffTime = target.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const daysRemaining = diffDays >= 0 ? diffDays : 0;

                const isDepositingThisGoal = selectedGoalId === g.id;

                return (
                  <div key={g.id} className="p-4 bg-muted/10 border border-border/60 rounded-xl space-y-3 relative group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                          <PiggyBank className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--foreground)]">{g.name}</h4>
                          <span className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {language === 'es' ? `Límite: ${g.targetDate} (${daysRemaining} días restantes)` : `Due: ${g.targetDate} (${daysRemaining} days left)`}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (isDepositingThisGoal) {
                              setSelectedGoalId(null);
                            } else {
                              setSelectedGoalId(g.id);
                            }
                          }}
                          className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-[10px] font-black hover:bg-[var(--primary)] hover:text-white transition-all cursor-pointer"
                        >
                          {isDepositingThisGoal ? t.cancelar : (language === 'es' ? '+ ABONAR' : '+ DEPOSIT')}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="p-1 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar Meta / Delete Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Deposit Form Area */}
                    {isDepositingThisGoal && (
                      <form onSubmit={handleGoalDeposit} className="flex gap-2 p-2.5 bg-card border border-border/80 rounded-xl animate-in slide-in-from-top-2 duration-150">
                        <div className="relative flex-1">
                          <DollarSign className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-1 bg-muted/30 border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-[var(--primary)] font-semibold"
                            placeholder={language === 'es' ? 'Monto a depositar' : 'Amount to deposit'}
                            min={1}
                            required
                          />
                        </div>
                        <button 
                          type="submit" 
                          className="px-4 py-1 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-xs font-bold hover:opacity-95 transition-all shadow-xs cursor-pointer font-semibold"
                        >
                          {language === 'es' ? 'Abonar' : 'Deposit'}
                        </button>
                      </form>
                    )}

                    {/* Progress indicators */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                        <span>{pct}% {language === 'es' ? 'completado' : 'completed'}</span>
                        <span className="text-[var(--foreground)] font-extrabold">
                          {formatCurrencyValue(Number(g.currentAmount), user?.currency || 'EUR', language)} <span className="text-[10px] text-muted-foreground font-bold">/ {formatCurrencyValue(Number(g.targetAmount), user?.currency || 'EUR', language)}</span>
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden border border-border/10">
                        <div 
                          className="h-full bg-[var(--primary)] rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center bg-muted/10 border border-dashed border-border/50 rounded-xl">
                <PiggyBank className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2 stroke-[1.5]" />
                <p className="text-xs font-bold text-muted-foreground">
                  {language === 'es' ? 'No tienes metas de ahorro aún' : 'No savings goals set yet'}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  {language === 'es' ? 'Crea tu primera meta haciendo clic en "Crear Meta" arriba.' : 'Create your first goal by clicking "Create Goal" above.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Bills Column */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider mb-6">{t.upcomingBills}</h3>
            <div className="space-y-4">
              {invoices.filter(inv => inv.status === 'pending').slice(0, 2).map((inv, idx) => (
                <div key={idx} className={`p-4 bg-background rounded-xl border-l-4 ${idx === 0 ? 'border-error' : 'border-indigo-500'} flex items-center gap-4 shadow-2xs`}>
                  <div className={`p-2 rounded-lg ${idx === 0 ? 'bg-error/10 text-error' : 'bg-indigo-500/10 text-indigo-500'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--foreground)] truncate">{inv.name}</p>
                    <p className="text-xs text-muted-foreground font-medium">{t.vencimiento}: {inv.dueDate}</p>
                  </div>
                  <p className="text-sm font-extrabold">{formatCurrencyValue(inv.amount, user?.currency || 'EUR', language)}</p>
                </div>
              ))}
              
              {invoices.filter(inv => inv.status === 'pending').length === 0 && (
                <div className="py-8 text-center bg-background/50 rounded-xl border border-dashed border-border/60">
                  <AlertCircle className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-xs font-bold text-[var(--foreground)]">
                    {language === 'es' ? 'No hay facturas pendientes' : 'No pending bills'}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {language === 'es' ? '¡Buen trabajo! Estás al día con tus pagos.' : 'Great job! You are up to date.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
