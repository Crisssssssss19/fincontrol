'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { Wallet, KeyRound, Mail, ShieldAlert, Lock, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = translations[language] || translations['es'];

  // Flow step state: 'email' | 'code' | 'password' | 'success'
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'success'>('email');
  
  // Data states
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codeExpiration, setCodeExpiration] = useState(600); // 10 minutes (600 seconds)
  const [resendCooldown, setResendCooldown] = useState(0);

  // Expiration countdown
  useEffect(() => {
    if (step !== 'code' || codeExpiration <= 0) return;
    const interval = setInterval(() => {
      setCodeExpiration(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, codeExpiration]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRequestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError(language === 'es' ? 'Ingresa tu correo electrónico.' : 'Enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setUserId(data.userId);
      setSuccess(language === 'es' ? 'Código de recuperación enviado.' : 'Recovery code sent successfully.');
      setStep('code');
      setCodeExpiration(600); // Reset timer to 10 mins
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (code.length !== 6 || isNaN(Number(code))) {
      setError(language === 'es' ? 'El código debe tener 6 dígitos.' : 'Code must be 6 digits.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/verify-recovery-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setStep('password');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError(
        language === 'es' 
          ? 'La contraseña debe tener al menos 8 caracteres.' 
          : 'Password must be at least 8 characters.'
      );
      return;
    }

    // Complexity validation
    const hasNumber = /\D*/.test(newPassword) && /\d/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    if (!hasNumber || !hasSpecial) {
      setError(
        language === 'es'
          ? 'La contraseña debe contener al menos un número y un carácter especial.'
          : 'Password must contain at least one number and one special character.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(language === 'es' ? 'Las contraseñas no coinciden.' : 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code, password: newPassword }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !userId) return;

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'recovery' }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setSuccess(language === 'es' ? 'Se ha enviado un nuevo código de recuperación.' : 'A new recovery code has been sent.');
      setResendCooldown(60); // 1 min cooldown
      setCodeExpiration(600); // Reset timer to 10 mins
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-[440px] space-y-8">
        
        {/* Logo header */}
        <div className="flex items-center gap-2 justify-center">
          <Wallet className="text-[var(--primary)] w-8 h-8" />
          <h1 className="text-2xl font-black text-[var(--primary)]">FinControl</h1>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
          
          {/* STEP 1: REQUEST EMAIL */}
          {step === 'email' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <button 
                  onClick={() => router.push('/auth/login')}
                  className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-black text-[var(--foreground)]">{t.recoverPasswordTitle}</h3>
              </div>

              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                {t.recoverPasswordDesc}
              </p>

              <form onSubmit={handleRequestEmail} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground/60" /> {t.emailLabel}
                  </label>
                  <input 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                    placeholder="ejemplo@correo.com" 
                    type="email"
                    required
                  />
                  {error && <p className="text-xs text-error font-medium">{error}</p>}
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (language === 'es' ? 'Enviando...' : 'Sending...') : t.sendRecoveryBtn}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: VERIFY CODE */}
          {step === 'code' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <button 
                  onClick={() => setStep('email')}
                  className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-black text-[var(--foreground)]">
                  {language === 'es' ? 'Verificar Código de Seguridad' : 'Verify Security Code'}
                </h3>
              </div>

              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                {language === 'es'
                  ? `Introduce el código de 6 dígitos que enviamos para restablecer tu contraseña.`
                  : `Enter the 6-digit code we sent you to restore your password.`
                }
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground text-center block w-full">
                    {language === 'es' ? 'Código de 6 dígitos' : '6-digit code'}
                  </label>
                  <input 
                    value={code}
                    onChange={(e) => setCode(e.target.value.slice(0, 6))}
                    maxLength={6}
                    className="w-full tracking-widest text-center text-2xl font-black px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all" 
                    placeholder="000000" 
                    type="text"
                    required
                  />

                  {/* Timer */}
                  <div className="flex items-center justify-between text-[10px] font-bold mt-1 px-1">
                    <span className="text-muted-foreground">
                      {language === 'es' ? 'Expira en:' : 'Expires in:'}
                    </span>
                    <span className={`${codeExpiration <= 60 ? 'text-error animate-pulse' : 'text-[var(--primary)]'}`}>
                      {codeExpiration > 0 ? formatTime(codeExpiration) : (language === 'es' ? 'Expirado' : 'Expired')}
                    </span>
                  </div>
                </div>

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
                  disabled={loading || codeExpiration <= 0}
                  className="w-full py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (language === 'es' ? 'Verificando...' : 'Verifying...') : (language === 'es' ? 'Verificar Código' : 'Verify Code')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-2 flex flex-col items-center gap-2 border-t border-border/60">
                <button
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="text-xs font-bold text-[var(--primary)] hover:underline disabled:opacity-50 cursor-pointer"
                >
                  {resendCooldown > 0
                    ? (language === 'es' ? `Reenviar en ${resendCooldown}s` : `Resend in ${resendCooldown}s`)
                    : (language === 'es' ? 'Reenviar código de recuperación' : 'Resend recovery code')
                  }
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: RESET PASSWORD */}
          {step === 'password' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <h3 className="text-sm font-black text-[var(--foreground)]">
                  {language === 'es' ? 'Nueva Contraseña' : 'New Password'}
                </h3>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/60" /> {language === 'es' ? 'Nueva Contraseña' : 'New Password'}
                  </label>
                  <input 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                    placeholder="••••••••" 
                    type="password"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/60" /> {language === 'es' ? 'Confirmar Nueva Contraseña' : 'Confirm New Password'}
                  </label>
                  <input 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                    placeholder="••••••••" 
                    type="password"
                    required
                  />
                </div>

                <div className="p-3 bg-muted/20 border border-border/60 rounded-xl space-y-1 text-[10px] text-muted-foreground leading-normal">
                  <p className="font-extrabold uppercase text-[9px] text-muted-foreground/80">Requisitos de Seguridad / Security Requirements:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>{language === 'es' ? 'Mínimo 8 caracteres' : 'Minimum 8 characters'}</li>
                    <li>{language === 'es' ? 'Al menos un número' : 'At least one number'}</li>
                    <li>{language === 'es' ? 'Al menos un carácter especial' : 'At least one special character'}</li>
                  </ul>
                </div>

                {error && (
                  <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (language === 'es' ? 'Actualizando...' : 'Updating...') : (language === 'es' ? 'Restablecer Contraseña' : 'Reset Password')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex p-3 bg-emerald-50/10 text-emerald-500 rounded-full mb-2">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h4 className="text-base font-bold text-[var(--foreground)]">
                {language === 'es' ? 'Contraseña Restablecida' : 'Password Reset Successfully'}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {language === 'es'
                  ? 'Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.'
                  : 'Your password has been successfully updated. You can now log in using your new credentials.'
                }
              </p>
              <button 
                onClick={() => router.push('/auth/login')}
                className="w-full mt-4 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs rounded-xl transition-all hover:opacity-90 cursor-pointer shadow-sm"
              >
                {t.backToAccess}
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
