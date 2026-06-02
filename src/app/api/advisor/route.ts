import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';
import { incomeRepository } from '@/infrastructure/repositories/SupabaseIncomeRepository';
import { expenseRepository } from '@/infrastructure/repositories/SupabaseExpenseRepository';
import { savingsGoalRepository } from '@/infrastructure/repositories/SupabaseSavingsGoalRepository';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { GetUserIncomes } from '@/core/usecases/incomes/GetUserIncomes';
import { GetUserExpenses } from '@/core/usecases/expenses/GetUserExpenses';
import { GetUserProfile } from '@/core/usecases/users/GetUserProfile';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const language = searchParams.get('lang') || 'es';

    // 1. Fetch user financial records and profile using existing clean repositories & usecases
    const userUsecase = new GetUserProfile(userRepository);
    const profile = await userUsecase.execute(user.userId);
    const userCurrency = profile?.currency || 'EUR';

    const incomeUsecase = new GetUserIncomes(incomeRepository);
    const incomes = await incomeUsecase.execute(user.userId);

    const expenseUsecase = new GetUserExpenses(expenseRepository);
    const expenses = await expenseUsecase.execute(user.userId);

    const goals = await savingsGoalRepository.findByUserId(user.userId);

    // 2. Perform aggregate math for context
    const totalIncomes = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = totalIncomes - totalExpenses;
    const savingsRate = totalIncomes > 0 ? Math.max(0, Math.min(100, Math.round((currentBalance / totalIncomes) * 100))) : 0;

    // Summarize categories of expenses
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const categoriesSummary = Object.entries(categoryTotals)
      .map(([cat, amt]) => `- ${cat}: ${amt} ${userCurrency}`)
      .join('\n');

    // Summarize goals
    const goalsSummary = goals
      .map((g) => `- ${g.name}: ${g.currentAmount} / ${g.targetAmount} ${userCurrency} (Límite: ${g.targetDate})`)
      .join('\n');

    const recentTransactionsSummary = expenses
      .slice(0, 5)
      .map((e) => `- ${e.date} | ${e.description}: ${e.amount} ${userCurrency} (${e.category})`)
      .join('\n');

    // 3. Fallback advice if OpenRouter key is missing or fails
    const getFallbackAdvice = (lang: string) => {
      if (lang === 'en') {
        return {
          tips: [
            {
              title: "Create an Emergency Fund",
              category: "Saving",
              description: `With a balance of ${currentBalance} ${userCurrency}, we recommend setting aside 3 to 6 months of expenses for emergencies.`,
              impact: "High"
            },
            {
              title: "Optimize Variable Expenses",
              category: "Expenses",
              description: expenses.length > 0 
                ? "Review your largest expense categories to identify variable costs you can easily cut by 10-15%."
                : "Register your regular expenses to let our smart algorithm identify potential savings in your daily habits.",
              impact: "Medium"
            },
            {
              title: "Track Income Streams",
              category: "Income",
              description: `Your active savings rate is ${savingsRate}%. Creating secondary income streams could help accelerate your savings goals.`,
              impact: "High"
            }
          ]
        };
      } else {
        return {
          tips: [
            {
              title: "Crea un Fondo de Emergencia",
              category: "Ahorro",
              description: `Con un balance actual de ${currentBalance} ${userCurrency}, te sugerimos separar de 3 a 6 meses de gastos básicos para imprevistos.`,
              impact: "Alto"
            },
            {
              title: "Optimiza Gastos Variables",
              category: "Gastos",
              description: expenses.length > 0 
                ? "Revisa tus categorías con mayores gastos para identificar suscripciones o compras impulsivas que puedas recortar."
                : "Comienza a registrar tus gastos del día a día para que el asistente pueda identificar fugas de capital ocultas.",
              impact: "Medio"
            },
            {
              title: "Vigila tu Tasa de Ahorro",
              category: "Ahorro",
              description: `Tu tasa de ahorro actual es de ${savingsRate}%. Intenta aumentarla gradualmente destinando un 5% extra a tus metas de ahorro activas.`,
              impact: "Alto"
            }
          ]
        };
      }
    };

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.includes('tu_clave') || apiKey.startsWith('sk-or-v1-YOUR')) {
      console.warn("Using fallback financial advisor advice because OPENROUTER_API_KEY is not configured.");
      return NextResponse.json({ success: true, ...getFallbackAdvice(language) });
    }

    // 4. Construct Expert Advisor Prompt
    const systemPrompt = `Eres un asesor financiero e inteligencia artificial experta integrada en FinControl.
Tu tarea es analizar los datos financieros de un usuario y proveer exactamente 3 consejos financieros prácticos, personalizados y sumamente estratégicos.
Debes responder ÚNICAMENTE con un objeto JSON válido. No incluyas bloques de código, textos adicionales ni formatos markdown.

El formato JSON debe ser exactamente:
{
  "tips": [
    {
      "title": "Título corto y directo (máx 5 palabras)",
      "category": "Ahorro" | "Ingresos" | "Gastos" | "Inversión" | "Saving" | "Income" | "Expenses" | "Investment",
      "description": "Explicación detallada y muy personalizada con consejos concretos y referencias a los números reales del usuario.",
      "impact": "Alto" | "Medio" | "Bajo" | "High" | "Medium" | "Low"
    }
  ]
}

IMPORTANTE:
- Responde obligatoriamente en el idioma del usuario. Si el idioma solicitado es 'es', responde en Español. Si es 'en', responde en Inglés.
- Haz referencia directa a sus transacciones, balance, tasa de ahorro y metas para que los consejos se sientan reales e inteligentes.`;

    const userPrompt = `IDIOMA SOLICITADO: ${language === 'es' ? 'Español (es)' : 'Inglés (en)'}
DATOS DEL USUARIO:
- Balance Actual: ${currentBalance} ${userCurrency}
- Ingresos Totales Recientes: ${totalIncomes} ${userCurrency}
- Gastos Totales Recientes: ${totalExpenses} ${userCurrency}
- Tasa de Ahorro: ${savingsRate}%
- Moneda Activa: ${userCurrency}

GASTOS POR CATEGORÍA:
${categoriesSummary || 'Ningún gasto registrado aún.'}

METAS DE AHORRO ACTIVAS:
${goalsSummary || 'Ninguna meta de ahorro creada aún.'}

ÚLTIMAS TRANSACCIONES DE GASTOS:
${recentTransactionsSummary || 'Ninguna transacción reciente.'}

Genera los 3 consejos financieros personalizados en formato JSON ahora.`;

    // 5. Call OpenRouter API
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://fincontrol.app",
          "X-Title": "FinControl Smart Advisor"
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API responded with status ${response.status}`);
      }

      const responseData = await response.json();
      const content = responseData.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenRouter");
      }

      // Parse and validate LLM JSON response
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.tips) && parsed.tips.length > 0) {
        return NextResponse.json({ success: true, tips: parsed.tips });
      } else {
        throw new Error("Invalid structure returned by AI");
      }
    } catch (apiErr) {
      console.error("OpenRouter API error, falling back to local heuristic rules:", apiErr);
      return NextResponse.json({ success: true, ...getFallbackAdvice(language) });
    }

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
