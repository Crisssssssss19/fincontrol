import { NextResponse } from 'next/server';
import { expenseRepository } from '@/infrastructure/repositories/SupabaseExpenseRepository';
import { GetUserExpenses } from '@/core/usecases/expenses/GetUserExpenses';
import { CreateExpense } from '@/core/usecases/expenses/CreateExpense';
import { DeleteExpense } from '@/core/usecases/expenses/DeleteExpense';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';
import { checkBudgetThresholds, checkCategoryBudgetThresholds } from '@/utils/budget';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const usecase = new GetUserExpenses(expenseRepository);
    const expenses = await usecase.execute(user.userId);

    return NextResponse.json({ success: true, expenses });
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
    let expense;

    if (body.id) {
      const existing = await expenseRepository.findById(body.id);
      if (existing) {
        if (existing.userId !== user.userId) {
          return NextResponse.json({ success: false, error: 'Unauthorized expense modification' }, { status: 403 });
        }
        expense = await expenseRepository.update(body.id, {
          description: body.description,
          amount: Number(body.amount),
          category: body.category,
          date: body.date,
          paymentMethod: body.paymentMethod,
        });
      }
    }

    if (!expense) {
      const usecase = new CreateExpense(expenseRepository);
      expense = await usecase.execute({
        ...body,
        userId: user.userId,
      });
    }

    const budgetAlert = await checkBudgetThresholds(user.userId);
    const categoryBudgetAlert = await checkCategoryBudgetThresholds(user.userId, body.category);

    return NextResponse.json({ success: true, expense, budgetAlert, categoryBudgetAlert });
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
      return NextResponse.json({ success: false, error: 'Missing expense ID' }, { status: 400 });
    }

    const usecase = new DeleteExpense(expenseRepository);
    const success = await usecase.execute(id, user.userId);

    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
