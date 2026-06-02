import { IExpenseRepository } from '../../repositories/IExpenseRepository';

export class DeleteExpense {
  constructor(private repo: IExpenseRepository) {}
  async execute(id: string, userId: string): Promise<boolean> {
    const expense = await this.repo.findById(id);
    if (!expense || expense.userId !== userId) {
      throw new Error('Not authorized or expense not found');
    }
    return this.repo.delete(id);
  }
}
