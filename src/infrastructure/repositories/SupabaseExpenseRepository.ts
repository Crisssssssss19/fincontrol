import { IExpenseRepository } from '@/core/repositories/IExpenseRepository';
import { Expense } from '@/core/entities/Expense';
import { supabase, hasSupabaseKeys } from '../database/supabaseClient';

let mockExpenses: Expense[] = [];

export class SupabaseExpenseRepository implements IExpenseRepository {
  async findById(id: string): Promise<Expense | null> {
    if (!hasSupabaseKeys) {
      return mockExpenses.find(e => e.id === id) || null;
    }
    try {
      const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single();
      if (error || !data) return null;
      return this.mapToEntity(data);
    } catch {
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Expense[]> {
    if (!hasSupabaseKeys) {
      return mockExpenses.filter(e => e.userId === userId);
    }
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error || !data) return [];
      return data.map(this.mapToEntity);
    } catch {
      return [];
    }
  }

  async create(expense: Omit<Expense, 'id'> & { id?: string }): Promise<Expense> {
    const newExpense: Expense = {
      ...expense,
      id: expense.id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!hasSupabaseKeys) {
      mockExpenses.push(newExpense);
      return newExpense;
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        id: newExpense.id,
        user_id: newExpense.userId,
        description: newExpense.description,
        amount: newExpense.amount,
        category: newExpense.category,
        date: newExpense.date,
        payment_method: newExpense.paymentMethod,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error creating expense');
    }
    return this.mapToEntity(data);
  }

  async update(id: string, fields: Partial<Expense>): Promise<Expense> {
    if (!hasSupabaseKeys) {
      const idx = mockExpenses.findIndex(e => e.id === id);
      if (idx === -1) throw new Error('Expense not found');
      mockExpenses[idx] = { ...mockExpenses[idx], ...fields, updatedAt: new Date() };
      return mockExpenses[idx];
    }

    const updatePayload: any = {};
    if (fields.description !== undefined) updatePayload.description = fields.description;
    if (fields.amount !== undefined) updatePayload.amount = fields.amount;
    if (fields.category !== undefined) updatePayload.category = fields.category;
    if (fields.date !== undefined) updatePayload.date = fields.date;
    if (fields.paymentMethod !== undefined) updatePayload.payment_method = fields.paymentMethod;

    const { data, error } = await supabase
      .from('expenses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error updating expense');
    }
    return this.mapToEntity(data);
  }

  async delete(id: string): Promise<boolean> {
    if (!hasSupabaseKeys) {
      const idx = mockExpenses.findIndex(e => e.id === id);
      if (idx === -1) return false;
      mockExpenses.splice(idx, 1);
      return true;
    }
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  private mapToEntity(data: any): Expense {
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
export const expenseRepository = new SupabaseExpenseRepository();
