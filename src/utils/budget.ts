import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { expenseRepository } from '@/infrastructure/repositories/SupabaseExpenseRepository';
import { notificationRepository } from '@/infrastructure/repositories/SupabaseNotificationRepository';
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService';
import { EmailTemplates } from '@/infrastructure/email/EmailTemplates';

export function getBudgetPeriodRange(resetDay: number, today: Date = new Date()): { start: Date; end: Date } {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  
  let startYear = currentYear;
  let startMonth = currentMonth;
  
  if (today.getDate() < resetDay) {
    startMonth = currentMonth - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }
  
  const getSafeDate = (year: number, month: number, day: number) => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const safeDay = Math.min(day, lastDayOfMonth);
    return new Date(year, month, safeDay, 0, 0, 0, 0);
  };
  
  const start = getSafeDate(startYear, startMonth, resetDay);
  
  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 11) {
    endMonth = 0;
    endYear += 1;
  }
  
  const nextReset = getSafeDate(endYear, endMonth, resetDay);
  const end = new Date(nextReset.getTime() - 1); // 1ms before the next reset day
  
  return { start, end };
}

export async function checkBudgetThresholds(userId: string): Promise<{ crossedThreshold: number | null; percent: number } | null> {
  const user = await userRepository.findById(userId);
  if (!user || !user.monthlyBudget) return null;
  
  const budget = Number(user.monthlyBudget);
  const resetDay = user.budgetResetDay || 1;
  const { start, end } = getBudgetPeriodRange(resetDay);
  
  const expenses = await expenseRepository.findByUserId(userId);
  const periodExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= start && d <= end;
  });
  
  const spent = periodExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const percent = (spent / budget) * 100;
  
  let thresholdToAlert = 0;
  if (percent >= 100) {
    thresholdToAlert = 100;
  } else if (percent >= 90) {
    thresholdToAlert = 90;
  } else if (percent >= 80) {
    thresholdToAlert = 80;
  }
  
  if (thresholdToAlert === 0) return { crossedThreshold: null, percent };
  
  // Fetch existing notifications to check for duplicates in the current cycle
  const notifications = await notificationRepository.findByUserId(userId);
  const cycleNotifications = notifications.filter(n => n.createdAt >= start && n.createdAt <= end);
  
  const hasAlertedThisThreshold = cycleNotifications.some(n => {
    return n.title.includes(`(${thresholdToAlert}%)`) || (thresholdToAlert === 100 && n.title.includes('Superado'));
  });
  
  if (hasAlertedThisThreshold) {
    return { crossedThreshold: null, percent };
  }
  
  let title = '';
  let message = '';
  let type: 'info' | 'warning' | 'error' = 'info';
  let recommendations: string[] = [];
  
  if (thresholdToAlert === 100) {
    title = '⚠️ Límite de Presupuesto Superado';
    message = `Has superado tu presupuesto total configurado. Gastado: ${spent.toFixed(2)} ${user.currency || 'EUR'} de ${budget.toFixed(2)} ${user.currency || 'EUR'} (${percent.toFixed(1)}%).`;
    type = 'error';
    recommendations = [
      'Pausa temporalmente las compras de entretenimiento y ocio.',
      'Revisa tus facturas para aplazar pagos que no sean críticos.',
      'Analiza las categorías en las que has gastado más para recortar inmediatamente.'
    ];
  } else if (thresholdToAlert === 90) {
    title = `⚡ Advertencia de Presupuesto (90%)`;
    message = `Estás a punto de agotar tu presupuesto mensual. Gastado: ${spent.toFixed(2)} ${user.currency || 'EUR'} de ${budget.toFixed(2)} ${user.currency || 'EUR'} (${percent.toFixed(1)}%).`;
    type = 'warning';
    recommendations = [
      'Reduce las comidas fuera de casa y prioriza cocinar.',
      'Compara precios antes de realizar cualquier gasto pendiente.',
      'Cancela suscripciones temporales que no utilices activamente.'
    ];
  } else {
    title = `🔔 Alerta Preventiva de Presupuesto (80%)`;
    message = `Tus gastos mensuales ya alcanzaron el 80% de tu presupuesto. Gastado: ${spent.toFixed(2)} ${user.currency || 'EUR'} de ${budget.toFixed(2)} ${user.currency || 'EUR'} (${percent.toFixed(1)}%).`;
    type = 'info';
    recommendations = [
      'Intenta no gastar más de lo necesario durante esta semana.',
      'Planifica tus gastos de transporte y alimentación con antelación.',
      'Considera posponer compras de ropa o gadgets para el próximo ciclo.'
    ];
  }
  
  // Check if user has disabled notifications in settings
  const isExpenseAlertsEnabled = user.visualSettings?.expenseAlerts !== false;
  
  if (isExpenseAlertsEnabled) {
    // 1. Create DB notification
    await notificationRepository.create({
      userId,
      title,
      message,
      type,
      read: false,
    });
    
    // 2. Dispatch Email
    const emailHtml = EmailTemplates.getBudgetTemplate(
      user.fullName,
      thresholdToAlert,
      budget,
      spent,
      percent,
      user.currency || 'EUR',
      recommendations
    );
    
    try {
      await ResendEmailService.sendMail(user.email, title, emailHtml);
    } catch (emailErr) {
      console.error('Failed to send budget threshold email:', emailErr);
    }
  }
  
  return { crossedThreshold: thresholdToAlert, percent };
}

export async function checkCategoryBudgetThresholds(
  userId: string,
  category: string
): Promise<{ crossedLimit: boolean; percent: number } | null> {
  const user = await userRepository.findById(userId);
  if (!user || !user.categoryBudgets) return null;

  // Find key in categoryBudgets case-insensitively
  const budgetKey = Object.keys(user.categoryBudgets).find(
    k => k.toLowerCase() === category.toLowerCase()
  );
  if (!budgetKey) return null;
  const limit = user.categoryBudgets[budgetKey];
  // If no budget is set for this category, or it's 0, skip checking
  if (!limit || Number(limit) <= 0) return null;

  const categoryLimit = Number(limit);
  const resetDay = user.budgetResetDay || 1;
  const { start, end } = getBudgetPeriodRange(resetDay);

  const expenses = await expenseRepository.findByUserId(userId);
  const periodExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return e.category.toLowerCase() === category.toLowerCase() && d >= start && d <= end;
  });

  const spent = periodExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const percent = (spent / categoryLimit) * 100;

  // We only notify when spent reaches or exceeds 100%
  if (percent < 100) {
    return { crossedLimit: false, percent };
  }

  // Check if we already notified for this category budget threshold in the current period
  const notifications = await notificationRepository.findByUserId(userId);
  const cycleNotifications = notifications.filter(n => n.createdAt >= start && n.createdAt <= end);

  const hasAlerted = cycleNotifications.some(n => {
    return n.title.includes(`Presupuesto de ${category} Agotado`) || 
           (n.title.includes('Límite') && n.message.includes(`"${category}"`));
  });

  if (hasAlerted) {
    return { crossedLimit: true, percent };
  }

  const title = `⚠️ Presupuesto de ${category} Agotado`;
  const message = `Has alcanzado o superado el límite de tu presupuesto para la categoría "${category}". Límite: ${categoryLimit.toLocaleString()} ${user.currency || 'EUR'}, Gastado: ${spent.toLocaleString()} ${user.currency || 'EUR'} (${percent.toFixed(1)}%).`;

  const isExpenseAlertsEnabled = user.visualSettings?.expenseAlerts !== false;

  if (isExpenseAlertsEnabled) {
    // 1. Create DB Notification
    await notificationRepository.create({
      userId,
      title,
      message,
      type: 'warning',
      read: false,
    });

    // 2. Dispatch Email
    const recommendations = [
      `Reduce tus gastos en la categoría "${category}" de forma inmediata.`,
      `Reasigna presupuesto de otras categorías menos críticas si es necesario.`,
      `Lleva un registro estricto de cualquier desembolso adicional en esta categoría.`
    ];

    const emailHtml = EmailTemplates.getBudgetTemplate(
      user.fullName,
      100,
      categoryLimit,
      spent,
      percent,
      user.currency || 'EUR',
      recommendations
    );

    try {
      await ResendEmailService.sendMail(user.email, title, emailHtml);
    } catch (emailErr) {
      console.error(`Failed to send category budget threshold email for ${category}:`, emailErr);
    }
  }

  return { crossedLimit: true, percent };
}
