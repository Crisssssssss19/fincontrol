import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updatedUser = await userRepository.update(user.userId, {
      visualSettings: body,
    });

    return NextResponse.json({ success: true, visualSettings: updatedUser.visualSettings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
