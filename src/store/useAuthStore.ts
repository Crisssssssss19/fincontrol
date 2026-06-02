import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role?: string;
  phone?: string;
  country?: string;
  currency?: string;
  monthlyBudget?: number | null;
  isVerified?: boolean;
  twoFactorEnabled?: boolean;
}

interface AuthState {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  setSession: (user: UserSession, token: string) => void;
  clearSession: () => void;
  updateUser: (user: Partial<UserSession>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setSession: (user, token) => set({ user, token, isAuthenticated: true }),
      clearSession: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),
    }),
    {
      name: 'fincontrol-auth-settings',
    }
  )
);
