import { ISavingsGoalRepository } from '@/core/repositories/ISavingsGoalRepository';
import { SavingsGoal } from '@/core/entities/SavingsGoal';
import { supabase, hasSupabaseKeys } from '../database/supabaseClient';

let mockGoals: SavingsGoal[] = [];

export class SupabaseSavingsGoalRepository implements ISavingsGoalRepository {
  async findById(id: string): Promise<SavingsGoal | null> {
    if (!hasSupabaseKeys) {
      return mockGoals.find(g => g.id === id) || null;
    }
    try {
      const { data, error } = await supabase.from('savings_goals').select('*').eq('id', id).single();
      if (error || !data) return null;
      return this.mapToEntity(data);
    } catch {
      return null;
    }
  }

  async findByUserId(userId: string): Promise<SavingsGoal[]> {
    if (!hasSupabaseKeys) {
      return mockGoals.filter(g => g.userId === userId);
    }
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId)
        .order('target_date', { ascending: true });
      if (error || !data) return [];
      return data.map(this.mapToEntity);
    } catch {
      return [];
    }
  }

  async create(goal: Omit<SavingsGoal, 'id'> & { id?: string }): Promise<SavingsGoal> {
    const newGoal: SavingsGoal = {
      ...goal,
      id: goal.id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!hasSupabaseKeys) {
      mockGoals.push(newGoal);
      return newGoal;
    }

    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        id: newGoal.id,
        user_id: newGoal.userId,
        name: newGoal.name,
        target_amount: newGoal.targetAmount,
        current_amount: newGoal.currentAmount,
        target_date: newGoal.targetDate,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error creating savings goal');
    }
    return this.mapToEntity(data);
  }

  async update(id: string, fields: Partial<SavingsGoal>): Promise<SavingsGoal> {
    if (!hasSupabaseKeys) {
      const idx = mockGoals.findIndex(g => g.id === id);
      if (idx === -1) throw new Error('Savings goal not found');
      mockGoals[idx] = { ...mockGoals[idx], ...fields, updatedAt: new Date() };
      return mockGoals[idx];
    }

    const updatePayload: any = {};
    if (fields.name !== undefined) updatePayload.name = fields.name;
    if (fields.targetAmount !== undefined) updatePayload.target_amount = fields.targetAmount;
    if (fields.currentAmount !== undefined) updatePayload.current_amount = fields.currentAmount;
    if (fields.targetDate !== undefined) updatePayload.target_date = fields.targetDate;

    const { data, error } = await supabase
      .from('savings_goals')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error updating savings goal');
    }
    return this.mapToEntity(data);
  }

  async delete(id: string): Promise<boolean> {
    if (!hasSupabaseKeys) {
      const idx = mockGoals.findIndex(g => g.id === id);
      if (idx === -1) return false;
      mockGoals.splice(idx, 1);
      return true;
    }
    try {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  private mapToEntity(data: any): SavingsGoal {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      targetAmount: Number(data.target_amount),
      currentAmount: Number(data.current_amount),
      targetDate: data.target_date,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }
}
export const savingsGoalRepository = new SupabaseSavingsGoalRepository();
