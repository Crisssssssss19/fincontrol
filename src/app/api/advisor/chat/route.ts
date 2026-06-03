import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';
import { incomeRepository } from '@/infrastructure/repositories/SupabaseIncomeRepository';
import { expenseRepository } from '@/infrastructure/repositories/SupabaseExpenseRepository';
import { savingsGoalRepository } from '@/infrastructure/repositories/SupabaseSavingsGoalRepository';
import { userRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { GetUserIncomes } from '@/core/usecases/incomes/GetUserIncomes';
import { GetUserExpenses } from '@/core/usecases/expenses/GetUserExpenses';
import { GetUserProfile } from '@/core/usecases/users/GetUserProfile';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { messages, lang } = body;
    const language = lang || 'es';

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'Messages are required' }, { status: 400 });
    }

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

    const context = {
      currentBalance,
      userCurrency,
      savingsRate,
      categoriesSummary,
      goalsSummary,
      recentTransactionsSummary
    };

    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // Heuristic fallback logic
    const getHeuristicReply = (message: string) => {
      const msg = message.toLowerCase();
      
      if (language === 'en') {
        if (msg.includes('hello') || msg.includes('hi') || msg.includes('greet') || msg.includes('hey')) {
          return `Hi there! I am your AI Financial Advisor. I am here to help you analyze your transactions, plan budgets, and optimize your saving habits in real time.\n\nCurrently, you have a balance of **${currentBalance} ${userCurrency}** and your savings rate is at **${savingsRate}%**. What would you like to discuss today?`;
        }
        if (msg.includes('save') || msg.includes('saving') || msg.includes('invest')) {
          return `Your monthly savings rate is **${savingsRate}%**. To accelerate your savings goals:\n1. **Define clear objectives**: Set targets in your savings goals panel.\n2. **Use the 50/30/20 rule**: 50% for needs, 30% for wants, and 20% directly to savings.\n3. **Set category limits**: Track category budgets on the expenses page to prevent overspending.`;
        }
        if (msg.includes('expens') || msg.includes('spend') || msg.includes('cost')) {
          return `Analyzing your monthly category expenses:\n${categoriesSummary || '- No expenses registered this month.'}\n\nI recommend setting a budget limit on your highest-cost categories in the category budgets tab to receive warning alerts before exceeding them.`;
        }
        if (msg.includes('budget') || msg.includes('limit')) {
          return `I have activated the new **Category Budgets** manager in your expenses tab! You can now set a monthly spending limit for Food, Transport, Housing, etc.\n\nYou will see color-coded progress bars (green, amber, red) indicating if you are spending safely or approaching your limit.`;
        }
        if (msg.includes('bill') || msg.includes('invoice') || msg.includes('calendar') || msg.includes('due')) {
          return `To manage recurring bills, check out the new **Calendar** view on the invoices page.\n\nYou can see all due dates highlighted by urgency (red for overdue, yellow for upcoming, green for safe) and mark them as paid directly from the date cells.`;
        }
        return `Reviewing your current financial state:\n- Balance: **${currentBalance} ${userCurrency}**\n- Savings rate: **${savingsRate}%**\n\nSetting category limits or adding bills helps me provide better recommendations. Do you have a specific question about your transactions?`;
      } else {
        if (msg.includes('hola') || msg.includes('saludo') || msg.includes('buenos dias') || msg.includes('buenas tardes')) {
          return `¡Hola! Soy tu Asesor Financiero Personal. Estoy aquí para ayudarte a analizar tus finanzas y tomar mejores decisiones en tiempo real.\n\nActualmente veo que tienes un balance de **${currentBalance} ${userCurrency}** y tu tasa de ahorro está en el **${savingsRate}%**. ¿De qué te gustaría hablar hoy?`;
        }
        if (msg.includes('ahorr') || msg.includes('ahorrar') || msg.includes('inver')) {
          return `Tu tasa de ahorro mensual real es del **${savingsRate}%**. Para acelerar tus metas, te recomiendo:\n1. **Fijar objetivos claros**: Veo tus metas activas y van avanzando, trata de priorizar la de mayor urgencia.\n2. **Regla del 50/30/20**: Destina 50% a necesidades, 30% a deseos y 20% directamente al ahorro.\n3. **Optimizar gastos**: ¿Qué te parece si definimos presupuestos límite para tus categorías más costosas en la pestaña de presupuestos?`;
        }
        if (msg.includes('gasto') || msg.includes('gastar') || msg.includes('costo') || msg.includes('consumo')) {
          return `He analizado tus consumos. Tus gastos acumulados por categoría este mes son:\n${categoriesSummary || 'Ningún gasto registrado aún.'}\n\nTe recomiendo que revises la categoría que más consume tu presupuesto y establezcas un presupuesto mensual límite para ella en la sección de gastos. Así te enviaremos alertas si te aproximas al límite.`;
        }
        if (msg.includes('presupuesto') || msg.includes('limite')) {
          return `¡Gran pregunta! Acabo de habilitar la pestaña de **Presupuestos por Categoría** en la página de gastos. Allí puedes definir un límite mensual en pesos o euros para cada una de tus categorías de gasto (Alimentación, Transporte, Ocio, etc.).\n\nEl sistema te mostrará barras de progreso con alertas de colores (verde, ámbar y rojo) para indicarte si estás consumiendo tu dinero de forma segura o si estás en zona crítica.`;
        }
        if (msg.includes('factura') || msg.includes('pago') || msg.includes('vence') || msg.includes('calendario')) {
          return `Para el control de tus facturas y gastos recurrentes, puedes usar la pestaña de **Calendario** en la sección de facturas.\n\nAllí verás de forma visual una rejilla mensual con todos tus vencimientos destacados por colores de alerta (rojo para vencido/crítico, amarillo para próximo y verde para seguro), y podrás marcar facturas como pagadas directamente al hacer clic en el día correspondiente.`;
        }
        return `Analizando tus datos financieros actuales:\n- Balance: **${currentBalance} ${userCurrency}**\n- Tasa de ahorro: **${savingsRate}%**\n\nTe sugiero que establezcas metas claras en la sección de donaciones o presupuestos de gastos para optimizar tus finanzas. ¿Tienes alguna pregunta específica sobre tus gastos de este mes?`;
      }
    };

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.includes('tu_clave') || apiKey.startsWith('sk-or-v1-YOUR')) {
      console.warn("Using fallback financial advisor chat because OPENROUTER_API_KEY is not configured.");
      return NextResponse.json({ success: true, response: getHeuristicReply(lastUserMessage) });
    }

    // 3. Construct Expert Advisor Prompt
    const systemPrompt = `Eres un asesor financiero e inteligencia artificial experta integrada en la aplicación FinControl.
Tu tarea es conversar con el usuario sobre sus finanzas personales de forma amable, empática, y profesional.

Aquí tienes los datos financieros reales del usuario para contextualizar todas tus respuestas:
- Moneda activa: ${userCurrency}
- Balance actual: ${currentBalance} ${userCurrency}
- Ingresos totales: ${totalIncomes} ${userCurrency}
- Gastos totales: ${totalExpenses} ${userCurrency}
- Tasa de ahorro: ${savingsRate}%

Gastos por categoría:
${categoriesSummary || 'Ningún gasto registrado aún.'}

Metas de ahorro:
${goalsSummary || 'Ninguna meta de ahorro creada aún.'}

Últimas transacciones:
${recentTransactionsSummary || 'Ninguna transacción reciente.'}

IMPORTANTE:
- Responde brevemente (máximo 2-3 párrafos cortos por mensaje) en el mismo idioma en el que te hable el usuario (${language === 'es' ? 'Español' : 'Inglés'}). Sé extremadamente práctico, sugiriendo acciones concretas y haciendo referencia directa a sus transacciones, balance y metas reales cuando sea oportuno. Evita discursos genéricos o respuestas interminables.`;

    const chatHistory = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const modelsToTry = [
      "google/gemini-2-flash:free",
      "deepseek/deepseek-chat:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "meta-llama/llama-3.2-3b-instruct:free",
      "openrouter/free"
    ];

    let lastError = null;
    let replyText = null;

    for (const model of modelsToTry) {
      try {
        console.log(`[AI Chat Advisor] Attempting chat using model: ${model}`);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://fincontrol.app",
            "X-Title": "FinControl AI Advisor Chat"
          },
          body: JSON.stringify({
            model: model,
            messages: chatHistory
          })
        });

        if (!response.ok) {
          throw new Error(`OpenRouter responded with status ${response.status} for model ${model}`);
        }

        const responseData = await response.json();
        
        if (responseData.error) {
          throw new Error(`API error from OpenRouter: ${responseData.error.message || JSON.stringify(responseData.error)}`);
        }

        const content = responseData.choices?.[0]?.message?.content;
        if (content) {
          replyText = content;
          console.log(`[AI Chat Advisor] Successfully generated response using model ${model}`);
          break; // Success! Break out of loop.
        } else {
          throw new Error(`Empty response content returned by model ${model}`);
        }
      } catch (err: any) {
        console.warn(`[AI Chat Advisor] Model ${model} failed:`, err.message);
        lastError = err;
      }
    }

    if (replyText) {
      return NextResponse.json({ success: true, response: replyText });
    } else {
      console.error("[AI Chat Advisor] All resilient AI models failed. Falling back to local heuristic reply.", lastError);
      return NextResponse.json({ success: true, response: getHeuristicReply(lastUserMessage) });
    }

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
