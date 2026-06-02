'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { Wallet, ShieldCheck, Mail, RefreshCw, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const { language } = useLanguageStore();
  const t = translations[language] || translations['es'];

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Timer state for expiration (15 minutes = 900 seconds)
  const [expirationSeconds, setExpirationSeconds] = useState(900);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Expiration countdown
  useEffect(() => {
    if (expirationSeconds <= 0) return;
    const interval = setInterval(() => {
      setExpirationSeconds(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [expirationSeconds]);

  // Resend button cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatExpirationTime = () => {
    const mins = Math.floor(expirationSeconds / 60);
    const secs = expirationSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userId) {
      setError(language === 'es' ? 'Falta el ID del usuario. Vuelve a iniciar sesión.' : 'Missing user ID. Please sign in again.');
      return;
    }

    if (code.length !== 6 || isNaN(Number(code))) {
      setError(language === 'es' ? 'El código debe tener 6 dígitos.' : 'Code must be 6 digits.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setSuccess(language === 'es' ? '¡Correo electrónico verificado con éxito! Redirigiendo...' : 'Email successfully verified! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !userId) return;

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'verification' }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setSuccess(language === 'es' ? 'Se ha enviado un nuevo código de verificación.' : 'A new verification code has been sent.');
      setResendCooldown(60); // 1 minute cooldown
      setExpirationSeconds(900); // Reset general expiration timer to 15 mins
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] space-y-8 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Branding header */}
      <div className="flex items-center gap-2 justify-center">
        <Wallet className="text-[var(--primary)] w-8 h-8" />
        <h1 className="text-2xl font-black text-[var(--primary)]">FinControl</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[var(--foreground)]">
            {language === 'es' ? 'Verifica tu Correo Electrónico' : 'Verify Your Email Address'}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {language === 'es' 
              ? 'Introduce el código de 6 dígitos que enviamos a tu dirección de correo electrónico.' 
              : 'Enter the 6-digit code we sent to your email address.'
            }
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 justify-center">
              <Mail className="w-3.5 h-3.5 text-muted-foreground/60" /> {t.emailLabel}
            </label>
            
            <input 
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 6))}
              maxLength={6}
              className="w-full tracking-widest text-center text-2xl font-black px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all" 
              placeholder="000000" 
              type="text"
              disabled={loading || expirationSeconds <= 0}
              required
            />

            {/* Expiration counter */}
            <div className="flex items-center justify-between text-[10px] font-bold mt-1 px-1">
              <span className="text-muted-foreground">
                {language === 'es' ? 'El código expira en:' : 'Code expires in:'}
              </span>
              <span className={`${expirationSeconds <= 60 ? 'text-error animate-pulse' : 'text-[var(--primary)]'}`}>
                {expirationSeconds > 0 ? formatExpirationTime() : (language === 'es' ? 'Expirado' : 'Expired')}
              </span>
            </div>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || expirationSeconds <= 0}
            className="w-full py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {loading 
              ? (language === 'es' ? 'Verificando...' : 'Verifying...') 
              : (language === 'es' ? 'Verificar Código' : 'Verify Code')
            }
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Resend actions */}
        <div className="pt-4 border-t border-border/60 flex flex-col items-center gap-2">
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {resendCooldown > 0 
              ? (language === 'es' ? `Reenviar código en ${resendCooldown}s` : `Resend code in ${resendCooldown}s`)
              : (language === 'es' ? 'Reenviar código de verificación' : 'Resend verification code')
            }
          </button>
          
          <button
            onClick={() => router.push('/auth/login')}
            className="text-xs font-bold text-muted-foreground hover:text-[var(--foreground)] hover:underline mt-2 cursor-pointer"
          >
            {language === 'es' ? 'Volver al inicio de sesión' : 'Back to login'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-sm font-extrabold text-muted-foreground bg-[var(--background)]">
          <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          <span>Cargando...</span>
        </div>
      }>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}
