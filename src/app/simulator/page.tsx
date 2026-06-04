'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  TrendingUp, 
  PiggyBank, 
  Percent, 
  Info, 
  Sparkles, 
  Calculator, 
  Calendar,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { translations } from '@/lib/translations';
import { formatCurrencyValue, formatCompactNumber } from '@/utils/currency';

// Dynamically import Recharts to avoid SSR hydration mismatches
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });

export default function SimulatorPage() {
  const { language } = useLanguageStore();
  const t = translations[language] || translations['es'];
  const { user } = useAuthStore();

  // Inputs
  const [initialAmount, setInitialAmount] = useState<number>(5000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(300);
  const [annualRate, setAnnualRate] = useState<number>(8); // 8% average market return
  const [years, setYears] = useState<number>(20);

  // Fetch actual user figures to prefill initial amount and monthly contribution
  useEffect(() => {
    async function loadUserFinances() {
      try {
        const [incRes, expRes] = await Promise.all([
          fetch('/api/incomes').then(r => r.json()),
          fetch('/api/expenses').then(r => r.json()),
        ]);

        if (incRes.success && expRes.success) {
          const totalIncomes = (incRes.incomes || []).reduce((acc: number, curr: any) => acc + curr.amount, 0);
          const totalExpenses = (expRes.expenses || []).reduce((acc: number, curr: any) => acc + curr.amount, 0);
          const balance = totalIncomes - totalExpenses;
          
          if (balance > 0) {
            setInitialAmount(Math.round(balance));
            setMonthlyContribution(Math.max(50, Math.round(balance * 0.15))); // Propose saving 15% of current balance by default
          }
        }
      } catch (err) {
        console.error('Error fetching data for simulator prefill:', err);
      }
    }
    loadUserFinances();
  }, []);

  // Calculation Logic
  const getSimulationData = () => {
    const data = [];
    const monthlyRate = (annualRate / 100) / 12;
    
    let currentBalance = initialAmount;
    let totalContributions = initialAmount;

    // Year 0
    data.push({
      year: 0,
      totalSaved: Math.round(currentBalance),
      contributions: Math.round(totalContributions),
      interest: 0
    });

    for (let year = 1; year <= years; year++) {
      for (let month = 1; month <= 12; month++) {
        currentBalance = currentBalance * (1 + monthlyRate) + monthlyContribution;
        totalContributions += monthlyContribution;
      }
      const interestEarned = currentBalance - totalContributions;
      data.push({
        year,
        totalSaved: Math.round(currentBalance),
        contributions: Math.round(totalContributions),
        interest: Math.round(interestEarned > 0 ? interestEarned : 0)
      });
    }

    return data;
  };

  const simulationData = getSimulationData();
  const finalState = simulationData[simulationData.length - 1];

  // Retirement Planner Calculation using the 4% Safe Withdrawal Rule (SWR)
  const annualPassiveIncome = finalState.totalSaved * 0.04;
  const monthlyPassiveIncome = annualPassiveIncome / 12;

  // Expected retirement target balance calculation based on retirement planner needs
  // (e.g. 25x annual expenses)
  const proposedRetirementExpenses = 2000; // default target per month
  const targetRetirementCapital = proposedRetirementExpenses * 12 * 25;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <section className="bg-card border border-border p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden min-h-[120px]">
        <div className="z-10">
          <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            {language === 'es' ? 'Simulación de Riqueza' : 'Wealth Projection'}
          </p>
          <h1 className="text-3xl font-black text-[var(--foreground)]">
            {language === 'es' ? 'Simulador de Interés Compuesto' : 'Compound Interest Simulator'}
          </h1>
          <p className="text-xs text-muted-foreground mt-2 max-w-xl leading-relaxed">
            {language === 'es' 
              ? 'Proyecta el crecimiento de tu capital a largo plazo gracias al interés compuesto y planifica tu libertad financiera.' 
              : 'Project your long-term capital growth using compound interest and plan your financial freedom.'}
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-white/5 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Grid Layout: Config VS Chart & Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
        
        {/* Left Column: Configuration Controls */}
        <div className="xl:col-span-4 bg-card p-6 rounded-2xl shadow-sm border border-border space-y-6">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider">
              {language === 'es' ? 'Configuración' : 'Configuration'}
            </h2>
          </div>

          <div className="space-y-5">
            {/* Initial Capital */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-muted-foreground">{language === 'es' ? 'Depósito Inicial' : 'Initial Deposit'}</span>
                <span className="font-extrabold text-[var(--foreground)] bg-muted/60 px-2 py-0.5 rounded-md">
                  {formatCurrencyValue(initialAmount, user?.currency || 'EUR', language)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">$</span>
                <input 
                  type="number" 
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-7 pr-3 py-2 bg-muted/30 border border-border rounded-xl outline-none text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-muted-foreground">{language === 'es' ? 'Aporte Mensual' : 'Monthly Contribution'}</span>
                <span className="font-extrabold text-[var(--foreground)] bg-muted/60 px-2 py-0.5 rounded-md">
                  {formatCurrencyValue(monthlyContribution, user?.currency || 'EUR', language)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">$</span>
                <input 
                  type="number" 
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-7 pr-3 py-2 bg-muted/30 border border-border rounded-xl outline-none text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
              <input 
                type="range"
                min="0"
                max="5000"
                step="50"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full accent-[var(--primary)] h-1 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Annual Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-muted-foreground">{language === 'es' ? 'Tasa de Interés Anual' : 'Annual Interest Rate'}</span>
                <span className="font-extrabold text-[var(--foreground)] bg-muted/60 px-2 py-0.5 rounded-md">
                  {annualRate}%
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold"><Percent className="w-3.5 h-3.5" /></span>
                <input 
                  type="number" 
                  value={annualRate}
                  step="0.1"
                  onChange={(e) => setAnnualRate(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-3 py-2 bg-muted/30 border border-border rounded-xl outline-none text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
              <input 
                type="range"
                min="1"
                max="25"
                step="0.5"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full accent-[var(--primary)] h-1 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Years */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-muted-foreground">{language === 'es' ? 'Años de Ahorro' : 'Investment Period'}</span>
                <span className="font-extrabold text-[var(--foreground)] bg-muted/60 px-2 py-0.5 rounded-md">
                  {years} {language === 'es' ? 'años' : 'years'}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold"><Calendar className="w-3.5 h-3.5" /></span>
                <input 
                  type="number" 
                  value={years}
                  onChange={(e) => setYears(Math.max(1, Math.min(50, Number(e.target.value))))}
                  className="w-full pl-8 pr-3 py-2 bg-muted/30 border border-border rounded-xl outline-none text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
              <input 
                type="range"
                min="1"
                max="50"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-[var(--primary)] h-1 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-2 text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-extrabold uppercase text-[var(--primary)] flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              {language === 'es' ? '¿Cómo funciona?' : 'How does it work?'}
            </span>
            <p>
              {language === 'es' 
                ? 'El simulador asume que reinviertes todos los intereses generados cada mes. La tasa anual recomendada oscila entre el 7% y el 10% (promedio histórico del S&P 500).'
                : 'The simulator assumes that all monthly interest is reinvested. Recommended market returns fluctuate between 7% and 10% (historical S&P 500 average).'}
            </p>
          </div>
        </div>

        {/* Right Column: Visual Dashboard */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'es' ? 'Patrimonio Final' : 'Final Net Worth'}</span>
              <p className="text-2xl font-black text-[var(--primary)]">{formatCurrencyValue(finalState.totalSaved, user?.currency || 'EUR', language)}</p>
            </div>
            
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'es' ? 'Total Aportado' : 'Total Contributions'}</span>
              <p className="text-2xl font-black text-[var(--foreground)]">{formatCurrencyValue(finalState.contributions, user?.currency || 'EUR', language)}</p>
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'es' ? 'Intereses Generados' : 'Compound Interest'}</span>
              <p className="text-2xl font-black text-emerald-500">{formatCurrencyValue(finalState.interest, user?.currency || 'EUR', language)}</p>
            </div>
          </div>

          {/* Projection Area Chart */}
          <section className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider">{language === 'es' ? 'Curva de Crecimiento' : 'Capital Accumulation Curve'}</h3>
                <p className="text-xs text-muted-foreground font-medium">{language === 'es' ? 'Evolución de aportaciones e intereses' : 'Growth path over the investment period'}</p>
              </div>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulationData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorContributed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--muted-foreground)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--muted-foreground)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: 'var(--muted-foreground)' }} />
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
                      if (name === 'totalSaved') displayName = language === 'es' ? 'Capital Total' : 'Total capital';
                      else if (name === 'contributions') displayName = language === 'es' ? 'Aportaciones' : 'Contributions';
                      return [formattedValue, displayName];
                    }}
                  />
                  <Area type="monotone" dataKey="totalSaved" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSaved)" />
                  <Area type="monotone" dataKey="contributions" stroke="var(--muted-foreground)" strokeWidth={2} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorContributed)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Retirement Planner (4% rule/SWR card) */}
          <section className="bg-gradient-to-r from-[var(--primary)]/10 to-teal-500/5 border border-border p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
            <div className="absolute right-3 top-3 opacity-5 pointer-events-none">
              <PiggyBank className="w-24 h-24 text-[var(--primary)]" />
            </div>

            <div className="space-y-2 z-10 flex-1">
              <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                {language === 'es' ? 'Planificación de Libertad Financiera' : 'Financial Freedom Plan'}
              </span>
              <h3 className="text-lg font-black text-[var(--foreground)]">
                {language === 'es' ? 'Regla del 4% (Retiro Seguro)' : 'The 4% Safe Withdrawal Rule'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                {language === 'es' 
                  ? 'Si dejas de trabajar una vez acumulado este capital y retiras el 4% anual para cubrir tus gastos, tu capital tiene una probabilidad del 95% de durar al menos 30 años sin agotarse.'
                  : 'If you stop working once this capital is accumulated and withdraw 4% annually to cover expenses, your capital has a 95% probability of lasting at least 30 years without running out.'}
              </p>
            </div>

            <div className="bg-card p-5 border border-border rounded-xl text-center shadow-xs shrink-0 w-full md:w-auto z-10">
              <span className="text-[10px] text-muted-foreground font-bold block uppercase mb-1">
                {language === 'es' ? 'Ingreso Pasivo Mensual' : 'Monthly Passive Income'}
              </span>
              <span className="text-3xl font-black text-[var(--primary)] block tracking-tight">
                {formatCurrencyValue(monthlyPassiveIncome, user?.currency || 'EUR', language)}
              </span>
              <span className="text-[9px] text-muted-foreground mt-2 block font-semibold">
                {language === 'es' ? `Capital total: ${formatCompactNumber(finalState.totalSaved)}` : `Total capital: ${formatCompactNumber(finalState.totalSaved)}`}
              </span>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
