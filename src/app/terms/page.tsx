'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Globe, Wallet, ShieldCheck, Scale, Info, Sparkles } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';

function TermsContent() {
  const { language, setLanguage } = useLanguageStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Set page title for SEO
  useEffect(() => {
    document.title = `${language === 'es' ? 'Términos y Condiciones' : 'Terms and Conditions'} - FinControl`;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const handleBack = (accepted: boolean = false) => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      const mode = searchParams.get('mode') || 'signin';
      const acceptedParam = accepted ? '&accepted=true' : '';
      router.push(`/auth/login?mode=${mode}${acceptedParam}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      {/* 1. Header Area (for guests, or clean view) */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 pb-4 border-b border-border/60">
        <button
          onClick={() => handleBack(false)}
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-[var(--foreground)] transition-colors active:scale-95 cursor-pointer bg-card border border-border px-3.5 py-2 rounded-xl shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'es' ? 'Volver' : 'Back'}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-card border border-border p-1.5 flex items-center justify-center shadow-xs border-[var(--primary)]/10">
            <img src="/logo.png" alt="FinControl Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-black text-[var(--primary)] tracking-tight">FinControl</span>
        </div>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-[var(--foreground)] transition-colors active:scale-95 cursor-pointer bg-card border border-border px-3.5 py-2 rounded-xl shadow-2xs"
        >
          <Globe className="w-4 h-4" />
          <span className="uppercase">{language}</span>
        </button>
      </div>

      {/* 2. Main Content Container */}
      <main className="w-full max-w-4xl bg-card border border-border rounded-3xl p-6 md:p-10 shadow-lg space-y-8 animate-in fade-in zoom-in-98 duration-300">
        
        {/* Document Title */}
        <div className="text-center md:text-left space-y-2 pb-6 border-b border-border/40">
          <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            {language === 'es' ? 'Documento Legal' : 'Legal Document'}
          </span>
          <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight pt-2">
            {language === 'es' ? 'Términos y Condiciones de Uso' : 'Terms and Conditions of Use'}
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            {language === 'es' ? 'Última actualización: 3 de junio de 2026' : 'Last updated: June 3, 2026'}
          </p>
        </div>

        {/* Introduction */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {language === 'es'
            ? 'Bienvenido a FinControl. Al utilizar nuestra plataforma, aplicación web progresiva (PWA) y servicios asociados, usted acepta cumplir y quedar sujeto a los siguientes términos y condiciones de uso. Por favor, léalos detenidamente antes de acceder o utilizar nuestros servicios.'
            : 'Welcome to FinControl. By using our platform, progressive web application (PWA), and associated services, you agree to comply with and be bound by the following terms and conditions of use. Please read them carefully before accessing or using our services.'}
        </p>

        {/* Sections Grid */}
        <div className="space-y-6">
          
          {/* Section 1 */}
          <div className="p-5 bg-muted/15 border border-border/40 rounded-2xl space-y-2">
            <h3 className="text-sm font-black text-[var(--foreground)] flex items-center gap-2">
              <Scale className="w-4.5 h-4.5 text-[var(--primary)]" />
              1. {language === 'es' ? 'Aceptación de los Términos' : 'Acceptance of Terms'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === 'es'
                ? 'El acceso y uso de FinControl implica la aceptación plena de este documento. Si no está de acuerdo con alguna sección o estipulación, deberá abstenerse de utilizar la aplicación.'
                : 'Access and use of FinControl constitutes full acceptance of this document. If you do not agree with any section or stipulation, you must refrain from using the application.'}
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-5 bg-muted/15 border border-border/40 rounded-2xl space-y-2">
            <h3 className="text-sm font-black text-[var(--foreground)] flex items-center gap-2">
              <Wallet className="w-4.5 h-4.5 text-[var(--primary)]" />
              2. {language === 'es' ? 'Descripción del Servicio' : 'Description of Service'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === 'es'
                ? 'FinControl es una herramienta de monitoreo, gestión y organización de finanzas personales. Proporciona funcionalidades offline-first, registro de ingresos y gastos, configuración de límites presupuestarios y recomendaciones asistidas por inteligencia artificial (IA).'
                : 'FinControl is a personal finance monitoring, management, and organization tool. It provides offline-first features, income and expense logging, budget limit settings, and artificial intelligence (AI) assisted recommendations.'}
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-5 bg-muted/15 border border-border/40 rounded-2xl space-y-2">
            <h3 className="text-sm font-black text-[var(--foreground)] flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-[var(--primary)]" />
              3. {language === 'es' ? 'Registro, Seguridad y Cuentas' : 'Registration, Security & Accounts'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === 'es'
                ? 'Usted es responsable de mantener la confidencialidad de su cuenta y contraseña de acceso, así como de habilitar medidas adicionales como la autenticación de doble factor (2FA) cuando corresponda. FinControl no se hace responsable de pérdidas derivadas del acceso no autorizado a su cuenta.'
                : 'You are responsible for maintaining the confidentiality of your account and access password, as well as enabling additional measures such as two-factor authentication (2FA) where applicable. FinControl is not liable for losses arising from unauthorized access to your account.'}
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-5 bg-muted/15 border border-border/40 rounded-2xl space-y-2">
            <h3 className="text-sm font-black text-[var(--foreground)] flex items-center gap-2">
              <Info className="w-4.5 h-4.5 text-[var(--primary)]" />
              4. {language === 'es' ? 'Privacidad y Protección de Datos' : 'Privacy and Data Protection'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === 'es'
                ? 'La privacidad de sus datos es primordial. Sus registros financieros y de perfil se almacenan de manera segura a través de infraestructuras cifradas en Supabase. No comercializamos, alquilamos ni divulgamos sus datos a terceros con fines publicitarios o lucrativos.'
                : 'The privacy of your data is paramount. Your financial and profile records are securely stored via encrypted infrastructure in Supabase. We do not sell, rent, or disclose your data to third parties for advertising or commercial purposes.'}
            </p>
          </div>

          {/* Section 5 - IMPORTANT Disclaimer */}
          <div className="p-5 bg-red-500/5 border border-red-500/10 dark:bg-red-500/10 dark:border-red-500/20 rounded-2xl space-y-2">
            <h3 className="text-sm font-black text-red-600 dark:text-red-400 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-red-500" />
              5. {language === 'es' ? 'Descargo de Responsabilidad y Asesoría de IA' : 'Disclaimer and AI Advice'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === 'es'
                ? 'FinControl NO proporciona asesoramiento financiero, legal o contable profesional. Toda la información, presupuestos y recomendaciones proporcionadas por el Asistente de IA (OpenRouter) se ofrecen únicamente con fines informativos e ilustrativos. Usted es el único responsable de sus decisiones de inversión, ahorro y gasto.'
                : 'FinControl does NOT provide professional financial, legal, or accounting advice. All information, budgets, and recommendations provided by the AI Assistant (OpenRouter) are offered solely for informational and illustrative purposes. You are solely responsible for your investment, savings, and spending decisions.'}
            </p>
          </div>

          {/* Section 6 */}
          <div className="p-5 bg-muted/15 border border-border/40 rounded-2xl space-y-2">
            <h3 className="text-sm font-black text-[var(--foreground)] flex items-center gap-2">
              <Scale className="w-4.5 h-4.5 text-[var(--primary)]" />
              6. {language === 'es' ? 'Donaciones y Financiación' : 'Donations & Funding'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === 'es'
                ? 'FinControl es una plataforma financiada mediante donaciones de la comunidad. Las contribuciones son voluntarias y no garantizan privilegios especiales ni alteran los términos de este contrato. Ninguna funcionalidad se bloqueará para los usuarios que decidan no realizar donaciones.'
                : 'FinControl is a platform funded through community donations. Contributions are voluntary and do not guarantee special privileges or alter the terms of this contract. No features will be locked for users who choose not to make donations.'}
            </p>
          </div>

          {/* Section 7 */}
          <div className="p-5 bg-muted/15 border border-border/40 rounded-2xl space-y-2">
            <h3 className="text-sm font-black text-[var(--foreground)] flex items-center gap-2">
              <Scale className="w-4.5 h-4.5 text-[var(--primary)]" />
              7. {language === 'es' ? 'Modificaciones de los Términos' : 'Modifications to Terms'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === 'es'
                ? 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios se publicarán en esta misma sección, y el uso continuado de la aplicación constituirá la aceptación de los nuevos términos.'
                : 'We reserve the right to modify these terms at any time. Changes will be posted in this section, and continued use of the application will constitute acceptance of the new terms.'}
            </p>
          </div>

        </div>

        {/* Footer Area */}
        <div className="pt-6 border-t border-border/40 text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            {language === 'es'
              ? 'Si tiene preguntas o dudas acerca de estos términos, contáctenos a través de la sección de soporte.'
              : 'If you have questions or concerns about these terms, please contact us through the support section.'}
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <button
              onClick={() => handleBack(true)}
              className="px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition-all active:scale-98 cursor-pointer"
            >
              {language === 'es' ? 'Aceptar y Continuar' : 'Accept and Continue'}
            </button>
          </div>
        </div>

      </main>

      {/* Copyright Notice */}
      <footer className="w-full max-w-4xl text-center mt-8 text-[10px] text-muted-foreground font-semibold">
        &copy; {new Date().getFullYear()} FinControl. {language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
      </footer>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-sm font-extrabold text-muted-foreground bg-[var(--background)]">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        <span>Cargando...</span>
      </div>
    }>
      <TermsContent />
    </Suspense>
  );
}
