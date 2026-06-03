import { tokenService } from '@/infrastructure/jwt/JoseTokenService';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';

export async function getCurrentUser(req: Request) {
  let token: string | null = null;
  
  // Extract token from Cookie header
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/accessToken=([^;]+)/);
  if (match) {
    token = match[1];
  }

  // Extract from Authorization header
  if (!token) {
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;
  const payload = await tokenService.verifyAccessToken(token);
  if (!payload) return null;

  // Verify token version matches user database version
  try {
    const user = await userRepository.findById(payload.userId);
    if (!user) return null;

    const currentVersion = user.visualSettings?.tokenVersion || 1;
    if (payload.tokenVersion !== undefined && payload.tokenVersion !== currentVersion) {
      console.warn(`[AuthHelper] Token version mismatch for user ${payload.userId}. Token version: ${payload.tokenVersion}, Current: ${currentVersion}. Revoking access.`);
      return null; // Revoked token
    }
  } catch (err) {
    console.error('[AuthHelper] Failed to verify token version against database:', err);
    return null;
  }

  return payload;
}
export default getCurrentUser;
