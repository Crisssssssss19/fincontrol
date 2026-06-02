import { IIncomeRepository } from '@/core/repositories/IIncomeRepository';
import { Income } from '@/core/entities/Income';

export class GetUserIncomes {
  constructor(private incomeRepository: IIncomeRepository) {}

  async execute(userId: string): Promise<Income[]> {
    return this.incomeRepository.findByUserId(userId);
  }
}
export default GetUserIncomes;
