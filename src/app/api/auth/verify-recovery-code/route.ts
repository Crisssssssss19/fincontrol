import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { SecurityAuditService } from '@/infrastructure/security/SecurityAuditService';

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json({ success: false, error: 'Campos incompletos / Incomplete fields' }, { status: 400 });
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado / User not found' }, { status: 404 });
    }

    // Brute force protection
    const maxAttempts = 5;
    if ((user.failedRecoveryAttempts || 0) >= maxAttempts) {
      await SecurityAuditService.logAction(user.id, 'recovery_blocked_max_attempts', req);
      return NextResponse.json({
        success: false,
        error: 'Demasiados intentos fallidos. Solicita un nuevo código / Too many failed attempts. Request a new code',
      }, { status: 429 });
    }

    // Expiration check
    if (!user.recoveryCode || !user.recoveryExpiresAt) {
      return NextResponse.json({ success: false, error: 'Código inválido o ausente / Invalid or missing code' }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(user.recoveryExpiresAt);
    if (now > expiresAt) {
      await SecurityAuditService.logAction(user.id, 'recovery_code_expired', req);
      return NextResponse.json({ success: false, error: 'El código ha expirado / Code has expired' }, { status: 400 });
    }

    // Compare code
    if (user.recoveryCode !== code.trim()) {
      const nextAttempts = (user.failedRecoveryAttempts || 0) + 1;
      await userRepository.update(user.id, {
        failedRecoveryAttempts: nextAttempts,
      });

      await SecurityAuditService.logAction(user.id, `recovery_attempt_failed_${nextAttempts}`, req);

      return NextResponse.json({
        success: false,
        error: `Código incorrecto. Intentos restantes: ${maxAttempts - nextAttempts} / Incorrect code. Remaining attempts: ${maxAttempts - nextAttempts}`,
      }, { status: 400 });
    }

    // Code verified successfully (but we don't clear it yet, we let reset-password do that on password change)
    await SecurityAuditService.logAction(user.id, 'recovery_code_verified', req);

    return NextResponse.json({
      success: true,
      message: 'Código verificado con éxito / Code successfully verified',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
