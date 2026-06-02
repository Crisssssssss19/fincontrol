import { IUserRepository } from '@/core/repositories/IUserRepository';
import { User } from '@/core/entities/User';
import { supabase, hasSupabaseKeys } from '../database/supabaseClient';

let mockUsers: User[] = [];

export class SupabaseUserRepository implements IUserRepository {
  private mapToUser(data: any): User {
    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      passwordHash: data.password_hash,
      avatarUrl: data.avatar_url,
      role: data.role as 'user' | 'admin',
      phone: data.phone,
      country: data.country,
      currency: data.currency,
      monthlyBudget: data.monthly_budget !== null && data.monthly_budget !== undefined ? Number(data.monthly_budget) : null,
      isVerified: data.is_verified,
      verificationCode: data.verification_code,
      verificationExpiresAt: data.verification_expires_at ? new Date(data.verification_expires_at) : null,
      failedVerificationAttempts: data.failed_verification_attempts || 0,
      recoveryCode: data.recovery_code,
      recoveryExpiresAt: data.recovery_expires_at ? new Date(data.recovery_expires_at) : null,
      failedRecoveryAttempts: data.failed_recovery_attempts || 0,
      twoFactorEnabled: data.two_factor_enabled,
      twoFactorCode: data.two_factor_code,
      twoFactorExpiresAt: data.two_factor_expires_at ? new Date(data.two_factor_expires_at) : null,
      failedTwoFactorAttempts: data.failed_two_factor_attempts || 0,
      categoryBudgets: data.category_budgets || {},
      budgetResetDay: data.budget_reset_day || 1,
      visualSettings: data.visual_settings || null,
    };
  }

  async findById(id: string): Promise<User | null> {
    if (!hasSupabaseKeys) {
      return mockUsers.find(u => u.id === id) || null;
    }
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
      if (error || !data) return null;
      return this.mapToUser(data);
    } catch {
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!hasSupabaseKeys) {
      return mockUsers.find(u => u.email === email) || null;
    }
    try {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
      if (error || !data) return null;
      return this.mapToUser(data);
    } catch {
      return null;
    }
  }

  async create(user: Omit<User, 'id'> & { id?: string }): Promise<User> {
    const newUser: User = {
      ...user,
      id: user.id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!hasSupabaseKeys) {
      mockUsers.push(newUser);
      return newUser;
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: newUser.id,
        full_name: newUser.fullName,
        email: newUser.email,
        password_hash: newUser.passwordHash,
        avatar_url: newUser.avatarUrl,
        role: newUser.role,
        phone: newUser.phone,
        country: newUser.country,
        currency: newUser.currency || 'EUR',
        monthly_budget: newUser.monthlyBudget,
        is_verified: newUser.isVerified || false,
        verification_code: newUser.verificationCode,
        verification_expires_at: newUser.verificationExpiresAt,
        failed_verification_attempts: newUser.failedVerificationAttempts || 0,
        recovery_code: newUser.recoveryCode,
        recovery_expires_at: newUser.recoveryExpiresAt,
        failed_recovery_attempts: newUser.failedRecoveryAttempts || 0,
        two_factor_enabled: newUser.twoFactorEnabled || false,
        two_factor_code: newUser.twoFactorCode,
        two_factor_expires_at: newUser.twoFactorExpiresAt,
        failed_two_factor_attempts: newUser.failedTwoFactorAttempts || 0,
        category_budgets: newUser.categoryBudgets || {},
        budget_reset_day: newUser.budgetResetDay || 1,
        visual_settings: newUser.visualSettings || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error creating user in Supabase');
    }

    return this.mapToUser(data);
  }

  async update(id: string, fields: Partial<User>): Promise<User> {
    if (!hasSupabaseKeys) {
      const idx = mockUsers.findIndex(u => u.id === id);
      if (idx === -1) throw new Error('User not found');
      mockUsers[idx] = { ...mockUsers[idx], ...fields, updatedAt: new Date() };
      return mockUsers[idx];
    }

    const updatePayload: any = {};
    if (fields.fullName !== undefined) updatePayload.full_name = fields.fullName;
    if (fields.email !== undefined) updatePayload.email = fields.email;
    if (fields.avatarUrl !== undefined) updatePayload.avatar_url = fields.avatarUrl;
    if (fields.passwordHash !== undefined) updatePayload.password_hash = fields.passwordHash;
    if (fields.phone !== undefined) updatePayload.phone = fields.phone;
    if (fields.country !== undefined) updatePayload.country = fields.country;
    if (fields.currency !== undefined) updatePayload.currency = fields.currency;
    if (fields.monthlyBudget !== undefined) updatePayload.monthly_budget = fields.monthlyBudget;
    if (fields.isVerified !== undefined) updatePayload.is_verified = fields.isVerified;
    if (fields.verificationCode !== undefined) updatePayload.verification_code = fields.verificationCode;
    if (fields.verificationExpiresAt !== undefined) updatePayload.verification_expires_at = fields.verificationExpiresAt;
    if (fields.failedVerificationAttempts !== undefined) updatePayload.failed_verification_attempts = fields.failedVerificationAttempts;
    if (fields.recoveryCode !== undefined) updatePayload.recovery_code = fields.recoveryCode;
    if (fields.recoveryExpiresAt !== undefined) updatePayload.recovery_expires_at = fields.recoveryExpiresAt;
    if (fields.failedRecoveryAttempts !== undefined) updatePayload.failed_recovery_attempts = fields.failedRecoveryAttempts;
    if (fields.twoFactorEnabled !== undefined) updatePayload.two_factor_enabled = fields.twoFactorEnabled;
    if (fields.twoFactorCode !== undefined) updatePayload.two_factor_code = fields.twoFactorCode;
    if (fields.twoFactorExpiresAt !== undefined) updatePayload.two_factor_expires_at = fields.twoFactorExpiresAt;
    if (fields.failedTwoFactorAttempts !== undefined) updatePayload.failed_two_factor_attempts = fields.failedTwoFactorAttempts;
    if (fields.categoryBudgets !== undefined) updatePayload.category_budgets = fields.categoryBudgets;
    if (fields.budgetResetDay !== undefined) updatePayload.budget_reset_day = fields.budgetResetDay;
    if (fields.visualSettings !== undefined) updatePayload.visual_settings = fields.visualSettings;

    const { data, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error updating user in Supabase');
    }

    return this.mapToUser(data);
  }
}
export const userRepository = new SupabaseUserRepository();
