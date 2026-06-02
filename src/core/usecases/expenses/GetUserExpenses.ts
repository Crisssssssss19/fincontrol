import { IExpenseRepository } from '@/core/repositories/IExpenseRepository';
import { Expense } from '@/core/entities/Expense';

export class GetUserExpenses {
  constructor(private expenseRepository: IExpenseRepository) {}

  async execute(userId: string): Promise<Expense[]> {
    return this.expenseRepository.findByUserId(userId);
  }
}
export default GetUserExpenses;
