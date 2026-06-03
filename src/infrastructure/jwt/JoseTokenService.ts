import { ITokenService, TokenPayload } from '@/core/services/ITokenService';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_fincontrol_secure_jwt_secret_32_characters'
);

export class JoseTokenService implements ITokenService {
  async generateAccessToken(payload: TokenPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(JWT_SECRET);
  }

  async generateRefreshToken(payload: TokenPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);
  }

  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as string,
        tokenVersion: payload.tokenVersion as number | undefined,
      };
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as string,
        tokenVersion: payload.tokenVersion as number | undefined,
      };
    } catch {
      return null;
    }
  }
}
export const tokenService = new JoseTokenService();
