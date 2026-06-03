import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { tokenService } from '@/infrastructure/jwt/JoseTokenService';
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

    if (user.isVerified) {
      return NextResponse.json({ success: true, message: 'Ya verificado / Already verified' });
    }

    // Security check: brute force protection
    const maxAttempts = 5;
    if ((user.failedVerificationAttempts || 0) >= maxAttempts) {
      await SecurityAuditService.logAction(user.id, 'verification_blocked_max_attempts', req);
      return NextResponse.json({
        success: false,
        error: 'Demasiados intentos fallidos. Solicita un nuevo código / Too many failed attempts. Request a new code',
      }, { status: 429 });
    }

    // Security check: expiration
    if (!user.verificationCode || !user.verificationExpiresAt) {
      return NextResponse.json({ success: false, error: 'Código inválido o ausente / Invalid or missing code' }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(user.verificationExpiresAt);
    if (now > expiresAt) {
      await SecurityAuditService.logAction(user.id, 'verification_code_expired', req);
      return NextResponse.json({ success: false, error: 'El código ha expirado / Code has expired' }, { status: 400 });
    }

    // Compare code
    if (user.verificationCode !== code.trim()) {
      const nextAttempts = (user.failedVerificationAttempts || 0) + 1;
      await userRepository.update(user.id, {
        failedVerificationAttempts: nextAttempts,
      });

      await SecurityAuditService.logAction(user.id, `verification_attempt_failed_${nextAttempts}`, req);

      return NextResponse.json({
        success: false,
        error: `Código incorrecto. Intentos restantes: ${maxAttempts - nextAttempts} / Incorrect code. Remaining attempts: ${maxAttempts - nextAttempts}`,
      }, { status: 400 });
    }

    // Success: Verify user
    const updatedUser = await userRepository.update(user.id, {
      isVerified: true,
      verificationCode: null,
      verificationExpiresAt: null,
      failedVerificationAttempts: 0,
    });

    const currentVersion = updatedUser.visualSettings?.tokenVersion || 1;

    const accessToken = await tokenService.generateAccessToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      tokenVersion: currentVersion,
    });

    const refreshToken = await tokenService.generateRefreshToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      tokenVersion: currentVersion,
    });

    await SecurityAuditService.logAction(updatedUser.id, 'verification_success_login', req);

    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role,
        isVerified: true,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        currency: updatedUser.currency,
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
