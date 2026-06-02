import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { GetUserProfile } from '@/core/usecases/users/GetUserProfile';
import { UpdateUserProfile } from '@/core/usecases/users/UpdateUserProfile';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const usecase = new GetUserProfile(userRepository);
    const profile = await usecase.execute(user.userId);

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const usecase = new UpdateUserProfile(userRepository);
    const updatedProfile = await usecase.execute(user.userId, {
      fullName: body.fullName,
      phone: body.phone,
      country: body.country,
      currency: body.currency,
      monthlyBudget: body.monthlyBudget !== undefined ? (body.monthlyBudget === null ? null : Number(body.monthlyBudget)) : undefined,
      categoryBudgets: body.categoryBudgets,
      budgetResetDay: body.budgetResetDay !== undefined ? Number(body.budgetResetDay) : undefined,
    });


    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
