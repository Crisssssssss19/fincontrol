import { NextResponse } from 'next/server';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { expenseRepository } from '@/infrastructure/repositories/SupabaseExpenseRepository';
import { incomeRepository } from '@/infrastructure/repositories/SupabaseIncomeRepository';
import { notificationRepository } from '@/infrastructure/repositories/SupabaseNotificationRepository';
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService';
import { EmailTemplates } from '@/infrastructure/email/EmailTemplates';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    // In production, require CRON_SECRET for security. In dev mode, allow manual triggering.
    const isDev = process.env.NODE_ENV === 'development';
    const cronSecret = process.env.CRON_SECRET || 'dev_secret_token';
    
    if (!isDev && token !== cronSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    const users = await userRepository.findAll();
    console.log(`[Cron Weekly Summary] Found ${users.length} total users.`);

    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    // Start of the week: 7 days ago
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 0, 0, 0, 0);

    const startStr = start.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const endStr = end.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    let processedCount = 0;

    for (const user of users) {
      // Check if user explicitly opted out of weekly summaries
      const isWeeklySummaryEnabled = user.visualSettings?.weeklySummary !== false;
      if (!isWeeklySummaryEnabled) {
        console.log(`[Cron Weekly Summary] Skipping user ${user.email} (weeklySummary disabled)`);
        continue;
      }

      // Fetch user incomes & expenses
      const expenses = await expenseRepository.findByUserId(user.id);
      const incomes = await incomeRepository.findByUserId(user.id);

      // Filter by last 7 days
      const weeklyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
      const weeklyIncomes = incomes.filter(i => {
        const d = new Date(i.date);
        return d >= start && d <= end;
      });

      const totalIncome = weeklyIncomes.reduce((acc, curr) => acc + curr.amount, 0);
      const totalExpenses = weeklyExpenses.reduce((acc, curr) => acc + curr.amount, 0);
      const balance = totalIncome - totalExpenses;

      // Find top expense category
      const expenseMap: Record<string, number> = {};
      weeklyExpenses.forEach(e => {
        expenseMap[e.category] = (expenseMap[e.category] || 0) + e.amount;
      });

      let topCategory = '';
      let topCategoryAmount = 0;
      for (const [cat, amt] of Object.entries(expenseMap)) {
        if (amt > topCategoryAmount) {
          topCategoryAmount = amt;
          topCategory = cat;
        }
      }

      const currency = user.currency || 'EUR';

      // 1. Create DB notification
      const notificationTitle = '📊 Resumen Semanal';
      const notificationMsg = `Balance de la semana: ${balance.toLocaleString()} ${currency}.\nIngresos: ${totalIncome.toLocaleString()} ${currency} | Gastos: ${totalExpenses.toLocaleString()} ${currency}.${topCategory ? `\nCategoría de mayor gasto: ${topCategory} (${topCategoryAmount.toLocaleString()} ${currency}).` : ''}`;

      await notificationRepository.create({
        userId: user.id,
        title: notificationTitle,
        message: notificationMsg,
        type: 'info',
        read: false,
      });

      // 2. Send Email
      const emailHtml = EmailTemplates.getWeeklySummaryTemplate(
        user.fullName,
        startStr,
        endStr,
        totalIncome,
        totalExpenses,
        balance,
        topCategory,
        topCategoryAmount,
        currency
      );

      try {
        await ResendEmailService.sendMail(user.email, `📊 Tu Resumen Semanal (${startStr} - ${endStr}) - FinControl`, emailHtml);
      } catch (emailErr) {
        console.error(`[Cron Weekly Summary] Failed to send email to ${user.email}:`, emailErr);
      }

      processedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      processedUsers: processedCount,
      period: { start: startStr, end: endStr }
    });
  } catch (err: any) {
    console.error('[Cron Weekly Summary] Error during cron execution:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
