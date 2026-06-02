import { INotificationRepository } from '@/core/repositories/INotificationRepository';
import { Notification } from '@/core/entities/Notification';
import { supabase, hasSupabaseKeys } from '../database/supabaseClient';

let mockNotifications: Notification[] = [];

export class SupabaseNotificationRepository implements INotificationRepository {
  async findByUserId(userId: string): Promise<Notification[]> {
    if (!hasSupabaseKeys) {
      return mockNotifications
        .filter(n => n.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        message: item.message,
        type: item.type as any,
        read: item.read,
        createdAt: new Date(item.created_at),
      }));
    } catch {
      return [];
    }
  }

  async create(notification: Omit<Notification, 'id' | 'createdAt'> & { id?: string; createdAt?: Date }): Promise<Notification> {
    const newNotification: Notification = {
      id: notification.id || crypto.randomUUID(),
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt || new Date(),
    };

    if (!hasSupabaseKeys) {
      mockNotifications.push(newNotification);
      return newNotification;
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        id: newNotification.id,
        user_id: newNotification.userId,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        read: newNotification.read,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Error creating notification in Supabase');
    }

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      message: data.message,
      type: data.type as any,
      read: data.read,
      createdAt: new Date(data.created_at),
    };
  }

  async markAsRead(id: string): Promise<boolean> {
    if (!hasSupabaseKeys) {
      const idx = mockNotifications.findIndex(n => n.id === id);
      if (idx !== -1) {
        mockNotifications[idx].read = true;
        return true;
      }
      return false;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    if (!hasSupabaseKeys) {
      mockNotifications = mockNotifications.map(n => 
        n.userId === userId ? { ...n, read: true } : n
      );
      return true;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId);

      return !error;
    } catch {
      return false;
    }
  }
}

export const notificationRepository = new SupabaseNotificationRepository();
