import { INotificationRepository } from '../../repositories/INotificationRepository';

export class MarkNotificationAsRead {
  constructor(private repo: INotificationRepository) {}
  async execute(id: string): Promise<boolean> {
    return this.repo.markAsRead(id);
  }
}
