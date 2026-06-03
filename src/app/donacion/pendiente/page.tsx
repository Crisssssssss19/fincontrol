'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

export default function DonationPendingPage() {
  const { language } = useLanguageStore();

  useEffect(() => {
    document.title = `${language === 'es' ? 'Donación Pendiente' : 'Donation Pending'} - FinControl`;
  }, [language]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 max-w-md w-full shadow-lg relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-amber-500/10 rounded-full blur-xl" />
        
        <div className="relative space-y-6">
          {/* Clock Icon */}
          <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 scale-100 animate-pulse">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
              {language === 'es' ? 'Pago en Trámite' : 'Payment Processing'}
            </h1>
            <p className="text-base font-bold text-amber-500 dark:text-amber-400">
              {language === 'es' ? 'Tu donación está siendo procesada.' : 'Your donation is being processed.'}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed pt-2">
              {language === 'es' 
                ? 'Mercado Pago nos notificará en cuanto se apruebe la transacción. Normalmente esto se procesa en unos minutos. Te enviaremos una notificación cuando esté confirmado.'
                : 'Mercado Pago will notify us as soon as the transaction is approved. This usually takes just a few minutes. We will send you a system notification when confirmed.'}
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
        </div>
      </div>
    </div>
  );
}
