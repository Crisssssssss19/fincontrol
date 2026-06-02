import { NextResponse } from 'next/server';
import { notificationRepository } from '@/infrastructure/repositories/SupabaseNotificationRepository';
import { GetNotifications } from '@/core/usecases/notifications/GetNotifications';
import { MarkNotificationAsRead } from '@/core/usecases/notifications/MarkNotificationAsRead';
import { MarkAllNotificationsAsRead } from '@/core/usecases/notifications/MarkAllNotificationsAsRead';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const usecase = new GetNotifications(notificationRepository);
    const notifications = await usecase.execute(user.userId);

    return NextResponse.json({ success: true, notifications });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (body.markAllAsRead) {
      const usecase = new MarkAllNotificationsAsRead(notificationRepository);
      const success = await usecase.execute(user.userId);
      return NextResponse.json({ success });
    }

    if (body.id) {
      const usecase = new MarkNotificationAsRead(notificationRepository);
      const success = await usecase.execute(body.id);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ success: false, error: 'Invalid action payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
