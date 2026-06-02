import { INotificationRepository } from '../../repositories/INotificationRepository';
import { Notification, NotificationType } from '../../entities/Notification';

export class CreateNotification {
  constructor(private repo: INotificationRepository) {}
  async execute(userId: string, title: string, message: string, type: NotificationType): Promise<Notification> {
    return this.repo.create({
      userId,
      title,
      message,
      type,
      read: false,
    });
  }
}
