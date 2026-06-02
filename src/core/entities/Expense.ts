export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  createdAt?: Date;
  updatedAt?: Date;
}
