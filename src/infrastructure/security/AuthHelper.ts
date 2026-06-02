import { tokenService } from '@/infrastructure/jwt/JoseTokenService';

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
  return tokenService.verifyAccessToken(token);
}
export default getCurrentUser;
