import { SavingsGoal } from '../entities/SavingsGoal';

export interface ISavingsGoalRepository {
  findById(id: string): Promise<SavingsGoal | null>;
  findByUserId(userId: string): Promise<SavingsGoal[]>;
  create(goal: Omit<SavingsGoal, 'id'> & { id?: string }): Promise<SavingsGoal>;
  update(id: string, goal: Partial<SavingsGoal>): Promise<SavingsGoal>;
  delete(id: string): Promise<boolean>;
}
