import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { hashService } from '@/infrastructure/security/HashService';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';
import { SecurityAuditService } from '@/infrastructure/security/SecurityAuditService';

export async function GET(req: Request) {
  try {
    const sessionUser = await getCurrentUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const logins = await SecurityAuditService.getRecentLogins(sessionUser.userId);
    
    // Parse user agent to readable device info
    const parsedSessions = logins.map((log: any) => {
      const ip = log.ip_address || '127.0.0.1';
      const ua = log.user_agent || '';
      
      let device = 'Computador / PC';
      if (ua.includes('iPhone')) {
        device = 'iPhone';
      } else if (ua.includes('iPad')) {
        device = 'iPad';
      } else if (ua.includes('Android')) {
        device = ua.includes('Mobile') ? 'Móvil Android' : 'Tablet Android';
      } else if (ua.includes('Macintosh')) {
        device = 'Mac (macOS)';
      } else if (ua.includes('Windows')) {
        device = 'Windows PC';
      } else if (ua.includes('Linux')) {
        device = 'Linux PC';
      }
      
      if (ua.includes('Chrome')) {
        device += ' (Chrome)';
      } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        device += ' (Safari)';
      } else if (ua.includes('Firefox')) {
        device += ' (Firefox)';
      } else if (ua.includes('Edg')) {
        device += ' (Edge)';
      }

      // Check if this log matches the current request's user-agent and IP
      const currentUA = req.headers.get('user-agent') || '';
      const currentIP = req.headers.get('x-forwarded-for') || '127.0.0.1';
      
      // Simple heuristic for current session match
      const isCurrent = ua === currentUA && (ip === currentIP || currentIP === '127.0.0.1');

      return {
        id: log.id,
        device,
        ipAddress: ip,
        lastActive: log.created_at,
        isCurrent,
      };
    });

    return NextResponse.json({ success: true, sessions: parsedSessions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getCurrentUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    const user = await userRepository.findById(sessionUser.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado / User not found' }, { status: 404 });
    }

    if (action === 'change-password') {
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return NextResponse.json({ success: false, error: 'Campos incompletos / Incomplete fields' }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres / Password must be at least 8 characters' }, { status: 400 });
      }

      // Check current password
      const isMatched = await hashService.compare(currentPassword, user.passwordHash || '');
      if (!isMatched) {
        await SecurityAuditService.logAction(user.id, 'password_change_failed_incorrect', req);
        return NextResponse.json({ success: false, error: 'La contraseña actual es incorrecta / Current password is incorrect' }, { status: 400 });
      }

      // Hash and save new password
      const hashedNew = await hashService.hash(newPassword);
      
      // Force terminate other sessions on password change as a security best practice
      const currentSettings = user.visualSettings || {};
      const newVersion = (currentSettings.tokenVersion || 1) + 1;

      await userRepository.update(user.id, {
        passwordHash: hashedNew,
        visualSettings: {
          ...currentSettings,
          tokenVersion: newVersion
        }
      });

      await SecurityAuditService.logAction(user.id, 'password_changed_success', req);

      return NextResponse.json({ success: true, message: 'Contraseña cambiada con éxito / Password successfully changed' });
    }

    if (action === 'toggle-2fa') {
      const { enabled } = body;

      if (enabled === undefined) {
        return NextResponse.json({ success: false, error: 'Opción no especificada / Option not specified' }, { status: 400 });
      }

      await userRepository.update(user.id, {
        twoFactorEnabled: enabled,
      });

      await SecurityAuditService.logAction(user.id, enabled ? '2fa_enabled' : '2fa_disabled', req);

      return NextResponse.json({
        success: true,
        twoFactorEnabled: enabled,
        message: enabled
          ? 'Autenticación de doble factor activada / Two-factor authentication enabled'
          : 'Autenticación de doble factor desactivada / Two-factor authentication disabled',
      });
    }

    if (action === 'terminate-sessions') {
      const currentSettings = user.visualSettings || {};
      const newVersion = (currentSettings.tokenVersion || 1) + 1;

      const updatedUser = await userRepository.update(user.id, {
        visualSettings: {
          ...currentSettings,
          tokenVersion: newVersion
        }
      });

      const tokenService = (await import('@/infrastructure/jwt/JoseTokenService')).tokenService;
      
      const accessToken = await tokenService.generateAccessToken({
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        tokenVersion: newVersion,
      });

      const refreshToken = await tokenService.generateRefreshToken({
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        tokenVersion: newVersion,
      });

      await SecurityAuditService.logAction(user.id, 'all_sessions_revoked', req);

      const response = NextResponse.json({
        success: true,
        message: 'Todas las demás sesiones han sido cerradas con éxito / All other sessions successfully closed'
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
    }

    return NextResponse.json({ success: false, error: 'Acción no válida / Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
