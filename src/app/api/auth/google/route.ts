import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { hashService } from '@/infrastructure/security/HashService';
import { tokenService } from '@/infrastructure/jwt/JoseTokenService';
import { SecurityAuditService } from '@/infrastructure/security/SecurityAuditService';

export async function POST(req: Request) {
  try {
    const { credential, email: sandboxEmail, name: sandboxName, picture: sandboxPicture, isSandbox } = await req.json();

    let email = '';
    let name = '';
    let picture = '';

    const isLocalDev = process.env.NODE_ENV !== 'production';
    const hasClientId = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== 'tu_google_client_id_aqui';

    if (isSandbox) {
      // 1. Sandbox Authentication for Development / Mock mode
      if (!isLocalDev && hasClientId) {
        return NextResponse.json(
          { success: false, error: 'Sandbox mode is only allowed in local development environment.' },
          { status: 403 }
        );
      }

      if (!sandboxEmail) {
        return NextResponse.json(
          { success: false, error: 'Sandbox email is required.' },
          { status: 400 }
        );
      }

      email = sandboxEmail.trim().toLowerCase();
      name = sandboxName || email.split('@')[0];
      picture = sandboxPicture || '';
    } else {
      // 2. Real Google Sign-In Token Validation
      if (!credential) {
        return NextResponse.json(
          { success: false, error: 'Credential token is required.' },
          { status: 400 }
        );
      }

      // Verify the token with Google API
      const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!googleResponse.ok) {
        return NextResponse.json(
          { success: false, error: 'Invalid Google token.' },
          { status: 400 }
        );
      }

      const payload = await googleResponse.json();

      // Basic validations
      const verifiedIssuer = payload.iss === 'accounts.google.com' || payload.iss === 'https://accounts.google.com';
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const verifiedAudience = payload.aud === clientId;
      const emailVerified = payload.email_verified === 'true' || payload.email_verified === true;

      if (!verifiedIssuer) {
        return NextResponse.json({ success: false, error: 'Invalid issuer.' }, { status: 400 });
      }

      if (clientId && !verifiedAudience) {
        return NextResponse.json({ success: false, error: 'Invalid audience.' }, { status: 400 });
      }

      if (!emailVerified) {
        return NextResponse.json({ success: false, error: 'Google email not verified.' }, { status: 400 });
      }

      email = payload.email.trim().toLowerCase();
      name = payload.name || email.split('@')[0];
      picture = payload.picture || '';
    }

    // 3. User Lookup / Auto-Registration in Supabase 'users' table
    let user = await userRepository.findByEmail(email);

    if (!user) {
      // Auto-register user since Google has verified their identity
      const randomPassword = crypto.randomUUID() + "-" + Math.random().toString(36);
      const passwordHash = await hashService.hash(randomPassword);

      user = await userRepository.create({
        fullName: name,
        email: email,
        passwordHash: passwordHash,
        avatarUrl: picture || undefined,
        role: 'user',
        country: undefined,
        currency: 'EUR',
        isVerified: true, // Google emails are pre-verified
        verificationCode: null,
        verificationExpiresAt: null,
        failedVerificationAttempts: 0,
        twoFactorEnabled: false,
        twoFactorCode: null,
        twoFactorExpiresAt: null,
        failedTwoFactorAttempts: 0,
        categoryBudgets: {},
        budgetResetDay: 1,
        visualSettings: null,
      });

      await SecurityAuditService.logAction(user.id, 'register_success_google', req);
    } else {
      // User exists, update avatar if empty
      if (!user.avatarUrl && picture) {
        user = await userRepository.update(user.id, { avatarUrl: picture });
      }
      
      await SecurityAuditService.logAction(user.id, 'login_success_google', req);
    }

    // 4. Generate local JWT Access and Refresh Tokens
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

    // 5. Build Response and set cookies
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
