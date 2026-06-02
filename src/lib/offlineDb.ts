import { openDB } from 'idb';

const DB_NAME = 'fincontrol-offline-db';
const DB_VERSION = 1;

export const initOfflineDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Pending incomes
      if (!db.objectStoreNames.contains('pending_incomes')) {
        db.createObjectStore('pending_incomes', { keyPath: 'id' });
      }
      // Pending expenses
      if (!db.objectStoreNames.contains('pending_expenses')) {
        db.createObjectStore('pending_expenses', { keyPath: 'id' });
      }
      // Pending invoices
      if (!db.objectStoreNames.contains('pending_invoices')) {
        db.createObjectStore('pending_invoices', { keyPath: 'id' });
      }
    },
  });
};
