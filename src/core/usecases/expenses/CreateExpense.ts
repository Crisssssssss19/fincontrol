import { IExpenseRepository } from '@/core/repositories/IExpenseRepository';
import { Expense } from '@/core/entities/Expense';

export class CreateExpense {
  constructor(private expenseRepository: IExpenseRepository) {}

  async execute(expense: Omit<Expense, 'id'> & { id?: string }): Promise<Expense> {
    if (expense.amount <= 0) {
      throw new Error('El monto del gasto debe ser mayor a cero');
    }
    return this.expenseRepository.create(expense);
  }
}
export default CreateExpense;
