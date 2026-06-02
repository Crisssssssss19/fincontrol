import { Notification } from '../entities/Notification';

export interface INotificationRepository {
  findByUserId(userId: string): Promise<Notification[]>;
  create(notification: Omit<Notification, 'id' | 'createdAt'> & { id?: string; createdAt?: Date }): Promise<Notification>;
  markAsRead(id: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<boolean>;
}
