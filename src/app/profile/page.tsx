'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { 
  User, 
  Globe, 
  Camera, 
  PiggyBank,
  Calendar,
  Grid
} from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres / Name must be at least 3 characters'),
  email: z.string().email('Introduce un correo electrónico válido / Enter a valid email'),
  phone: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().min(1, 'Selecciona una moneda / Select a currency'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'budget'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Budgets state
  const [totalBudget, setTotalBudget] = useState<number | ''>('');
  const [resetDay, setResetDay] = useState<number>(1);
  const [categoryBudgetsState, setCategoryBudgetsState] = useState<Record<string, number>>({});
  const [savingBudget, setSavingBudget] = useState(false);

  const { user, updateUser } = useAuthStore();
  const { language } = useLanguageStore();
  const t = translations[language] || translations['es'];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      country: user?.country || '',
      currency: user?.currency || 'EUR',
    }
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoadingProfile(true);
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.success && data.profile) {
          updateUser(data.profile);
          reset({
            fullName: data.profile.fullName,
            email: data.profile.email,
            phone: data.profile.phone || '',
            country: data.profile.country || '',
            currency: data.profile.currency || 'EUR',
          });
          
          setTotalBudget(data.profile.monthlyBudget !== null ? Number(data.profile.monthlyBudget) : '');
          setResetDay(data.profile.budgetResetDay || 1);
          setCategoryBudgetsState(data.profile.categoryBudgets || {});
          return;
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoadingProfile(false);
      }
      
      // Fallback if offline/mock
      if (user) {
        reset({
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || '',
          country: user.country || '',
          currency: user.currency || 'EUR',
        });
        setTotalBudget(user.monthlyBudget !== null ? Number(user.monthlyBudget) : '');
      }
    }
    loadProfile();
  }, [reset, updateUser]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success && result.profile) {
        updateUser(result.profile);
      } else {
        updateUser(data);
      }
      setIsEditing(false);
      alert(language === 'es' ? 'Perfil actualizado con éxito.' : 'Profile successfully updated.');
    } catch (err) {
      console.error('Error updating profile:', err);
      updateUser(data);
      setIsEditing(false);
      alert(language === 'es' ? 'Perfil actualizado con éxito.' : 'Profile successfully updated.');
    }
  };

  const handleSaveBudgetSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBudget(true);
      const payload = {
        monthlyBudget: totalBudget === '' ? null : Number(totalBudget),
        budgetResetDay: Number(resetDay),
        categoryBudgets: categoryBudgetsState,
      };

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.profile) {
        updateUser(data.profile);
        alert(language === 'es' ? 'Límites de presupuesto guardados con éxito.' : 'Budget settings successfully saved.');
      } else {
        alert(language === 'es' ? 'Error al guardar presupuestos.' : 'Error saving budgets.');
      }
    } catch (err) {
      console.error('Error saving budgets:', err);
      alert(language === 'es' ? 'Error de conexión. Se aplicó localmente.' : 'Connection error. Applied locally.');
    } finally {
      setSavingBudget(false);
    }
  };

  const handleCategoryBudgetChange = (cat: string, val: string) => {
    const numVal = val === '' ? 0 : Number(val);
    setCategoryBudgetsState(prev => ({
      ...prev,
      [cat]: numVal
    }));
  };



  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(language === 'es' ? 'El archivo supera el límite de 5MB / File exceeds 5MB limit' : 'File exceeds 5MB limit');
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.avatarUrl) {
        updateUser({ avatarUrl: data.avatarUrl });
        alert(language === 'es' ? 'Foto de perfil actualizada con éxito.' : 'Profile picture updated successfully.');
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          updateUser({ avatarUrl: reader.result as string });
          alert(language === 'es' ? 'Foto de perfil actualizada con éxito (Local).' : 'Profile picture updated successfully (Local).');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({ avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
    }
  };



  const budgetCategories = [
    'Alimentación',
    'Transporte',
    'Vivienda',
    'Servicios',
    'Entretenimiento',
    'Salud',
    'Educación',
    'Otros'
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-[var(--foreground)]">{t.configuracionPerfil}</h1>
        <p className="text-xs text-muted-foreground font-medium">{t.descripcionPerfil}</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-1 shrink-0">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'border-[var(--primary)] text-[var(--primary)] font-black'
              : 'border-transparent text-muted-foreground hover:text-[var(--foreground)]'
          }`}
        >
          <User className="w-4 h-4" />
          {language === 'es' ? 'Mi Perfil' : 'My Profile'}
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'budget'
              ? 'border-[var(--primary)] text-[var(--primary)] font-black'
              : 'border-transparent text-muted-foreground hover:text-[var(--foreground)]'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          {language === 'es' ? 'Gestión de Presupuestos' : 'Budget Management'}
        </button>
      </div>

      {/* Dynamic Tabs Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ==================== TAB 1: PROFILE ==================== */}
        {activeTab === 'profile' && (
          <div className="lg:col-span-12 space-y-6 animate-in fade-in duration-200">
            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-black text-[var(--foreground)]">{t.informacionPersonal}</h2>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-[var(--primary)] hover:bg-[var(--primary)]/10 px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
                >
                  {isEditing ? t.cancelar : t.editar}
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-6">
                {/* Avatar Zone */}
                <div className="flex flex-col items-center gap-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                  <div 
                    onClick={handleAvatarClick}
                    className="w-24 h-24 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center border-2 border-border relative group cursor-pointer overflow-hidden shadow-xs"
                  >
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-extrabold text-3xl">{user?.fullName ? user.fullName[0] : 'A'}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      {uploadingAvatar ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold text-center">{t.avatarChange}</span>
                </div>

                {/* Data Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">{t.fullNameLabel}</label>
                    {isEditing ? (
                      <input 
                        {...register('fullName')}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                        type="text" 
                      />
                    ) : (
                      <div className="text-sm font-semibold p-2.5 bg-muted/20 border border-border/40 rounded-xl text-[var(--foreground)] truncate">
                        {user?.fullName || '—'}
                      </div>
                    )}
                    {errors.fullName && <p className="text-xs text-error font-medium">{errors.fullName.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">{t.emailLabel}</label>
                    {isEditing ? (
                      <input 
                        {...register('email')}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                        type="email" 
                      />
                    ) : (
                      <div className="text-sm font-semibold p-2.5 bg-muted/20 border border-border/40 rounded-xl text-[var(--foreground)] truncate">
                        {user?.email || '—'}
                      </div>
                    )}
                    {errors.email && <p className="text-xs text-error font-medium">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">{t.telefono}</label>
                    {isEditing ? (
                      <input 
                        {...register('phone')}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                        type="text" 
                      />
                    ) : (
                      <div className="text-sm font-semibold p-2.5 bg-muted/20 border border-border/40 rounded-xl text-[var(--foreground)] truncate">
                        {user?.phone || '—'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">{t.pais}</label>
                    {isEditing ? (
                      <input 
                        {...register('country')}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all" 
                        type="text" 
                      />
                    ) : (
                      <div className="text-sm font-semibold p-2.5 bg-muted/20 border border-border/40 rounded-xl text-[var(--foreground)] truncate">
                        {user?.country || '—'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-muted-foreground/60" /> {t.monedaPrincipal}
                    </label>
                    <select 
                      {...register('currency')}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all cursor-pointer disabled:opacity-75"
                    >
                      <option value="EUR">Euro (€) - EUR</option>
                      <option value="USD">Dólar Estadounidense ($) - USD</option>
                      <option value="COP">Peso Colombiano ($) - COP</option>
                      <option value="GBP">Libra Esterlina (£) - GBP</option>
                      <option value="JPY">Yen Japonés (¥) - JPY</option>
                      {user?.currency && !['EUR', 'USD', 'COP', 'GBP', 'JPY'].includes(user.currency) && (
                        <option value={user.currency}>{user.currency}</option>
                      )}
                    </select>
                  </div>

                  {isEditing && (
                    <div className="md:col-span-2 flex justify-end pt-2">
                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition-all"
                      >
                        {t.guardar}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ==================== TAB 2: BUDGETS ==================== */}
        {activeTab === 'budget' && (
          <div className="lg:col-span-12">
            <form onSubmit={handleSaveBudgetSettings} className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Side: General Budgets */}
              <div className="xl:col-span-6 space-y-6">
                <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-5 h-5 text-[var(--primary)]" />
                    <h2 className="text-base font-black text-[var(--foreground)]">
                      {language === 'es' ? 'Presupuesto Mensual Total' : 'Total Monthly Budget'}
                    </h2>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">
                      {language === 'es' ? 'Límite Mensual ($)' : 'Monthly Limit ($)'}
                    </label>
                    <input
                      type="number"
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all font-semibold"
                      placeholder="e.g. 1000"
                      min={0}
                    />
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">
                      {language === 'es' 
                        ? 'Establece el tope de gastos que deseas consumir durante cada periodo mensual.' 
                        : 'Set the maximum amount of money you want to spend during each monthly period.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/40">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-muted-foreground/60" />
                      {language === 'es' ? 'Día de Reinicio Mensual' : 'Monthly Reset Day'}
                    </label>
                    <select
                      value={resetDay}
                      onChange={(e) => setResetDay(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm transition-all cursor-pointer"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          {language === 'es' ? `Día ${day} de cada mes` : `Day ${day} of every month`}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">
                      {language === 'es' 
                        ? 'El presupuesto se calculará a partir de este día hasta el día anterior del mes siguiente automáticamente.' 
                        : 'The budget cycle is calculated starting from this day up to the day before the next month.'}
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={savingBudget}
                      className="w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-bold text-xs shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {savingBudget 
                        ? (language === 'es' ? 'Guardando...' : 'Saving...')
                        : (language === 'es' ? 'Guardar Configuración' : 'Save Settings')}
                    </button>
                  </div>
                </section>
              </div>

              {/* Right Side: Category budgets */}
              <div className="xl:col-span-6 space-y-6">
                <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2">
                    <Grid className="w-5 h-5 text-[var(--primary)]" />
                    <h2 className="text-base font-black text-[var(--foreground)]">
                      {language === 'es' ? 'Presupuesto por Categorías (Opcional)' : 'Budgets by Category (Optional)'}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground leading-normal">
                    {language === 'es'
                      ? 'Configura límites específicos para categorías concretas. Deja en blanco o en 0 para no aplicar un límite particular.'
                      : 'Set individual budget limits for specific categories. Leave blank or 0 to not apply a limit.'}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                    {budgetCategories.map((category) => (
                      <div key={category} className="space-y-1">
                        <label className="text-xs font-bold text-[var(--foreground)]">
                          {category === 'Alimentación' ? t.alimentacion :
                           category === 'Transporte' ? t.transporte :
                           category === 'Entretenimiento' ? (language === 'es' ? 'Entretenimiento' : 'Entertainment') :
                           category === 'Vivienda' ? t.vivienda :
                           category === 'Salud' ? t.salud :
                           category === 'Educación' ? t.educacion : category}
                        </label>
                        <input
                          type="number"
                          value={categoryBudgetsState[category] || ''}
                          onChange={(e) => handleCategoryBudgetChange(category, e.target.value)}
                          className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl focus:ring-1 focus:ring-[var(--primary)] outline-none text-xs transition-all font-semibold"
                          placeholder="e.g. 150"
                          min={0}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              </div>

            </form>
          </div>
        )}
      </div>
    </div>
  );
}
