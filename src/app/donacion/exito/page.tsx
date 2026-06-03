'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

export default function DonationSuccessPage() {
  const { language } = useLanguageStore();

  useEffect(() => {
    document.title = `${language === 'es' ? 'Donación Exitosa' : 'Donation Successful'} - FinControl`;
  }, [language]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 max-w-md w-full shadow-lg relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl" />
        <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-[var(--primary)]/10 rounded-full blur-xl" />
        
        <div className="relative space-y-6">
          {/* Check Circle Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20 scale-100 animate-[bounce_1s_ease-in-out]">
            <CheckCircle2 className="w-12 h-12 fill-current text-emerald-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
              {language === 'es' ? '¡Pago Exitoso!' : 'Payment Successful!'}
            </h1>
            <p className="text-base font-bold text-emerald-500 dark:text-emerald-400">
              {language === 'es' ? 'Gracias por apoyar FinControl ❤️' : 'Thanks for supporting FinControl ❤️'}
            </p>
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
        </div>
      </div>
    </div>
  );
}
