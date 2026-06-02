import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { hashService } from '@/infrastructure/security/HashService';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';
import { SecurityAuditService } from '@/infrastructure/security/SecurityAuditService';

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
      await userRepository.update(user.id, {
        passwordHash: hashedNew,
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

    return NextResponse.json({ success: false, error: 'Acción no válida / Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
