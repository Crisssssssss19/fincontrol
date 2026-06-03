'use client';

import React, { useState, useEffect } from 'react';
import { useThemeStore, FinanceTheme, AccentColor, PrimaryFont, BorderRadius, LayoutDensity, AnimationSpeed } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { 
  Palette, 
  Shield, 
  Key, 
  Smartphone, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle, 
  Sparkles,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'appearance' | 'security'>('appearance');

  // Security Panel states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [toggling2FA, setToggling2FA] = useState(false);
  const [twoFactorSuccess, setTwoFactorSuccess] = useState('');



  const { user, updateUser } = useAuthStore();
  const { language } = useLanguageStore();
  const t = translations[language] || translations['es'];

  // Theme configuration bindings
  const { 
    theme, setTheme,
    accentColor, setAccentColor,
    font, setFont,
    borderRadius, setBorderRadius,
    density, setDensity,
    animations, setAnimations,
    animationSpeed, setAnimationSpeed,
    expenseAlerts, setExpenseAlerts,
    weeklySummary, setWeeklySummary
  } = useThemeStore();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(language === 'es' ? 'Campos incompletos' : 'Incomplete fields');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        language === 'es' 
          ? 'La nueva contraseña debe tener al menos 8 caracteres' 
          : 'New password must be at least 8 characters'
      );
      return;
    }

    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    if (!hasNumber || !hasSpecial) {
      setPasswordError(
        language === 'es'
          ? 'La contraseña debe contener al menos un número y un carácter especial.'
          : 'Password must contain at least one number and one special character.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await fetch('/api/profile/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setPasswordSuccess(language === 'es' ? 'Contraseña actualizada con éxito' : 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordForm(false), 2000);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    try {
      setToggling2FA(true);
      setTwoFactorSuccess('');
      const res = await fetch('/api/profile/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-2fa',
          enabled,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      updateUser({ twoFactorEnabled: enabled });
      setTwoFactorSuccess(
        enabled
          ? (language === 'es' ? 'Doble factor activado con éxito' : 'Two-factor successfully activated')
          : (language === 'es' ? 'Doble factor desactivado' : 'Two-factor deactivated')
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setToggling2FA(false);
    }
  };

  const themes: { id: FinanceTheme; name: string }[] = [
    { id: 'light', name: 'Claro' },
    { id: 'modern_white', name: 'Modern White' },
    { id: 'dark_pro', name: 'Dark Pro' },
    { id: 'midnight', name: 'Midnight' },
    { id: 'dracula', name: 'Dracula' },
    { id: 'cyberpunk', name: 'Cyberpunk' },
    { id: 'amoled', name: 'AMOLED' },
    { id: 'emerald_slate', name: 'Emerald Slate' },
    { id: 'rose_finance', name: 'Rose Finance' },
  ];

  const accents: { id: AccentColor; name: string; color: string }[] = [
    { id: 'emerald', name: 'Emerald', color: 'bg-emerald-500' },
    { id: 'indigo', name: 'Indigo', color: 'bg-indigo-500' },
    { id: 'blue', name: 'Blue', color: 'bg-blue-500' },
    { id: 'purple', name: 'Purple', color: 'bg-purple-500' },
    { id: 'orange', name: 'Orange', color: 'bg-orange-500' },
    { id: 'red', name: 'Red', color: 'bg-red-500' },
    { id: 'rose', name: 'Rose', color: 'bg-rose-500' },
  ];

  const fonts: PrimaryFont[] = ['Inter', 'Poppins', 'Roboto', 'Nunito', 'Montserrat'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-[var(--foreground)]">
          {language === 'es' ? 'Configuración del Sistema' : 'System Settings'}
        </h1>
        <p className="text-xs text-muted-foreground font-medium">
          {language === 'es' ? 'Personaliza tu interfaz y gestiona los métodos de seguridad de tu cuenta.' : 'Personalize your interface and manage security protocols.'}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-1 shrink-0">
        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'appearance'
              ? 'border-[var(--primary)] text-[var(--primary)] font-black'
              : 'border-transparent text-muted-foreground hover:text-[var(--foreground)]'
          }`}
        >
          <Palette className="w-4 h-4" />
          {language === 'es' ? 'Apariencia y UX' : 'Appearance & UX'}
        </button>
        
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'border-[var(--primary)] text-[var(--primary)] font-black'
              : 'border-transparent text-muted-foreground hover:text-[var(--foreground)]'
          }`}
        >
          <Shield className="w-4 h-4" />
          {language === 'es' ? 'Seguridad y 2FA' : 'Security & 2FA'}
        </button>
      </div>

      {/* Dynamic Tabs Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ==================== TAB 1: APPEARANCE & UX ==================== */}
        {activeTab === 'appearance' && (
          <div className="lg:col-span-12 grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in duration-200">
            
            {/* Left Side: Themes and details */}
            <div className="xl:col-span-7 space-y-6">
              <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[var(--primary)]" />
                  <h2 className="text-base font-black text-[var(--foreground)]">{t.visualCustomizer}</h2>
                </div>

                <div className="space-y-5">
                  {/* Theme Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground">{t.themeLabel}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {themes.map((th) => (
                        <button 
                          key={th.id}
                          onClick={() => setTheme(th.id)}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-center transition-all active:scale-[0.98] cursor-pointer ${
                            theme === th.id 
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                              : 'border-border bg-muted/20 hover:bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          {th.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color Selector */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <label className="text-xs font-bold text-muted-foreground">{t.accentColorLabel}</label>
                    <div className="flex flex-wrap gap-2">
                      {accents.map((ac) => (
                        <button 
                          key={ac.id}
                          onClick={() => setAccentColor(ac.id)}
                          title={ac.name}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xs cursor-pointer ${ac.color} ${
                            accentColor === ac.id 
                              ? 'ring-2 ring-offset-2 ring-[var(--foreground)] scale-105' 
                              : 'opacity-90 hover:opacity-100'
                          }`}
                        >
                          {accentColor === ac.id && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Typography Selection */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <label className="text-xs font-bold text-muted-foreground">{t.fontLabel}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {fonts.map((f) => (
                        <button 
                          key={f}
                          onClick={() => setFont(f)}
                          style={{ fontFamily: f }}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-center transition-all active:scale-[0.98] cursor-pointer ${
                            font === f 
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                              : 'border-border bg-muted/20 hover:bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card borders selection */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <label className="text-xs font-bold text-muted-foreground">{t.borderRadiusLabel}</label>
                    <div className="flex gap-2">
                      {(['square', 'rounded', 'ultra_rounded'] as BorderRadius[]).map((r) => (
                        <button 
                          key={r}
                          onClick={() => setBorderRadius(r)}
                          className={`flex-1 px-2.5 py-2.5 rounded-xl border text-[10px] font-bold text-center uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer ${
                            borderRadius === r 
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                              : 'border-border bg-muted/20 hover:bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          {r === 'square' ? t.square : r === 'rounded' ? t.rounded : t.ultraRounded}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </section>
            </div>

            {/* Right Side: Densities, transition and layout options */}
            <div className="xl:col-span-5 space-y-6">
              
              {/* Layout Advanced Settings */}
              <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider">
                  {language === 'es' ? 'Densidad y Transición' : 'Density & Transition'}
                </h3>
                
                <div className="space-y-5">
                  {/* Density selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground">{t.densityLabel}</label>
                    <div className="flex gap-2">
                      {(['compact', 'normal', 'comfortable'] as LayoutDensity[]).map((d) => (
                        <button 
                          key={d}
                          onClick={() => setDensity(d)}
                          className={`flex-1 px-2.5 py-2.5 rounded-xl border text-[10px] font-bold text-center uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer ${
                            density === d 
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                              : 'border-border bg-muted/20 hover:bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          {d === 'compact' ? t.compact : d === 'normal' ? t.normal : t.comfortable}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animations toggling */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground">{t.animationsLabel}</label>
                    <Switch checked={animations} onChange={setAnimations} />
                  </div>

                  {/* Animations speed */}
                  {animations && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="text-xs font-bold text-muted-foreground">{t.animationSpeedLabel}</label>
                      <div className="flex gap-2">
                        {(['fast', 'normal', 'slow'] as AnimationSpeed[]).map((s) => (
                          <button 
                            key={s}
                            onClick={() => setAnimationSpeed(s)}
                            className={`flex-1 px-2.5 py-2.5 rounded-xl border text-[10px] font-bold text-center uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer ${
                              animationSpeed === s 
                                ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                                : 'border-border bg-muted/20 hover:bg-muted/50 text-muted-foreground'
                            }`}
                          >
                            {s === 'fast' ? t.fast : s === 'normal' ? t.normal : t.slow}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Weekly summary and alerts check */}
              <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider">
                  {t.notificaciones}
                </h3>
                
                <div className="space-y-4 divide-y divide-border/40">
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--foreground)]">{t.alertasGasto}</h4>
                      <p className="text-xs text-muted-foreground">{t.alertasGastoDesc}</p>
                    </div>
                    <Switch checked={expenseAlerts} onChange={setExpenseAlerts} />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--foreground)]">{t.resumenSemanal}</h4>
                      <p className="text-xs text-muted-foreground">{t.resumenSemanalDesc}</p>
                    </div>
                    <Switch checked={weeklySummary} onChange={setWeeklySummary} />
                  </div>
                </div>
              </section>

            </div>
            
          </div>
        )}

        {/* ==================== TAB 2: SECURITY & 2FA ==================== */}
        {activeTab === 'security' && (
          <div className="lg:col-span-12 space-y-6 grid grid-cols-1 xl:grid-cols-12 gap-6 xl:space-y-0 animate-in fade-in duration-200">
            
            {/* Left Col - Security Controls */}
            <div className="xl:col-span-7 space-y-6">
              <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[var(--primary)]" />
                  <h2 className="text-base font-black text-[var(--foreground)]">{t.seguridad}</h2>
                </div>
                
                <div className="space-y-4">
                  
                  {/* CHANGE PASSWORD */}
                  <div className="border border-border rounded-xl p-4 space-y-4 bg-muted/5">
                    <div 
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-muted-foreground/60" />
                        <div>
                          <h4 className="text-sm font-bold text-[var(--foreground)]">{t.cambiarContrasena}</h4>
                          <p className="text-[10px] text-muted-foreground">
                            {language === 'es' ? 'Actualiza tu contraseña de acceso' : 'Update your account password'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showPasswordForm ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                    </div>

                    {showPasswordForm && (
                      <form onSubmit={handleChangePassword} className="space-y-4 pt-2 border-t border-border/40 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground">{t.contrasenaActual}</label>
                          <input 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-xs transition-all" 
                            placeholder="••••••••"
                            type="password"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground">{t.contrasenaNueva}</label>
                          <input 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-xs transition-all" 
                            placeholder="••••••••"
                            type="password"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground">{t.contrasenaNuevaConf}</label>
                          <input 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-xs transition-all" 
                            placeholder="••••••••"
                            type="password"
                            required
                          />
                        </div>

                        <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-0.5 text-[9px] text-muted-foreground leading-normal">
                          <span className="font-extrabold uppercase">{language === 'es' ? 'Requisitos:' : 'Requirements:'}</span>
                          <p>• {language === 'es' ? 'Mínimo 8 caracteres, incluyendo al menos un número y un carácter especial.' : 'Min 8 chars, including at least one number and special char.'}</p>
                        </div>

                        {passwordError && (
                          <div className="p-2.5 bg-error/10 border border-error/20 rounded-xl text-error text-[10px] font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{passwordError}</span>
                          </div>
                        )}

                        {passwordSuccess && (
                          <div className="p-2.5 bg-emerald-50/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] font-bold flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{passwordSuccess}</span>
                          </div>
                        )}

                        <button 
                          type="submit"
                          disabled={changingPassword}
                          className="w-full py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-bold text-xs shadow-xs hover:opacity-90 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {changingPassword 
                            ? (language === 'es' ? 'Cambiando...' : 'Changing...') 
                            : (language === 'es' ? 'Actualizar Contraseña' : 'Update Password')
                          }
                        </button>
                      </form>
                    )}
                  </div>

                  {/* TWO FACTOR AUTHENTICATION (2FA) */}
                  <div className="border border-border rounded-xl p-4 bg-muted/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-muted-foreground/60" />
                      <div>
                        <h4 className="text-sm font-bold text-[var(--foreground)]">{t.dobleFactor}</h4>
                        <p className="text-[10px] text-muted-foreground">
                          {language === 'es' 
                            ? 'Solicita un código de un solo uso por correo al iniciar sesión.' 
                            : 'Requires a one-time code sent to email during login.'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {toggling2FA && (
                        <div className="w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <Switch 
                        checked={user?.twoFactorEnabled || false}
                        onChange={handleToggle2FA}
                        disabled={toggling2FA}
                      />
                    </div>
                  </div>

                  {twoFactorSuccess && (
                    <div className="p-2.5 bg-emerald-50/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{twoFactorSuccess}</span>
                    </div>
                  )}

                </div>
              </section>
            </div>

            {/* Right Col - Additional Security Info */}
            <div className="xl:col-span-5 space-y-6">
              <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider">
                  {language === 'es' ? 'Sesiones del Dispositivo' : 'Device Sessions'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {language === 'es' 
                    ? 'Puedes cerrar todas tus otras sesiones activas en navegadores o aplicaciones móviles de manera remota para resguardar tu cuenta.'
                    : 'You can remotely log out of all other active sessions across browsers and mobile apps to secure your account.'
                  }
                </p>
                <div className="pt-2 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground font-bold mb-3">{t.dispositivosActivos}</p>
                  <button className="text-error font-extrabold text-xs hover:underline decoration-2 underline-offset-4 active:scale-95 transition-transform cursor-pointer">
                    {t.cerrarTodasSesiones}
                  </button>
                </div>
              </section>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Switch({ checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-[var(--primary)]' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
