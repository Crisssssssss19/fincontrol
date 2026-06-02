import { Income } from '../entities/Income';

export interface IIncomeRepository {
  findById(id: string): Promise<Income | null>;
  findByUserId(userId: string): Promise<Income[]>;
  create(income: Omit<Income, 'id'> & { id?: string }): Promise<Income>;
  update(id: string, income: Partial<Income>): Promise<Income>;
  delete(id: string): Promise<boolean>;
}
