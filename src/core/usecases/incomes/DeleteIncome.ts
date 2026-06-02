import { IIncomeRepository } from '../../repositories/IIncomeRepository';

export class DeleteIncome {
  constructor(private repo: IIncomeRepository) {}
  async execute(id: string, userId: string): Promise<boolean> {
    const income = await this.repo.findById(id);
    if (!income || income.userId !== userId) {
      throw new Error('Not authorized or income not found');
    }
    return this.repo.delete(id);
  }
}
