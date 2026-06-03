export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tokenVersion?: number;
}

export interface ITokenService {
  generateAccessToken(payload: TokenPayload): Promise<string>;
  generateRefreshToken(payload: TokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<TokenPayload | null>;
  verifyRefreshToken(token: string): Promise<TokenPayload | null>;
}
