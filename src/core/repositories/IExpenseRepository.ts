import { Expense } from '../entities/Expense';

export interface IExpenseRepository {
  findById(id: string): Promise<Expense | null>;
  findByUserId(userId: string): Promise<Expense[]>;
  create(expense: Omit<Expense, 'id'> & { id?: string }): Promise<Expense>;
  update(id: string, expense: Partial<Expense>): Promise<Expense>;
  delete(id: string): Promise<boolean>;
}
