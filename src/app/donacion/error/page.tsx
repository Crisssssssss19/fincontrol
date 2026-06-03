'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

export default function DonationErrorPage() {
  const { language } = useLanguageStore();

  useEffect(() => {
    document.title = `${language === 'es' ? 'Error en Donación' : 'Donation Error'} - FinControl`;
  }, [language]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 max-w-md w-full shadow-lg relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-red-500/10 rounded-full blur-xl" />
        
        <div className="relative space-y-6">
          {/* Error Cross Icon */}
          <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20 scale-100">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
              {language === 'es' ? 'No se pudo completar' : 'Payment Failed'}
            </h1>
            <p className="text-base font-bold text-red-500 dark:text-red-400">
              {language === 'es' ? 'No fue posible completar la donación.' : 'It was not possible to complete the donation.'}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed pt-2">
              {language === 'es' 
                ? 'Hubo un inconveniente al procesar el pago con Mercado Pago. No se ha realizado ningún cargo a tu cuenta. Puedes intentarlo de nuevo o cambiar el método.'
                : 'There was a problem processing the payment with Mercado Pago. No charges have been made to your account. Please try again.'}
            </p>
          </div>

          <div className="pt-4">
            <Link 
              href="/donaciones"
              className="w-full py-3 px-6 border border-border hover:bg-muted text-muted-foreground rounded-2xl font-black text-xs shadow-xs transition-all flex items-center justify-center gap-2 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>{language === 'es' ? 'Reintentar Donación' : 'Retry Donation'}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
