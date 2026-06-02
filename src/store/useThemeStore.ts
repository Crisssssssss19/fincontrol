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
  setTheme: (t: FinanceTheme) => void;
  setAccentColor: (a: AccentColor) => void;
  setFont: (f: PrimaryFont) => void;
  setBorderRadius: (r: BorderRadius) => void;
  setDensity: (d: LayoutDensity) => void;
  setAnimations: (enabled: boolean) => void;
  setAnimationSpeed: (s: AnimationSpeed) => void;
  setDashboardLayout: (layout: WidgetLayout[]) => void;
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
    }),
    {
      name: 'fincontrol-visual-settings',
    }
  )
);

