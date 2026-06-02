import { IUserRepository } from '../../repositories/IUserRepository';
import { User } from '../../entities/User';

export class UpdateUserProfile {
  constructor(private repo: IUserRepository) {}
  async execute(id: string, fields: Partial<Omit<User, 'id'>>): Promise<User> {
    return this.repo.update(id, fields);
  }
}
