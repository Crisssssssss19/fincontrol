import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { hashService } from '@/infrastructure/security/HashService';
import { RegisterUser } from '@/core/usecases/auth/RegisterUser';
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService';
import { EmailTemplates } from '@/infrastructure/email/EmailTemplates';
import { SecurityAuditService } from '@/infrastructure/security/SecurityAuditService';

export async function POST(req: Request) {
  try {
    const { fullName, email, password, avatarUrl, country, currency } = await req.json();
    const registerUser = new RegisterUser(userRepository, hashService);
    const user = await registerUser.execute(fullName, email, password, avatarUrl, country, currency);

    // Send the verification code via Resend
    if (user.verificationCode) {
      await ResendEmailService.sendMail(
        user.email,
        'Verifica tu cuenta - FinControl',
        EmailTemplates.getVerificationTemplate(user.fullName, user.verificationCode)
      );
      await SecurityAuditService.logAction(user.id, 'register_pending_verification', req);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isVerified: user.isVerified,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
