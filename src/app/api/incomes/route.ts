import { NextResponse } from 'next/server';
import { incomeRepository } from '@/infrastructure/repositories/SupabaseIncomeRepository';
import { GetUserIncomes } from '@/core/usecases/incomes/GetUserIncomes';
import { CreateIncome } from '@/core/usecases/incomes/CreateIncome';
import { DeleteIncome } from '@/core/usecases/incomes/DeleteIncome';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const usecase = new GetUserIncomes(incomeRepository);
    const incomes = await usecase.execute(user.userId);

    return NextResponse.json({ success: true, incomes });
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
    const usecase = new CreateIncome(incomeRepository);
    const income = await usecase.execute({
      ...body,
      userId: user.userId,
    });

    return NextResponse.json({ success: true, income });
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
      return NextResponse.json({ success: false, error: 'Missing income ID' }, { status: 400 });
    }

    const usecase = new DeleteIncome(incomeRepository);
    const success = await usecase.execute(id, user.userId);

    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
