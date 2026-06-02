import { INotificationRepository } from '../../repositories/INotificationRepository';
import { Notification } from '../../entities/Notification';

export class GetNotifications {
  constructor(private repo: INotificationRepository) {}
  async execute(userId: string): Promise<Notification[]> {
    return this.repo.findByUserId(userId);
  }
}
