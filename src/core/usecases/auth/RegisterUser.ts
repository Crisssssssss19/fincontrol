import { IUserRepository } from '@/core/repositories/IUserRepository';
import { User } from '@/core/entities/User';
import { HashService } from '@/infrastructure/security/HashService';

export class RegisterUser {
  constructor(
    private userRepository: IUserRepository,
    private hashService: HashService
  ) {}

  async execute(
    fullName: string,
    email: string,
    passwordPlain: string,
    avatarUrl?: string,
    country?: string,
    currency?: string
  ): Promise<User> {
    const existing = await this.userRepository.findByEmail(email);
    const hashedPassword = await this.hashService.hash(passwordPlain);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    if (existing) {
      if (existing.isVerified) {
        throw new Error('El correo electrónico ya se encuentra registrado');
      }

      // If the email exists but is not verified, update user info and generate new verification code
      return this.userRepository.update(existing.id, {
        fullName,
        passwordHash: hashedPassword,
        avatarUrl,
        verificationCode,
        verificationExpiresAt,
        failedVerificationAttempts: 0,
        country: country || existing.country || undefined,
        currency: currency || existing.currency || 'EUR',
      });
    }

    return this.userRepository.create({
      fullName,
      email,
      passwordHash: hashedPassword,
      avatarUrl,
      role: 'user',
      isVerified: false,
      verificationCode,
      verificationExpiresAt,
      failedVerificationAttempts: 0,
      country: country || undefined,
      currency: currency || 'EUR',
    });
  }
}
export default RegisterUser;
