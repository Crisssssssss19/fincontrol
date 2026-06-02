import { create } from 'zustand';
import { initOfflineDB } from '@/lib/offlineDb';

interface SyncState {
  isOnline: boolean;
  syncPending: boolean;
  setOnlineStatus: (status: boolean) => void;
  syncOfflineData: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  syncPending: false,

  setOnlineStatus: (isOnline) => {
    set({ isOnline });
    if (isOnline) {
      get().syncOfflineData();
    }
  },

  syncOfflineData: async () => {
    const isOnline = get().isOnline;
    if (!isOnline) return;

    set({ syncPending: true });
    try {
      const db = await initOfflineDB();

      // 1. Sync Incomes
      const pendingIncomes = await db.getAll('pending_incomes');
      for (const income of pendingIncomes) {
        try {
          const res = await fetch('/api/incomes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(income),
          });
          if (res.ok) {
            await db.delete('pending_incomes', income.id);
          }
        } catch (err) {
          console.error('Error syncing offline income:', err);
        }
      }

      // 2. Sync Expenses
      const pendingExpenses = await db.getAll('pending_expenses');
      for (const expense of pendingExpenses) {
        try {
          const res = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense),
          });
          if (res.ok) {
            await db.delete('pending_expenses', expense.id);
          }
        } catch (err) {
          console.error('Error syncing offline expense:', err);
        }
      }

      // 3. Sync Invoices
      const pendingInvoices = await db.getAll('pending_invoices');
      for (const invoice of pendingInvoices) {
        try {
          const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoice),
          });
          if (res.ok) {
            await db.delete('pending_invoices', invoice.id);
          }
        } catch (err) {
          console.error('Error syncing offline invoice:', err);
        }
      }
    } catch (err) {
      console.error('Error syncing offline data:', err);
    } finally {
      set({ syncPending: false });
    }
  }
}));
