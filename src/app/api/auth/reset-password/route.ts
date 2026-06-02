import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { hashService } from '@/infrastructure/security/HashService';
import { SecurityAuditService } from '@/infrastructure/security/SecurityAuditService';

export async function POST(req: Request) {
  try {
    const { userId, code, password } = await req.json();

    if (!userId || !code || !password) {
      return NextResponse.json({ success: false, error: 'Campos incompletos / Incomplete fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres / Password must be at least 8 characters' }, { status: 400 });
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado / User not found' }, { status: 404 });
    }

    // Double check code validity and expiration
    if (!user.recoveryCode || user.recoveryCode !== code.trim()) {
      return NextResponse.json({ success: false, error: 'Sesión de recuperación inválida / Invalid recovery session' }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(user.recoveryExpiresAt!);
    if (now > expiresAt) {
      return NextResponse.json({ success: false, error: 'Sesión expirada. Vuelve a iniciar la recuperación / Session expired. Please restart recovery' }, { status: 400 });
    }

    // Hash and update
    const hashedPassword = await hashService.hash(password);
    await userRepository.update(user.id, {
      passwordHash: hashedPassword,
      recoveryCode: null,
      recoveryExpiresAt: null,
      failedRecoveryAttempts: 0,
    });

    await SecurityAuditService.logAction(user.id, 'password_reset_success', req);

    return NextResponse.json({
      success: true,
      message: 'Contraseña restablecida con éxito / Password successfully reset',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
