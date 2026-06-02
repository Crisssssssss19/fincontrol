import { IIncomeRepository } from '@/core/repositories/IIncomeRepository';
import { Income } from '@/core/entities/Income';

export class CreateIncome {
  constructor(private incomeRepository: IIncomeRepository) {}

  async execute(income: Omit<Income, 'id'> & { id?: string }): Promise<Income> {
    if (income.amount <= 0) {
      throw new Error('El monto del ingreso debe ser mayor a cero');
    }
    return this.incomeRepository.create(income);
  }
}
export default CreateIncome;
