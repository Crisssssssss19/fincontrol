import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { hashService } from '@/infrastructure/security/HashService';
import { LoginUser } from '@/core/usecases/auth/LoginUser';
import { tokenService } from '@/infrastructure/jwt/JoseTokenService';
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService';
import { EmailTemplates } from '@/infrastructure/email/EmailTemplates';
import { SecurityAuditService } from '@/infrastructure/security/SecurityAuditService';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const loginUser = new LoginUser(userRepository, hashService);
    const user = await loginUser.execute(email, password);

    // 1. Check if email is verified
    if (user.isVerified === false) {
      await SecurityAuditService.logAction(user.id, 'login_failed_unverified', req);
      return NextResponse.json({
        success: true,
        verified: false,
        userId: user.id,
        email: user.email,
        message: 'Email verification required',
      });
    }

    // 2. Check if Two-Factor Authentication (2FA) is enabled
    if (user.twoFactorEnabled === true) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiration

      await userRepository.update(user.id, {
        twoFactorCode: code,
        twoFactorExpiresAt: expiresAt,
        failedTwoFactorAttempts: 0,
      });

      await ResendEmailService.sendMail(
        user.email,
        'Código de Verificación 2FA - FinControl',
        EmailTemplates.get2FATemplate(user.fullName, code)
      );

      await SecurityAuditService.logAction(user.id, '2fa_code_sent', req);

      return NextResponse.json({
        success: true,
        requires2FA: true,
        userId: user.id,
        email: user.email,
        message: 'Two-factor authentication code sent',
      });
    }

    // 3. Normal Login (No 2FA, Email Verified)
    const currentVersion = user.visualSettings?.tokenVersion || 1;

    const accessToken = await tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: currentVersion,
    });

    const refreshToken = await tokenService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: currentVersion,
    });

    await SecurityAuditService.logAction(user.id, 'login_success', req);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        currency: user.currency,
      },
      token: accessToken,
    });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 mins
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
