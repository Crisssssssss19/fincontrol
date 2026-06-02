'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { Wallet, Mail, Lock, User, ArrowRight, ArrowLeft, CheckCircle, ShieldAlert, X, Info, Globe } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Introduce un correo electrónico válido / Enter a valid email'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres / Password must be at least 6 characters'),
});

const registerSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres / Name must be at least 3 characters'),
  email: z.string().email('Introduce un correo electrónico válido / Enter a valid email'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres / Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirma tu contraseña / Confirm password'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden / Passwords do not match',
  path: ['confirmPassword']
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [detectedGeo, setDetectedGeo] = useState<{ country?: string; currency?: string }>({});
  
  // 2FA state
  const [twoFactorData, setTwoFactorData] = useState<{ userId: string; email: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Google Auth & Sandbox states
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [sandboxEmail, setSandboxEmail] = useState('');
  const [sandboxName, setSandboxName] = useState('');
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);

  const router = useRouter();
  const setSession = useAuthStore(state => state.setSession);
  const { language, setLanguage } = useLanguageStore();

  const t = translations[language] || translations['es'];

  // Google Identity Services script loader
  useEffect(() => {
    console.log("DEBUG: NEXT_PUBLIC_GOOGLE_CLIENT_ID =", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    
    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  const handleGoogleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId || clientId === 'tu_google_client_id_aqui' || clientId === '') {
      // Sandbox fallback
      setSandboxOpen(true);
      return;
    }

    try {
      const google = (window as any).google;
      if (!google || !google.accounts) {
        setSandboxOpen(true);
        return;
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            setIsSigningInGoogle(true);
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.error);
            
            setSession(result.user, result.token);
            router.push('/dashboard');
          } catch (err: any) {
            alert(language === 'es' ? 'Error al iniciar con Google: ' + err.message : 'Google sign-in failed: ' + err.message);
          } finally {
            setIsSigningInGoogle(false);
          }
        }
      });

      google.accounts.id.prompt();
    } catch (err) {
      console.warn('Google Auth initialization failed, opening sandbox:', err);
      setSandboxOpen(true);
    }
  };

  const handleSandboxLogin = async (email: string, name: string, picture: string) => {
    try {
      setIsSigningInGoogle(true);
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          picture,
          isSandbox: true
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      setSandboxOpen(false);
      setSession(result.user, result.token);
      router.push('/dashboard');
    } catch (err: any) {
      alert(language === 'es' ? 'Error en Sandbox de Google: ' + err.message : 'Google Sandbox sign-in failed: ' + err.message);
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Geolocation detector
  useEffect(() => {
    async function detectGeo() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && !data.error) {
          let detectedCurrency = data.currency || 'EUR';
          const detectedCountry = data.country_name || data.country || '';
          
          if (detectedCountry.toLowerCase().includes('colombia') || data.country === 'CO') {
            detectedCurrency = 'COP';
          } else if (detectedCountry.toLowerCase().includes('united states') || data.country === 'US') {
            detectedCurrency = 'USD';
          }

          setDetectedGeo({
            country: detectedCountry,
            currency: detectedCurrency
          });
        }
      } catch (err) {
        console.warn('Geolocation failed, fallback will be used:', err);
      }
    }
    detectGeo();
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Form hooks
  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors, isSubmitting: isSubmittingLogin } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const { register: registerSignup, handleSubmit: handleSubmitSignup, formState: { errors: signupErrors, isSubmitting: isSubmittingSignup } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onLogin = async (data: LoginFormValues) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      if (result.verified === false) {
        // Pending email verification
        router.push(`/auth/verify-email?userId=${result.userId}`);
        return;
      }

      if (result.requires2FA) {
        // 2FA required
        setTwoFactorData({ userId: result.userId, email: result.email });
        setTwoFactorError('');
        return;
      }
      
      setSession(result.user, result.token);
      router.push('/dashboard');
    } catch (err: any) {
      alert(language === 'es' ? 'Error de acceso: ' + err.message : 'Login failed: ' + err.message);
    }
  };

  const onSignup = async (data: RegisterFormValues) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          country: detectedGeo.country || undefined,
          currency: detectedGeo.currency || 'EUR'
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      // Redirect directly to verify email screen
      router.push(`/auth/verify-email?userId=${result.user.id}`);
    } catch (err: any) {
      alert(language === 'es' ? 'Error de registro: ' + err.message : 'Registration failed: ' + err.message);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length !== 6 || isNaN(Number(twoFactorCode))) {
      setTwoFactorError(language === 'es' ? 'El código debe tener 6 dígitos' : 'Code must be 6 digits');
      return;
    }

    try {
      setIsVerifying2FA(true);
      setTwoFactorError('');
      
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: twoFactorData?.userId,
          code: twoFactorCode,
        }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      setSession(result.user, result.token);
      router.push('/dashboard');
    } catch (err: any) {
      setTwoFactorError(err.message);
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleResend2FA = async () => {
    if (!twoFactorData || resendCooldown > 0) return;

    try {
      setResendSuccess(false);
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: twoFactorData.userId,
          type: '2fa'
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      setResendSuccess(true);
      setResendCooldown(60); // 1 minute cooldown
    } catch (err: any) {
      setTwoFactorError(err.message);
    }
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-[var(--background)]">
      {/* Left branding banner (large screens) */}
      <section className="hidden lg:flex flex-1 relative bg-[var(--primary)]/5 flex-col justify-center items-center p-12 overflow-hidden border-r border-border">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl -ml-48 -mb-48"></div>
        
        {/* Floating Quick Language Switcher on Auth Screen */}
        <div className="absolute top-6 left-6 z-10">
          <button 
            type="button"
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted border border-border rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[var(--primary)] animate-pulse" />
            <span className="uppercase text-muted-foreground">{language}</span>
          </button>
        </div>

        <div className="relative z-10 max-w-lg text-center space-y-10">
          {/* 3D floating brand logo container */}
          <div className="relative flex items-center justify-center p-8 w-60 h-60 mx-auto rounded-3xl bg-card border border-border shadow-2xl transition-all duration-500 hover:scale-103 group">
            {/* Glowing gradient aura behind the logo */}
            <div className="absolute inset-0 bg-radial from-[var(--primary)]/8 to-transparent rounded-3xl group-hover:from-[var(--primary)]/12 transition-all"></div>
            <img 
              src="/logo.png" 
              alt="FinControl Premium Logo" 
              className="w-40 h-40 object-contain transition-transform duration-700 ease-out group-hover:rotate-3"
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black text-[var(--primary)] tracking-tight">FinControl</h1>
            <h2 className="text-2xl font-extrabold text-[var(--foreground)] leading-tight">{t.authHeroTitle}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {t.authHeroDesc}
            </p>
          </div>
        </div>
      </section>

      {/* Right form card */}
      <section className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Floating Quick Language Switcher on Auth Mobile Screen */}
        <div className="lg:hidden absolute top-6 right-6 z-10">
          <button 
            type="button"
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border rounded-full text-xs font-bold transition-all shadow-3xs cursor-pointer"
          >
            <span className="uppercase text-muted-foreground">{language}</span>
          </button>
        </div>

        <div className="w-full max-w-[440px] space-y-6">
          
          {/* Mobile/Tablet Prominent Brand Logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 text-center">
            <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center p-3.5 shadow-md animate-fade-in border-[var(--primary)]/10">
              <img src="/logo.png" alt="FinControl Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-black text-[var(--primary)] tracking-tight">FinControl</h1>
            <p className="text-xs text-muted-foreground max-w-xs px-4">
              {language === 'es' ? 'Tu gestor financiero inteligente' : 'Your smart financial manager'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-8 space-y-6">
            
            {/* 2FA PANEL (Rendered overlay-style when active) */}
            {twoFactorData ? (
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-border pb-4">
                  <button 
                    onClick={() => setTwoFactorData(null)}
                    className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-sm font-black text-[var(--foreground)] flex items-center gap-1.5">
                    Verificación de Dos Factores (2FA)
                  </h3>
                </div>

                <div className="p-4 bg-indigo-50/10 border border-indigo-500/20 rounded-xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === 'es'
                      ? `Se ha enviado un código temporal de 6 dígitos al correo electrónico registrado (${twoFactorData.email}). Por favor, introdúcelo a continuación para iniciar sesión.`
                      : `A temporary 6-digit code has been sent to your registered email (${twoFactorData.email}). Please enter it below to complete login.`
                    }
                  </p>
                </div>

                <form onSubmit={handleVerify2FA} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">
                      {language === 'es' ? 'Código de Seguridad (6 dígitos)' : 'Security Code (6 digits)'}
                    </label>
                    <input 
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.slice(0, 6))}
                      maxLength={6}
                      className="w-full tracking-widest text-center text-xl font-bold px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all" 
                      placeholder="000000" 
                      type="text"
                      required
                    />
                    {twoFactorError && <p className="text-xs text-error font-medium">{twoFactorError}</p>}
                  </div>

                  <button 
                    type="submit"
                    disabled={isVerifying2FA}
                    className="w-full py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying2FA
                      ? (language === 'es' ? 'Verificando...' : 'Verifying...')
                      : (language === 'es' ? 'Confirmar Acceso' : 'Confirm Access')
                    }
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="pt-2 flex flex-col items-center gap-2 border-t border-border/60">
                  <button
                    onClick={handleResend2FA}
                    disabled={resendCooldown > 0}
                    className="text-xs font-bold text-[var(--primary)] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0
                      ? (language === 'es' ? `Reenviar código en ${resendCooldown}s` : `Resend code in ${resendCooldown}s`)
                      : (language === 'es' ? 'Reenviar código por correo' : 'Resend code by email')
                    }
                  </button>
                  {resendSuccess && (
                    <p className="text-[10px] text-[var(--primary)] font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {language === 'es' ? 'Código reenviado con éxito' : 'Code successfully resent'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Tabs selector */}
                <div className="flex border-b border-border">
                  <button 
                    onClick={() => setActiveTab('signin')}
                    className={`flex-1 pb-4 text-sm font-bold transition-all border-b-2 text-center cursor-pointer ${
                      activeTab === 'signin' 
                        ? 'text-[var(--primary)] border-[var(--primary)]' 
                        : 'text-muted-foreground border-transparent hover:text-[var(--primary)]'
                    }`}
                  >
                    {t.signIn}
                  </button>
                  <button 
                    onClick={() => setActiveTab('signup')}
                    className={`flex-1 pb-4 text-sm font-bold transition-all border-b-2 text-center cursor-pointer ${
                      activeTab === 'signup' 
                        ? 'text-[var(--primary)] border-[var(--primary)]' 
                        : 'text-muted-foreground border-transparent hover:text-[var(--primary)]'
                    }`}
                  >
                    {t.signUp}
                  </button>
                </div>

                {/* SIGN IN FORM */}
                {activeTab === 'signin' && (
                  <form onSubmit={handleSubmitLogin(onLogin)} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground/60" /> {t.emailLabel}
                      </label>
                      <input 
                        {...registerLogin('email')}
                        className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                        placeholder="ejemplo@correo.com" 
                        type="email"
                      />
                      {loginErrors.email && <p className="text-xs text-error font-medium">{loginErrors.email.message}</p>}
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-muted-foreground/60" /> {t.passwordLabel}
                        </label>
                        <button 
                          type="button" 
                          onClick={() => router.push('/auth/forgot-password')}
                          className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                        >
                          {t.forgotPassword}
                        </button>
                      </div>
                      <input 
                        {...registerLogin('password')}
                        className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                        placeholder="••••••••" 
                        type="password"
                      />
                      {loginErrors.password && <p className="text-xs text-error font-medium">{loginErrors.password.message}</p>}
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmittingLogin}
                      className="w-full py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmittingLogin ? (language === 'es' ? 'Accediendo...' : 'Signing in...') : t.accessPanel}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* SIGN UP FORM */}
                {activeTab === 'signup' && (
                  <form onSubmit={handleSubmitSignup(onSignup)} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground/60" /> {t.fullNameLabel}
                      </label>
                      <input 
                        {...registerSignup('fullName')}
                        className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                        placeholder="Alex Morgan" 
                        type="text"
                      />
                      {signupErrors.fullName && <p className="text-xs text-error font-medium">{signupErrors.fullName.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground/60" /> {t.emailLabel}
                      </label>
                      <input 
                        {...registerSignup('email')}
                        className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                        placeholder="ejemplo@correo.com" 
                        type="email"
                      />
                      {signupErrors.email && <p className="text-xs text-error font-medium">{signupErrors.email.message}</p>}
                    </div>

                    {detectedGeo.country && (
                      <div className="p-2 bg-[var(--primary)]/5 border border-[var(--primary)]/15 rounded-lg flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {language === 'es' ? 'Ubicación detectada:' : 'Detected Location:'}
                        </span>
                        <span className="text-[10px] font-extrabold text-[var(--primary)] uppercase">
                          {detectedGeo.country} ({detectedGeo.currency})
                        </span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground/60" /> {t.passwordLabel}
                      </label>
                      <input 
                        {...registerSignup('password')}
                        className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                        placeholder="••••••••" 
                        type="password"
                      />
                      {signupErrors.password && <p className="text-xs text-error font-medium">{signupErrors.password.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground/60" /> {t.confirmPasswordLabel}
                      </label>
                      <input 
                        {...registerSignup('confirmPassword')}
                        className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                        placeholder="••••••••" 
                        type="password"
                      />
                      {signupErrors.confirmPassword && <p className="text-xs text-error font-medium">{signupErrors.confirmPassword.message}</p>}
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmittingSignup}
                      className="w-full py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmittingSignup ? (language === 'es' ? 'Creando...' : 'Creating...') : t.createAccount}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Social Logins */}
                <div className="pt-2 border-t border-border/60">
                  <div className="relative flex items-center py-3">
                    <div className="flex-grow border-t border-border/40"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.orContinueWith}</span>
                    <div className="flex-grow border-t border-border/40"></div>
                  </div>
                  <div className="mt-2">
                    <button 
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-xl hover:bg-muted transition-all font-bold text-xs text-[var(--foreground)] active:scale-98 cursor-pointer shadow-3xs hover:shadow-2xs"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5.04c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.6 15 1 12 1 7.3 1 3.4 3.7 1.6 7.7l3.9 3C6.4 7.6 9 5.04 12 5.04z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.5 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.9-3z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.6-2.6-6.5-5.7l-3.9 3c1.8 4 5.7 6.7 10.4 6.7z"
                        />
                      </svg>
                      {language === 'es' ? 'Continuar con Google' : 'Continue with Google'}
                    </button>
                  </div>
                </div>
              </>
            )}

            <p className="text-center text-[10px] text-muted-foreground leading-relaxed pt-2">
              {t.termsAndPrivacy}
            </p>
          </div>
        </div>
      </section>

      {/* Sandbox Google Modal */}
      {sandboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div 
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 relative overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Elegant glowing effect */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--primary)]/10 rounded-full blur-2xl"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="FinControl Logo" className="w-9 h-9 rounded-lg object-contain border border-[var(--primary)]/10" />
                <div>
                  <h3 className="text-sm font-black text-[var(--foreground)] tracking-tight">
                    Google Auth Sandbox
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    {language === 'es' ? 'Simulador de desarrollo local' : 'Local development simulator'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSandboxOpen(false)}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-[var(--foreground)] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning info alert */}
            <div className="p-3.5 bg-[var(--primary)]/5 border border-[var(--primary)]/15 rounded-xl mb-5 space-y-1.5">
              <p className="text-[11px] font-bold text-[var(--primary)] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                {language === 'es' ? 'Variables de Google no configuradas' : 'Google keys not configured'}
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {language === 'es' 
                  ? 'No se ha detectado NEXT_PUBLIC_GOOGLE_CLIENT_ID en tu archivo .env.local. Para que pruebes la autenticación instantáneamente, hemos provisto este entorno de simulación que se integra 100% con tu base de datos de Supabase.'
                  : 'NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured in .env.local. To let you test the authentication instantly, we have provided this simulation environment that integrates 100% with your Supabase database.'
                }
              </p>
            </div>

            {/* Profiles title */}
            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-3">
              {language === 'es' ? 'Selecciona un perfil de Gmail' : 'Select a Gmail profile'}
            </h4>

            {/* Interactive Profiles Grid */}
            <div className="space-y-3">
              {[
                { 
                  email: 'sofia.castro@gmail.com', 
                  name: 'Sofía Castro', 
                  picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 
                  role: language === 'es' ? 'Usuario Premium' : 'Premium User' 
                },
                { 
                  email: 'mateo.finanzas@gmail.com', 
                  name: 'Mateo Finanzas', 
                  picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 
                  role: language === 'es' ? 'Usuario Estándar' : 'Standard User' 
                },
                { 
                  email: 'diego.sanchez@gmail.com', 
                  name: 'Diego Sánchez', 
                  picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 
                  role: language === 'es' ? 'Administrador' : 'Administrator' 
                }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSandboxLogin(p.email, p.name, p.picture)}
                  disabled={isSigningInGoogle}
                  className="w-full flex items-center justify-between p-3 border border-border hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-xl transition-all active:scale-[0.99] text-left cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={p.picture} 
                      alt={p.name} 
                      className="w-9 h-9 rounded-full object-cover border border-border group-hover:border-[var(--primary)]/30"
                    />
                    <div>
                      <p className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)] group-hover:border-[var(--primary)]/20 transition-all uppercase">
                    {p.role}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Account Divider */}
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-border/40"></div>
              <span className="flex-shrink mx-3 text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                {language === 'es' ? 'O introduce una cuenta custom' : 'Or type a custom account'}
              </span>
              <div className="flex-grow border-t border-border/40"></div>
            </div>

            {/* Custom Account Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!sandboxEmail) return;
                const name = sandboxName || sandboxEmail.split('@')[0];
                handleSandboxLogin(sandboxEmail, name, '');
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground">
                    {language === 'es' ? 'Nombre (Opcional)' : 'Name (Optional)'}
                  </label>
                  <input 
                    type="text"
                    placeholder="Alex"
                    value={sandboxName}
                    onChange={(e) => setSandboxName(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg outline-none text-xs transition-all focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground">
                    {language === 'es' ? 'Correo Gmail' : 'Gmail Email'}
                  </label>
                  <input 
                    type="email"
                    placeholder="alex@gmail.com"
                    required
                    value={sandboxEmail}
                    onChange={(e) => setSandboxEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg outline-none text-xs transition-all focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningInGoogle || !sandboxEmail}
                className="w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSigningInGoogle 
                  ? (language === 'es' ? 'Iniciando...' : 'Signing in...')
                  : (language === 'es' ? 'Iniciar Sesión en Sandbox' : 'Sign In to Sandbox')
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
