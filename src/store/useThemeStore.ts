import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FinanceTheme = 'light' | 'modern_white' | 'dark_pro' | 'midnight' | 'dracula' | 'cyberpunk' | 'amoled' | 'emerald_slate' | 'rose_finance';
export type AccentColor = 'emerald' | 'indigo' | 'blue' | 'purple' | 'orange' | 'red' | 'rose';
export type PrimaryFont = 'Inter' | 'Poppins' | 'Roboto' | 'Nunito' | 'Montserrat';
export type BorderRadius = 'square' | 'rounded' | 'ultra_rounded';
export type LayoutDensity = 'compact' | 'normal' | 'comfortable';
export type AnimationSpeed = 'fast' | 'normal' | 'slow';

export interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}

interface VisualSettings {
  theme: FinanceTheme;
  accentColor: AccentColor;
  font: PrimaryFont;
  borderRadius: BorderRadius;
  density: LayoutDensity;
  animations: boolean;
  animationSpeed: AnimationSpeed;
  dashboardLayout: WidgetLayout[];
  expenseAlerts: boolean;
  weeklySummary: boolean;
  customCategories: string[];
  customIncomeCategories: string[];
  customTags: string[];
  setTheme: (t: FinanceTheme) => void;
  setAccentColor: (a: AccentColor) => void;
  setFont: (f: PrimaryFont) => void;
  setBorderRadius: (r: BorderRadius) => void;
  setDensity: (d: LayoutDensity) => void;
  setAnimations: (enabled: boolean) => void;
  setAnimationSpeed: (s: AnimationSpeed) => void;
  setDashboardLayout: (layout: WidgetLayout[]) => void;
  setExpenseAlerts: (enabled: boolean) => void;
  setWeeklySummary: (enabled: boolean) => void;
  addCustomCategory: (cat: string) => void;
  deleteCustomCategory: (cat: string) => void;
  addCustomIncomeCategory: (cat: string) => void;
  deleteCustomIncomeCategory: (cat: string) => void;
  addCustomTag: (tag: string) => void;
  deleteCustomTag: (tag: string) => void;
  initializeSettings: (settings: any) => void;
}

const defaultLayout: WidgetLayout[] = [
  { id: 'balance', x: 0, y: 0, w: 8, h: 2, visible: true },
  { id: 'savings_rate', x: 8, y: 0, w: 4, h: 2, visible: true },
  { id: 'income_vs_expense', x: 0, y: 2, w: 12, h: 4, visible: true },
  { id: 'transactions', x: 0, y: 6, w: 8, h: 4, visible: true },
  { id: 'bills', x: 8, y: 6, w: 4, h: 4, visible: true },
];

let syncTimeout: any = null;

async function syncSettings(state: any) {
  if (typeof window === 'undefined') return;
  
  const authData = localStorage.getItem('fincontrol-auth-settings');
  if (!authData) return;
  try {
    const parsed = JSON.parse(authData);
    if (!parsed.state?.isAuthenticated || !parsed.state?.token) return;
  } catch (e) {
    return;
  }

  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(async () => {
    try {
      await fetch('/api/profile/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: state.theme,
          accentColor: state.accentColor,
          font: state.font,
          borderRadius: state.borderRadius,
          density: state.density,
          animations: state.animations,
          animationSpeed: state.animationSpeed,
          dashboardLayout: state.dashboardLayout,
          expenseAlerts: state.expenseAlerts,
          weeklySummary: state.weeklySummary,
          customCategories: state.customCategories,
          customIncomeCategories: state.customIncomeCategories,
          customTags: state.customTags,
        }),
      });
    } catch (err) {
      console.error('Failed to sync visual settings to database:', err);
    }
  }, 1000);
}

export const useThemeStore = create<VisualSettings>()(
  persist(
    (set) => ({
      theme: 'emerald_slate',
      accentColor: 'emerald',
      font: 'Inter',
      borderRadius: 'rounded',
      density: 'normal',
      animations: true,
      animationSpeed: 'normal',
      dashboardLayout: defaultLayout,
      expenseAlerts: true,
      weeklySummary: true,
      customCategories: [],
      customIncomeCategories: [],
      customTags: [],
      
      setTheme: (theme) => set((state) => {
        const next = { ...state, theme };
        syncSettings(next);
        return { theme };
      }),
      setAccentColor: (accentColor) => set((state) => {
        const next = { ...state, accentColor };
        syncSettings(next);
        return { accentColor };
      }),
      setFont: (font) => set((state) => {
        const next = { ...state, font };
        syncSettings(next);
        return { font };
      }),
      setBorderRadius: (borderRadius) => set((state) => {
        const next = { ...state, borderRadius };
        syncSettings(next);
        return { borderRadius };
      }),
      setDensity: (density) => set((state) => {
        const next = { ...state, density };
        syncSettings(next);
        return { density };
      }),
      setAnimations: (animations) => set((state) => {
        const next = { ...state, animations };
        syncSettings(next);
        return { animations };
      }),
      setAnimationSpeed: (animationSpeed) => set((state) => {
        const next = { ...state, animationSpeed };
        syncSettings(next);
        return { animationSpeed };
      }),
      setDashboardLayout: (dashboardLayout) => set((state) => {
        const next = { ...state, dashboardLayout };
        syncSettings(next);
        return { dashboardLayout };
      }),
      setExpenseAlerts: (expenseAlerts) => set((state) => {
        const next = { ...state, expenseAlerts };
        syncSettings(next);
        return { expenseAlerts };
      }),
      setWeeklySummary: (weeklySummary) => set((state) => {
        const next = { ...state, weeklySummary };
        syncSettings(next);
        return { weeklySummary };
      }),
      addCustomCategory: (category) => set((state) => {
        if (state.customCategories.includes(category)) return {};
        const customCategories = [...state.customCategories, category];
        const next = { ...state, customCategories };
        syncSettings(next);
        return { customCategories };
      }),
      deleteCustomCategory: (category) => set((state) => {
        const customCategories = state.customCategories.filter(c => c !== category);
        const next = { ...state, customCategories };
        syncSettings(next);
        return { customCategories };
      }),
      addCustomIncomeCategory: (category) => set((state) => {
        if (state.customIncomeCategories.includes(category)) return {};
        const customIncomeCategories = [...state.customIncomeCategories, category];
        const next = { ...state, customIncomeCategories };
        syncSettings(next);
        return { customIncomeCategories };
      }),
      deleteCustomIncomeCategory: (category) => set((state) => {
        const customIncomeCategories = state.customIncomeCategories.filter(c => c !== category);
        const next = { ...state, customIncomeCategories };
        syncSettings(next);
        return { customIncomeCategories };
      }),
      addCustomTag: (tag) => set((state) => {
        const cleanTag = tag.trim().replace(/^#/, '').toLowerCase();
        if (!cleanTag || state.customTags.includes(cleanTag)) return {};
        const customTags = [...state.customTags, cleanTag];
        const next = { ...state, customTags };
        syncSettings(next);
        return { customTags };
      }),
      deleteCustomTag: (tag) => set((state) => {
        const cleanTag = tag.trim().replace(/^#/, '').toLowerCase();
        const customTags = state.customTags.filter(t => t !== cleanTag);
        const next = { ...state, customTags };
        syncSettings(next);
        return { customTags };
      }),
      initializeSettings: (settings) => set((state) => {
        if (!settings) return {};
        return {
          theme: settings.theme || state.theme,
          accentColor: settings.accentColor || state.accentColor,
          font: settings.font || state.font,
          borderRadius: settings.borderRadius || state.borderRadius,
          density: settings.density || state.density,
          animations: settings.animations !== undefined ? settings.animations : state.animations,
          animationSpeed: settings.animationSpeed || state.animationSpeed,
          dashboardLayout: settings.dashboardLayout || state.dashboardLayout,
          expenseAlerts: settings.expenseAlerts !== undefined ? settings.expenseAlerts : state.expenseAlerts,
          weeklySummary: settings.weeklySummary !== undefined ? settings.weeklySummary : state.weeklySummary,
          customCategories: settings.customCategories || state.customCategories,
          customIncomeCategories: settings.customIncomeCategories || state.customIncomeCategories,
          customTags: settings.customTags || state.customTags,
        };
      }),
    }),
    {
      name: 'fincontrol-visual-settings',
    }
  )
);

