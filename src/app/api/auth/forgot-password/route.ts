import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService';
import { EmailTemplates } from '@/infrastructure/email/EmailTemplates';
import { SecurityAuditService } from '@/infrastructure/security/SecurityAuditService';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email requerido / Email required' }, { status: 400 });
    }

    const user = await userRepository.findByEmail(email.trim().toLowerCase());
    if (!user) {
      return NextResponse.json({ success: false, error: 'El correo electrónico no está registrado / Email is not registered' }, { status: 404 });
    }

    // Generate recovery code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await userRepository.update(user.id, {
      recoveryCode: code,
      recoveryExpiresAt: expiresAt,
      failedRecoveryAttempts: 0,
    });

    await ResendEmailService.sendMail(
      user.email,
      'Recupera tu contraseña - FinControl',
      EmailTemplates.getRecoveryTemplate(user.fullName, code)
    );

    await SecurityAuditService.logAction(user.id, 'password_recovery_requested', req);

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      message: 'Código de recuperación enviado / Recovery code sent',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
