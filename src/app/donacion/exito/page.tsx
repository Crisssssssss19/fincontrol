'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, Loader2, Sparkles, Heart } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

function DonationSuccessContent() {
  const { language } = useLanguageStore();
  const searchParams = useSearchParams();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null);

  useEffect(() => {
    document.title = `${language === 'es' ? 'Donación Exitosa' : 'Donation Successful'} - FinControl`;
    
    const confirmPayment = async () => {
      const gateway = searchParams.get('gateway');
      const preferenceId = searchParams.get('preferenceId');
      const amountStr = searchParams.get('amount');

      if (gateway === 'paypal' && preferenceId) {
        setIsProcessing(true);
        try {
          const res = await fetch('/api/donaciones/confirmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferenceId })
          });

          if (res.ok) {
            const amount = parseFloat(amountStr || '0');
            if (amount > 0) {
              setConfirmedAmount(amount);
              // Update local storage progress cache immediately
              const cached = localStorage.getItem('fincontrol_donation_progress');
              const currentRaised = parseFloat(cached || '0');
              localStorage.setItem('fincontrol_donation_progress', String(currentRaised + amount));
            }
          }
        } catch (err) {
          console.error('Error confirming PayPal payment on success page:', err);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    confirmPayment();
  }, [searchParams, language]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 max-w-md w-full shadow-lg relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl" />
        <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-[var(--primary)]/10 rounded-full blur-xl" />
        
        <div className="relative space-y-6">
          {isProcessing ? (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
              <h2 className="text-lg font-black text-[var(--foreground)]">
                {language === 'es' ? 'Confirmando donación...' : 'Confirming donation...'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {language === 'es' 
                  ? 'Estamos validando tu pago con PayPal para actualizar el progreso mensual.' 
                  : 'We are validating your payment with PayPal to update the monthly progress.'}
              </p>
            </div>
          ) : (
            <>
              {/* Check Circle Icon */}
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20 scale-100 animate-[bounce_1s_ease-in-out] relative">
                <CheckCircle2 className="w-12 h-12 fill-current text-emerald-500" />
                {confirmedAmount !== null && (
                  <Heart className="w-5 h-5 fill-current text-red-500 absolute -bottom-1 -right-1 animate-pulse" />
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                  {language === 'es' ? '¡Donación Completada!' : 'Donation Completed!'}
                </h1>
                <p className="text-base font-bold text-emerald-500 dark:text-emerald-400">
                  {language === 'es' ? 'Gracias por apoyar FinControl ❤️' : 'Thanks for supporting FinControl ❤️'}
                </p>
                
                {confirmedAmount !== null && (
                  <div className="bg-muted/40 p-3 rounded-xl border border-border/40 my-3 inline-block">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block tracking-wider mb-0.5">
                      {language === 'es' ? 'Monto Aportado' : 'Contributed Amount'}
                    </span>
                    <span className="text-xl font-black text-emerald-500">
                      ${confirmedAmount.toFixed(2)} USD
                    </span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                  {language === 'es' 
                    ? 'Tu contribución voluntaria nos ayuda directamente a cubrir los costos operativos de hosting, dominios y servidores, impulsando el desarrollo de nuevas funciones.'
                    : 'Your voluntary contribution helps us cover operational costs for hosting, domains, and servers, driving the development of new features.'}
                </p>
              </div>

              <div className="pt-4">
                <Link 
                  href="/dashboard"
                  className="w-full py-3 px-6 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-2xl font-black text-xs shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>{language === 'es' ? 'Ir al Dashboard' : 'Go to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-muted-foreground">Cargando confirmación...</span>
      </div>
    }>
      <DonationSuccessContent />
    </Suspense>
  );
}
