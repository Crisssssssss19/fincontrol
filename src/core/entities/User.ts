export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  phone?: string;
  country?: string;
  currency?: string;
  monthlyBudget?: number | null;
  isVerified?: boolean;
  verificationCode?: string | null;
  verificationExpiresAt?: Date | null;
  failedVerificationAttempts?: number;
  recoveryCode?: string | null;
  recoveryExpiresAt?: Date | null;
  failedRecoveryAttempts?: number;
  twoFactorEnabled?: boolean;
  twoFactorCode?: string | null;
  twoFactorExpiresAt?: Date | null;
  failedTwoFactorAttempts?: number;
  categoryBudgets?: Record<string, number>;
  budgetResetDay?: number;
  visualSettings?: any;
  createdAt?: Date;
  updatedAt?: Date;
}


