import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { tokenService } from '@/infrastructure/jwt/JoseTokenService';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // If there's no access token but there is a refresh token, try to refresh
  if (!accessToken && refreshToken) {
    try {
      const payload = await tokenService.verifyRefreshToken(refreshToken);
      if (payload) {
        // Generate new access token
        const newAccessToken = await tokenService.generateAccessToken({
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          tokenVersion: payload.tokenVersion,
        });

        // Set the new access token cookie in the response to save it in browser
        response.cookies.set('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60, // 15 mins
          path: '/',
        });

        // Update the request headers so downstream API / Server Component gets the new cookie!
        const requestHeaders = new Headers(request.headers);
        let cookieHeader = requestHeaders.get('cookie') || '';
        
        // Construct the cookie header with the new accessToken
        if (cookieHeader.includes('accessToken=')) {
          cookieHeader = cookieHeader.replace(/accessToken=[^;]*/, `accessToken=${newAccessToken}`);
        } else {
          cookieHeader = cookieHeader ? `${cookieHeader}; accessToken=${newAccessToken}` : `accessToken=${newAccessToken}`;
        }
        requestHeaders.set('cookie', cookieHeader);

        // Return NextResponse.next with the modified request headers
        const nextResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        // Copy the new cookie from response to nextResponse
        nextResponse.cookies.set('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60, // 15 mins
          path: '/',
        });

        return nextResponse;
      }
    } catch (err) {
      console.error('[Proxy] Token refresh failed:', err);
    }
  }

  return response;
}

// Config to match routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|logo.png|api/auth/login|api/auth/register).*)',
  ],
};
