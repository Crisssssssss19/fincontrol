import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService';
import { EmailTemplates } from '@/infrastructure/email/EmailTemplates';
import { SecurityAuditService } from '@/infrastructure/security/SecurityAuditService';

export async function POST(req: Request) {
  try {
    const { userId, type } = await req.json();

    if (!userId || !type) {
      return NextResponse.json({ success: false, error: 'Campos incompletos / Incomplete fields' }, { status: 400 });
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado / User not found' }, { status: 404 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    if (type === 'verification') {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      await userRepository.update(user.id, {
        verificationCode: code,
        verificationExpiresAt: expiresAt,
        failedVerificationAttempts: 0,
      });

      await ResendEmailService.sendMail(
        user.email,
        'Nuevo Código de Verificación - FinControl',
        EmailTemplates.getVerificationTemplate(user.fullName, code)
      );

      await SecurityAuditService.logAction(user.id, 'verification_code_resent', req);
    } else if (type === '2fa') {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
      await userRepository.update(user.id, {
        twoFactorCode: code,
        twoFactorExpiresAt: expiresAt,
        failedTwoFactorAttempts: 0,
      });

      await ResendEmailService.sendMail(
        user.email,
        'Nuevo Código 2FA - FinControl',
        EmailTemplates.get2FATemplate(user.fullName, code)
      );

      await SecurityAuditService.logAction(user.id, '2fa_code_resent', req);
    } else if (type === 'recovery') {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      await userRepository.update(user.id, {
        recoveryCode: code,
        recoveryExpiresAt: expiresAt,
        failedRecoveryAttempts: 0,
      });

      await ResendEmailService.sendMail(
        user.email,
        'Código de Recuperación de Contraseña - FinControl',
        EmailTemplates.getRecoveryTemplate(user.fullName, code)
      );

      await SecurityAuditService.logAction(user.id, 'recovery_code_resent', req);
    } else {
      return NextResponse.json({ success: false, error: 'Tipo de código inválido / Invalid code type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Código reenviado con éxito / Code successfully resent' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
