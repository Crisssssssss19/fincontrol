import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LanguageCode = 'es' | 'en';

interface LanguageState {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'es',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'fincontrol-language-settings',
    }
  )
);
