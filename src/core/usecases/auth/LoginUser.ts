import { IUserRepository } from '@/core/repositories/IUserRepository';
import { User } from '@/core/entities/User';
import { HashService } from '@/infrastructure/security/HashService';

export class LoginUser {
  constructor(
    private userRepository: IUserRepository,
    private hashService: HashService
  ) {}

  async execute(email: string, passwordPlain: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new Error('Correo electrónico o contraseña incorrectos');
    }
    const isMatched = await this.hashService.compare(passwordPlain, user.passwordHash);
    if (!isMatched) {
      throw new Error('Correo electrónico o contraseña incorrectos');
    }
    // Return user without password
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
}
export default LoginUser;
