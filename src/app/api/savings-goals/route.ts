import { NextResponse } from 'next/server';
import { savingsGoalRepository } from '@/infrastructure/repositories/SupabaseSavingsGoalRepository';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const goals = await savingsGoalRepository.findByUserId(user.userId);
    return NextResponse.json({ success: true, goals });
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
    let goal;
    if (body.id) {
      // Update
      const existing = await savingsGoalRepository.findById(body.id);
      if (!existing || existing.userId !== user.userId) {
        return NextResponse.json({ success: false, error: 'Goal not found' }, { status: 404 });
      }
      goal = await savingsGoalRepository.update(body.id, {
        name: body.name,
        targetAmount: Number(body.targetAmount),
        currentAmount: Number(body.currentAmount),
        targetDate: body.targetDate,
      });
    } else {
      // Create
      goal = await savingsGoalRepository.create({
        userId: user.userId,
        name: body.name,
        targetAmount: Number(body.targetAmount),
        currentAmount: Number(body.currentAmount || 0),
        targetDate: body.targetDate,
      });
    }

    return NextResponse.json({ success: true, goal });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing goal ID' }, { status: 400 });
    }

    const existing = await savingsGoalRepository.findById(id);
    if (!existing || existing.userId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Goal not found or unauthorized' }, { status: 404 });
    }

    const success = await savingsGoalRepository.delete(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
