import { IIncomeRepository } from '@/core/repositories/IIncomeRepository';
import { Income } from '@/core/entities/Income';
import { supabase, hasSupabaseKeys } from '../database/supabaseClient';

let mockIncomes: Income[] = [];

export class SupabaseIncomeRepository implements IIncomeRepository {
  async findById(id: string): Promise<Income | null> {
    if (!hasSupabaseKeys) {
      return mockIncomes.find(i => i.id === id) || null;
    }
    try {
      const { data, error } = await supabase.from('incomes').select('*').eq('id', id).single();
      if (error || !data) return null;
      return this.mapToEntity(data);
    } catch {
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Income[]> {
    if (!hasSupabaseKeys) {
      return mockIncomes.filter(i => i.userId === userId);
    }
    try {
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error || !data) return [];
      return data.map(this.mapToEntity);
    } catch {
      return [];
    }
  }

  async create(income: Omit<Income, 'id'> & { id?: string }): Promise<Income> {
    const newIncome: Income = {
      ...income,
      id: income.id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!hasSupabaseKeys) {
      mockIncomes.push(newIncome);
      return newIncome;
    }

    const { data, error } = await supabase
      .from('incomes')
      .insert({
        id: newIncome.id,
        user_id: newIncome.userId,
        description: newIncome.description,
        amount: newIncome.amount,
        category: newIncome.category,
        date: newIncome.date,
        payment_method: newIncome.paymentMethod,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error creating income');
    }
    return this.mapToEntity(data);
  }

  async update(id: string, fields: Partial<Income>): Promise<Income> {
    if (!hasSupabaseKeys) {
      const idx = mockIncomes.findIndex(i => i.id === id);
      if (idx === -1) throw new Error('Income not found');
      mockIncomes[idx] = { ...mockIncomes[idx], ...fields, updatedAt: new Date() };
      return mockIncomes[idx];
    }

    const updatePayload: any = {};
    if (fields.description !== undefined) updatePayload.description = fields.description;
    if (fields.amount !== undefined) updatePayload.amount = fields.amount;
    if (fields.category !== undefined) updatePayload.category = fields.category;
    if (fields.date !== undefined) updatePayload.date = fields.date;
    if (fields.paymentMethod !== undefined) updatePayload.payment_method = fields.paymentMethod;

    const { data, error } = await supabase
      .from('incomes')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error updating income');
    }
    return this.mapToEntity(data);
  }

  async delete(id: string): Promise<boolean> {
    if (!hasSupabaseKeys) {
      const idx = mockIncomes.findIndex(i => i.id === id);
      if (idx === -1) return false;
      mockIncomes.splice(idx, 1);
      return true;
    }
    try {
      const { error } = await supabase.from('incomes').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  private mapToEntity(data: any): Income {
    return {
      id: data.id,
      userId: data.user_id,
      description: data.description,
      amount: Number(data.amount),
      category: data.category,
      date: data.date,
      paymentMethod: data.payment_method,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }
}
export const incomeRepository = new SupabaseIncomeRepository();
