import { INotificationRepository } from '../../repositories/INotificationRepository';

export class MarkAllNotificationsAsRead {
  constructor(private repo: INotificationRepository) {}
  async execute(userId: string): Promise<boolean> {
    return this.repo.markAllAsRead(userId);
  }
}
