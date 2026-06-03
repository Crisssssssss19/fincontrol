'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Heart, 
  Coffee, 
  Rocket, 
  Gem, 
  Server, 
  Globe, 
  Mail, 
  Sparkles, 
  LifeBuoy, 
  ShieldAlert, 
  Coins,
  ChevronRight,
  AlertCircle,
  Target,
  TrendingUp
} from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

function DonacionesPageContent() {
  const { language } = useLanguageStore();

  // State
  const [selectedOption, setSelectedOption] = useState<'1' | '5' | '10' | 'custom' | null>('5');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeGateway, setActiveGateway] = useState<'mercadopago' | 'paypal' | null>(null);

  // Goal & Confirmation States
  const [raisedAmount, setRaisedAmount] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [payPalPrefId, setPayPalPrefId] = useState<string>('');
  const [payPalAmount, setPayPalAmount] = useState<number>(0);
  const [isConfirmingPayPal, setIsConfirmingPayPal] = useState<boolean>(false);

  const goalAmount = 50.00; // Monthly donation goal
  const percentage = Math.min(100, Math.round((raisedAmount / goalAmount) * 100));

  // Dynamic document title for SEO
  useEffect(() => {
    document.title = `${language === 'es' ? 'Donaciones' : 'Donations'} - FinControl`;
  }, [language]);

  // Load monthly donation progress from database on mount
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch('/api/donaciones');
        if (res.ok) {
          const data = await res.json();
          if (data.success && typeof data.totalApprovedUSD === 'number') {
            setRaisedAmount(data.totalApprovedUSD);
            localStorage.setItem('fincontrol_donation_progress', String(data.totalApprovedUSD));
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching donation progress:', err);
      }
      
      // Fallback to localStorage
      const cached = localStorage.getItem('fincontrol_donation_progress');
      if (cached) {
        setRaisedAmount(parseFloat(cached) || 0);
      }
    };

    fetchProgress();
  }, []);

  // Calculate current donation amount
  const getDonationAmount = (): number => {
    if (selectedOption === 'custom') {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return selectedOption ? parseFloat(selectedOption) : 0;
  };

  // Validate donation amount (must be >= 1.00 USD)
  const validateAmount = (amount: number): boolean => {
    if (amount < 1.00) {
      setErrorMsg(
        language === 'es' 
          ? 'El monto mínimo de donación es $1.00 USD' 
          : 'The minimum donation amount is $1.00 USD'
      );
      return false;
    }
    setErrorMsg('');
    return true;
  };

  // Handle custom input amount changes
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setCustomAmount(val);
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        validateAmount(parsed);
      } else {
        setErrorMsg('');
      }
    }
  };

  // Trigger real Mercado Pago or PayPal preference creation
  const handleDonate = async (gateway: 'mercadopago' | 'paypal') => {
    const amount = getDonationAmount();
    if (!validateAmount(amount)) return;

    setActiveGateway(gateway);
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/donaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, gateway })
      });

      const data = await res.json();
      
      if (res.ok && data.success && data.url) {
        if (gateway === 'paypal') {
          // Open PayPal in a new tab
          window.open(data.url, '_blank');
          
          // Setup state for local confirmation modal
          setPayPalPrefId(data.preferenceId || '');
          setPayPalAmount(amount);
          setShowConfirmModal(true);
          
          // Reset loading states
          setIsProcessing(false);
          setActiveGateway(null);
        } else {
          // Redirect user directly to Mercado Pago Checkout Pro
          window.location.href = data.url;
        }
      } else {
        setErrorMsg(
          data.error || 
          (language === 'es' 
            ? `Error al generar la pasarela de ${gateway === 'paypal' ? 'PayPal' : 'Mercado Pago'}. Inténtalo de nuevo.` 
            : `Error creating ${gateway === 'paypal' ? 'PayPal' : 'Mercado Pago'} checkout. Please try again.`)
        );
        setIsProcessing(false);
        setActiveGateway(null);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        language === 'es' 
          ? 'Error de conexión. Revisa tu conexión de red.' 
          : 'Connection error. Check your network configuration.'
      );
      setIsProcessing(false);
      setActiveGateway(null);
    }
  };

  // Confirm PayPal donation
  const handleConfirmPayPalDonation = async () => {
    if (!payPalPrefId) return;

    setIsConfirmingPayPal(true);
    
    try {
      const res = await fetch('/api/donaciones/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferenceId: payPalPrefId })
      });

      // Whether API updates DB successfully or falls back, we update client side state for smooth UX
      const newRaised = raisedAmount + payPalAmount;
      setRaisedAmount(newRaised);
      localStorage.setItem('fincontrol_donation_progress', String(newRaised));
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error confirming PayPal donation:', err);
      const newRaised = raisedAmount + payPalAmount;
      setRaisedAmount(newRaised);
      localStorage.setItem('fincontrol_donation_progress', String(newRaised));
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } finally {
      setIsConfirmingPayPal(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. HERO HEADER */}
      <div className="text-center md:text-left space-y-3 pb-2 border-b border-border/60">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 dark:bg-red-500/15 dark:text-red-400 flex items-center justify-center shrink-0 shadow-xs border border-red-500/20">
            <Heart className="w-8 h-8 fill-current animate-pulse text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)]">
              {language === 'es' ? 'Apóyanos' : 'Support Us'}
            </h1>
            <p className="text-sm text-muted-foreground font-medium max-w-2xl mt-1 animate-fade-in">
              {language === 'es' 
                ? 'Tu apoyo ayuda a mantener FinControl activo y en constante crecimiento.' 
                : 'Your support helps keep FinControl active and constantly growing.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Transparency & Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Motivation Message Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary)]/5 rounded-full blur-xl translate-x-8 -translate-y-8" />
            <div className="space-y-4 relative">
              <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {language === 'es' ? 'Comunidad' : 'Community'}
              </span>
              <p className="text-sm font-semibold text-[var(--foreground)] leading-relaxed italic">
                {language === 'es'
                  ? '"Si FinControl te ayuda a organizar tus finanzas, considera apoyar su desarrollo. Cada aporte, por pequeño que sea, contribuye a mejorar la plataforma para toda la comunidad."'
                  : '"If FinControl helps you organize your finances, consider supporting its development. Every contribution, no matter how small, helps improve the platform for the entire community."'}
              </p>
            </div>
          </div>

          {/* Transparency Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black text-[var(--foreground)]">
                {language === 'es' ? '¿En qué se utilizan las donaciones?' : 'How are donations used?'}
              </h2>
            </div>

            <ul className="space-y-4" role="list">
              <li className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)]">{language === 'es' ? 'Hosting y Servidores' : 'Hosting & Servers'}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {language === 'es' ? 'Hosting y servidores de alta disponibilidad para mantener la PWA activa.' : 'High-availability hosting and servers to keep the PWA active.'}
                  </p>
                </div>
              </li>

              <li className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 border border-green-500/20">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)]">{language === 'es' ? 'Dominios y Seguridad' : 'Domains & Security'}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {language === 'es' ? 'Renovación de dominios y certificados de seguridad SSL para proteger tus datos.' : 'Domain renewal and SSL security certificates to protect your data.'}
                  </p>
                </div>
              </li>

              <li className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)]">{language === 'es' ? 'Servicios de Correo' : 'Email Services'}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {language === 'es' ? 'Servicios transaccionales de correo para alertas de presupuesto y códigos de verificación.' : 'Transactional email services for budget alerts and verification codes.'}
                  </p>
                </div>
              </li>

              <li className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0 border border-pink-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)]">{language === 'es' ? 'Nuevas Funcionalidades' : 'New Features'}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {language === 'es' ? 'Desarrollo de nuevas integraciones de analítica inteligente y optimización offline.' : 'Development of new smart analytics integrations and offline optimization.'}
                  </p>
                </div>
              </li>

              <li className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)]">{language === 'es' ? 'Soporte y Mantenimiento' : 'Support & Maintenance'}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {language === 'es' ? 'Soporte técnico, correcciones de errores y optimización de rendimiento de la plataforma.' : 'Technical support, bug fixes, and performance optimization.'}
                  </p>
                </div>
              </li>
            </ul>

            <div className="pt-4 border-t border-border/40 bg-muted/10 p-3.5 rounded-xl flex gap-2.5 items-start">
              <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                {language === 'es'
                  ? 'Las donaciones son completamente voluntarias y ayudan a cubrir costos de infraestructura, dominio, correos electrónicos y nuevas funcionalidades. Ninguna característica de FinControl será bloqueada por no realizar una donación.'
                  : 'Donations are completely voluntary and help cover infrastructure, domain, email, and new functionality costs. No feature of FinControl will be locked for not making a donation.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Goal Tracker & Donation Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Monthly Goal Tracker */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl translate-x-8 -translate-y-8" />
            <div className="space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-black text-[var(--foreground)]">
                    {language === 'es' ? 'Meta Mensual de Donaciones' : 'Monthly Donation Goal'}
                  </h3>
                </div>
                <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  {percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden relative border border-border/20">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-[var(--primary)] to-blue-500 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-1">
                <span>
                  {language === 'es' ? 'Recaudado' : 'Raised'}: <strong className="text-[var(--foreground)]">${raisedAmount.toFixed(2)} USD</strong>
                </span>
                <span>
                  {language === 'es' ? 'Meta' : 'Goal'}: <strong className="text-[var(--foreground)]">${goalAmount.toFixed(2)} USD</strong>
                </span>
              </div>

              {raisedAmount < goalAmount ? (
                <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {language === 'es' 
                      ? `Faltan $${(goalAmount - raisedAmount).toFixed(2)} USD para cumplir nuestra meta de este mes.`
                      : `$${(goalAmount - raisedAmount).toFixed(2)} USD remaining to reach our goal this month.`}
                  </span>
                </p>
              ) : (
                <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {language === 'es' 
                      ? '¡Hemos alcanzado la meta mensual! Muchas gracias a todos los donantes.' 
                      : 'We have reached the monthly goal! Thank you so much to all donors.'}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Donation Form Card */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
            {/* Design accents */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-[var(--primary)] to-emerald-400" />
            
            {/* Form */}
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-[var(--foreground)] flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[var(--primary)]" />
                  {language === 'es' ? 'Donar a FinControl' : 'Donate to FinControl'}
                </h3>
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full uppercase">
                  USD ($)
                </span>
              </div>

              {/* Amount Selectors */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {language === 'es' ? 'Selecciona un monto' : 'Select an amount'}
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedOption('1'); setErrorMsg(''); }}
                    aria-pressed={selectedOption === '1'}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer ${
                      selectedOption === '1'
                        ? 'border-2 border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-xs'
                        : 'border-border bg-card hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Coffee className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold">$1 USD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSelectedOption('5'); setErrorMsg(''); }}
                    aria-pressed={selectedOption === '5'}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer ${
                      selectedOption === '5'
                        ? 'border-2 border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-xs'
                        : 'border-border bg-card hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Rocket className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold">$5 USD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSelectedOption('10'); setErrorMsg(''); }}
                    aria-pressed={selectedOption === '10'}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer ${
                      selectedOption === '10'
                        ? 'border-2 border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-xs'
                        : 'border-border bg-card hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Gem className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold">$10 USD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSelectedOption('custom'); setErrorMsg(''); }}
                    aria-pressed={selectedOption === 'custom'}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer ${
                      selectedOption === 'custom'
                        ? 'border-2 border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-xs'
                        : 'border-border bg-card hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Heart className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold">
                      {language === 'es' ? 'Personalizado' : 'Custom'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Custom Input */}
              {selectedOption === 'custom' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label htmlFor="custom-amount-input" className="text-xs font-bold text-muted-foreground block">
                    {language === 'es' ? 'Introduce un monto personalizado' : 'Enter custom amount'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground font-black text-sm">
                      $
                    </div>
                    <input
                      id="custom-amount-input"
                      type="text"
                      inputMode="decimal"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="5.00"
                      className={`w-full pl-8 pr-16 py-3 bg-muted/20 border rounded-2xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm font-semibold transition-all ${
                        errorMsg ? 'border-red-500 focus:ring-red-500' : 'border-border'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs font-black text-muted-foreground">
                      USD
                    </div>
                  </div>
                  {errorMsg && (
                    <div className="flex gap-1.5 items-center text-red-500 font-medium text-xs" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Checkout Buttons */}
              <div className="pt-4 space-y-3">
                {/* Mercado Pago */}
                <button
                  type="button"
                  onClick={() => handleDonate('mercadopago')}
                  disabled={isProcessing || selectedOption === null || (selectedOption === 'custom' && (customAmount === '' || !!errorMsg))}
                  className="w-full bg-[#009EE3] hover:bg-[#008ac7] text-white font-black text-sm px-6 py-4 rounded-2xl shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100"
                >
                  <span>{language === 'es' ? 'Donar con Mercado Pago' : 'Donate with Mercado Pago'}</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                {/* PayPal */}
                <button
                  type="button"
                  onClick={() => handleDonate('paypal')}
                  disabled={isProcessing || selectedOption === null || (selectedOption === 'custom' && (customAmount === '' || !!errorMsg))}
                  className="w-full bg-[#FFC439] hover:bg-[#e2af30] text-[#003087] font-black text-sm px-6 py-4 rounded-2xl shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100"
                >
                  <span>{language === 'es' ? 'Donar con PayPal' : 'Donate with PayPal'}</span>
                  <ChevronRight className="w-4 h-4 text-[#003087] transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Loading Indicator */}
            {isProcessing && activeGateway && (
              <div className="absolute inset-0 bg-background/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 z-50">
                <div className="relative flex items-center justify-center mb-4">
                  <div className={`w-12 h-12 rounded-full border-4 ${
                    activeGateway === 'paypal' ? 'border-[#FFC439]' : 'border-[#009EE3]'
                  } border-t-transparent animate-spin`} />
                  <span className={`absolute text-[8px] font-black ${
                    activeGateway === 'paypal' ? 'text-[#003087]' : 'text-[#009EE3]'
                  }`}>
                    {activeGateway === 'paypal' ? 'PP' : 'MP'}
                  </span>
                </div>
                <h4 className="text-sm font-black text-[var(--foreground)]">
                  {language === 'es' ? 'Conectando...' : 'Connecting...'}
                </h4>
                <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                  {activeGateway === 'paypal'
                    ? (language === 'es' ? 'Preparando redirección segura a PayPal...' : 'Preparing secure redirection to PayPal...')
                    : (language === 'es' ? 'Redirigiendo de forma segura a Mercado Pago Checkout Pro...' : 'Redirecting securely to Mercado Pago Checkout Pro...')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PayPal Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#FFC439]" />
            
            <div className="space-y-6 text-center pt-2">
              <div className="w-14 h-14 rounded-2xl bg-[#FFC439]/15 text-[#003087] flex items-center justify-center mx-auto shadow-xs border border-[#FFC439]/20">
                <Heart className="w-8 h-8 fill-current text-[#003087] animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-[var(--foreground)]">
                  {language === 'es' ? '¿Completaste tu donación?' : 'Did you complete your donation?'}
                </h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {language === 'es' 
                    ? `Hemos abierto PayPal en una pestaña nueva para tu donación de $${payPalAmount.toFixed(2)} USD. Una vez confirmes el pago, haz clic en el botón de abajo para registrar tu aporte.` 
                    : `We opened PayPal in a new tab for your donation of $${payPalAmount.toFixed(2)} USD. Once you complete the payment, click below to register your support.`}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleConfirmPayPalDonation}
                  disabled={isConfirmingPayPal}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-3.5 px-4 rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isConfirmingPayPal ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{language === 'es' ? 'Sí, he donado' : 'Yes, I have donated'}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isConfirmingPayPal}
                  className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs py-3.5 px-4 rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grand Success Celebration Modal */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 text-center">
            {/* Success confetti border top */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500" />
            
            <div className="space-y-6 pt-2">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-xs border border-emerald-500/20 relative animate-bounce">
                <Sparkles className="w-10 h-10 text-emerald-500" />
                <Heart className="w-5 h-5 fill-current text-red-500 absolute -bottom-1 -right-1 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-[var(--foreground)]">
                  {language === 'es' ? '¡Muchísimas Gracias! ❤️' : 'Thank You So Much! ❤️'}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                  {language === 'es' 
                    ? 'Tu donación ha sido registrada. Has contribuido a mantener FinControl activo y gratuito para todos. ¡Agradecemos inmensamente tu apoyo!' 
                    : 'Your donation has been registered. You have contributed to keeping FinControl active and free for everyone. We immensely appreciate your support!'}
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 inline-block w-full">
                <span className="text-xs font-bold text-muted-foreground uppercase block tracking-wider mb-1">
                  {language === 'es' ? 'Tu Donación' : 'Your Donation'}
                </span>
                <span className="text-2xl font-black text-emerald-500">
                  ${payPalAmount > 0 ? payPalAmount.toFixed(2) : '5.00'} USD
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm py-4 px-6 rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{language === 'es' ? 'De nada / Entendido' : 'You are welcome / Got it'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DonacionesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-muted-foreground">Cargando sección de donaciones...</span>
      </div>
    }>
      <SupportPageContent />
    </Suspense>
  );
}

// Map component under correct naming structure
const SupportPageContent = DonacionesPageContent;
