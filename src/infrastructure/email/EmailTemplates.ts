export class EmailTemplates {
  private static getBaseHead(title: string): string {
    return `
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          @media only screen and (max-width: 600px) {
            .container {
              width: 100% !important;
              padding: 10px !important;
            }
            .card {
              padding: 24px !important;
              border-radius: 16px !important;
            }
            .code-text {
              font-size: 28px !important;
              letter-spacing: 4px !important;
            }
          }
        </style>
      </head>
    `;
  }

  static getVerificationTemplate(fullName: string, code: string): string {
    return `
      <!DOCTYPE html>
      <html>
        ${this.getBaseHead('Verifica tu cuenta - FinControl')}
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Outfit', 'Segoe UI', sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 0;">
            <tr>
              <td align="center">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="550" style="margin: 0 auto;">
                  
                  <!-- Logo / Header -->
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #10b981; border-radius: 12px; padding: 8px;">
                            <span style="color: #ffffff; font-size: 24px; font-weight: 900; line-height: 1; display: block; font-family: 'Outfit', sans-serif;">FC</span>
                          </td>
                          <td style="padding-left: 10px;">
                            <span style="font-size: 22px; font-weight: 800; color: #0f172a; tracking-tight: -0.5px; font-family: 'Outfit', sans-serif;">FinControl</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Card -->
                  <tr>
                    <td class="card" style="background-color: #ffffff; border-radius: 20px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.03), 0 8px 10px -6px rgba(0, 0, 0, 0.03);">
                      
                      <!-- Title -->
                      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 24px; font-weight: 800; font-family: 'Outfit', sans-serif;">¡Hola, ${fullName}!</h2>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6; font-family: 'Outfit', sans-serif;">
                        Gracias por registrarte en <strong>FinControl PWA</strong>. Para completar el registro y verificar tu dirección de correo electrónico, por favor introduce el siguiente código de seguridad:
                      </p>

                      <!-- Code Box -->
                      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #a7f3d0; border-radius: 16px; padding: 24px 10px; text-align: center; margin-bottom: 24px; box-shadow: inset 0 2px 4px 0 rgba(16, 185, 129, 0.03);">
                        <span class="code-text" style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #047857; font-family: 'Outfit', sans-serif; display: inline-block; padding-left: 8px;">${code}</span>
                      </div>

                      <!-- Warning / Notice -->
                      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td valign="top" style="padding-right: 8px;">
                              <span style="font-size: 14px; line-height: 1;">ℹ️</span>
                            </td>
                            <td style="color: #64748b; font-size: 12px; line-height: 1.5; font-family: 'Outfit', sans-serif;">
                              Este código es de un solo uso, de carácter confidencial y expirará automáticamente en <strong>15 minutos</strong>. Si no solicitaste esta cuenta, puedes ignorar este mensaje.
                            </td>
                          </tr>
                        </table>
                      </div>

                      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                      <p style="margin: 0; color: #94a3b8; font-size: 11px; text-align: center; font-family: 'Outfit', sans-serif;">
                        FinControl PWA — Gestión Financiera Inteligente
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  static getRecoveryTemplate(fullName: string, code: string): string {
    return `
      <!DOCTYPE html>
      <html>
        ${this.getBaseHead('Restablecer Contraseña - FinControl')}
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Outfit', 'Segoe UI', sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 0;">
            <tr>
              <td align="center">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="550" style="margin: 0 auto;">
                  
                  <!-- Logo / Header -->
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #f43f5e; border-radius: 12px; padding: 8px;">
                            <span style="color: #ffffff; font-size: 24px; font-weight: 900; line-height: 1; display: block; font-family: 'Outfit', sans-serif;">FC</span>
                          </td>
                          <td style="padding-left: 10px;">
                            <span style="font-size: 22px; font-weight: 800; color: #0f172a; tracking-tight: -0.5px; font-family: 'Outfit', sans-serif;">FinControl</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Card -->
                  <tr>
                    <td class="card" style="background-color: #ffffff; border-radius: 20px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.03), 0 8px 10px -6px rgba(0, 0, 0, 0.03);">
                      
                      <!-- Title -->
                      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 24px; font-weight: 800; font-family: 'Outfit', sans-serif;">Hola, ${fullName}</h2>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6; font-family: 'Outfit', sans-serif;">
                        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>FinControl PWA</strong>. Introduce el siguiente código de seguridad para continuar con el proceso:
                      </p>

                      <!-- Code Box -->
                      <div style="background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); border: 1px solid #fecdd3; border-radius: 16px; padding: 24px 10px; text-align: center; margin-bottom: 24px; box-shadow: inset 0 2px 4px 0 rgba(244, 63, 94, 0.03);">
                        <span class="code-text" style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #e11d48; font-family: 'Outfit', sans-serif; display: inline-block; padding-left: 8px;">${code}</span>
                      </div>

                      <!-- Warning / Notice -->
                      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td valign="top" style="padding-right: 8px;">
                              <span style="font-size: 14px; line-height: 1;">⚠️</span>
                            </td>
                            <td style="color: #64748b; font-size: 12px; line-height: 1.5; font-family: 'Outfit', sans-serif;">
                              Este código es válido únicamente durante <strong>10 minutos</strong>. Si no has solicitado este cambio, por favor ponte en contacto con nosotros inmediatamente y cambia tu contraseña.
                            </td>
                          </tr>
                        </table>
                      </div>

                      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                      <p style="margin: 0; color: #94a3b8; font-size: 11px; text-align: center; font-family: 'Outfit', sans-serif;">
                        FinControl PWA — Gestión Financiera Inteligente
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  static get2FATemplate(fullName: string, code: string): string {
    return `
      <!DOCTYPE html>
      <html>
        ${this.getBaseHead('Verificación de Doble Factor (2FA) - FinControl')}
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Outfit', 'Segoe UI', sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 0;">
            <tr>
              <td align="center">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="550" style="margin: 0 auto;">
                  
                  <!-- Logo / Header -->
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #6366f1; border-radius: 12px; padding: 8px;">
                            <span style="color: #ffffff; font-size: 24px; font-weight: 900; line-height: 1; display: block; font-family: 'Outfit', sans-serif;">FC</span>
                          </td>
                          <td style="padding-left: 10px;">
                            <span style="font-size: 22px; font-weight: 800; color: #0f172a; tracking-tight: -0.5px; font-family: 'Outfit', sans-serif;">FinControl</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Card -->
                  <tr>
                    <td class="card" style="background-color: #ffffff; border-radius: 20px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.03), 0 8px 10px -6px rgba(0, 0, 0, 0.03);">
                      
                      <!-- Title -->
                      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 24px; font-weight: 800; font-family: 'Outfit', sans-serif;">Código 2FA</h2>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6; font-family: 'Outfit', sans-serif;">
                        Estás intentando iniciar sesión en tu cuenta en <strong>FinControl PWA</strong>. Introduce el siguiente código temporal de 6 dígitos para verificar tu identidad:
                      </p>

                      <!-- Code Box -->
                      <div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border: 1px solid #c7d2fe; border-radius: 16px; padding: 24px 10px; text-align: center; margin-bottom: 24px; box-shadow: inset 0 2px 4px 0 rgba(99, 102, 241, 0.03);">
                        <span class="code-text" style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: 'Outfit', sans-serif; display: inline-block; padding-left: 8px;">${code}</span>
                      </div>

                      <!-- Warning / Notice -->
                      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td valign="top" style="padding-right: 8px;">
                              <span style="font-size: 14px; line-height: 1;">🔒</span>
                            </td>
                            <td style="color: #64748b; font-size: 12px; line-height: 1.5; font-family: 'Outfit', sans-serif;">
                              Este código de verificación de 2FA expirará en <strong>5 minutos</strong>. Por motivos de seguridad y resguardo de tus datos financieros, nunca compartas este código con nadie.
                            </td>
                          </tr>
                        </table>
                      </div>

                      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                      <p style="margin: 0; color: #94a3b8; font-size: 11px; text-align: center; font-family: 'Outfit', sans-serif;">
                        FinControl PWA — Gestión Financiera Inteligente
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  static getBudgetTemplate(
    fullName: string,
    threshold: number,
    totalBudget: number,
    spent: number,
    percent: number,
    currency: string,
    recommendations: string[]
  ): string {
    const isCritical = threshold >= 100;
    const isWarning = threshold === 90;
    const themeColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6';
    const bgLight = isCritical ? '#fef2f2' : isWarning ? '#fffbeb' : '#eff6ff';
    const border = isCritical ? '#fee2e2' : isWarning ? '#fef3c7' : '#dbeafe';
    const accentHeader = isCritical ? '#f43f5e' : isWarning ? '#eab308' : '#3b82f6';

    const recommendationList = recommendations.map(rec => `
      <tr style="font-family: 'Outfit', sans-serif;">
        <td valign="top" style="padding: 4px 8px 4px 0; font-size: 14px; color: ${themeColor};">⚡</td>
        <td style="padding: 4px 0; font-size: 13px; color: #475569; line-height: 1.5; font-family: 'Outfit', sans-serif;">
          ${rec}
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        ${this.getBaseHead('Notificación de Presupuesto - FinControl')}
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Outfit', 'Segoe UI', sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 0;">
            <tr>
              <td align="center">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="550" style="margin: 0 auto;">
                  
                  <!-- Logo / Header -->
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: ${accentHeader}; border-radius: 12px; padding: 8px;">
                            <span style="color: #ffffff; font-size: 24px; font-weight: 900; line-height: 1; display: block; font-family: 'Outfit', sans-serif;">FC</span>
                          </td>
                          <td style="padding-left: 10px;">
                            <span style="font-size: 22px; font-weight: 800; color: #0f172a; tracking-tight: -0.5px; font-family: 'Outfit', sans-serif;">FinControl</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Card -->
                  <tr>
                    <td class="card" style="background-color: #ffffff; border-radius: 20px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.03), 0 8px 10px -6px rgba(0, 0, 0, 0.03);">
                      
                      <!-- Title / Alert -->
                      <h2 style="margin: 0 0 12px 0; color: ${themeColor}; font-size: 22px; font-weight: 800; font-family: 'Outfit', sans-serif;">
                        ${isCritical ? '🚨 Límite de Presupuesto Superado' : isWarning ? '⚠️ Alerta de Presupuesto (90%)' : '🔔 Alerta de Presupuesto (80%)'}
                      </h2>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6; font-family: 'Outfit', sans-serif;">
                        Hola, <strong>${fullName}</strong>. Te informamos que tus gastos acumulados del periodo actual han alcanzado el <strong>${percent.toFixed(1)}%</strong> de tu presupuesto mensual configurado.
                      </p>

                      <!-- Metrics Panel -->
                      <div style="background: linear-gradient(135deg, ${bgLight} 0%, #ffffff 100%); border: 1px solid ${border}; padding: 20px; border-radius: 16px; margin-bottom: 24px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                          <tr>
                            <td style="color: #64748b; padding: 6px 0; font-family: 'Outfit', sans-serif;">Presupuesto Mensual:</td>
                            <td align="right" style="font-weight: 700; color: #0f172a; padding: 6px 0; font-family: 'Outfit', sans-serif;">${totalBudget.toLocaleString()} ${currency}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b; padding: 6px 0; font-family: 'Outfit', sans-serif;">Gasto Acumulado:</td>
                            <td align="right" style="font-weight: 800; color: ${themeColor}; padding: 6px 0; font-family: 'Outfit', sans-serif;">${spent.toLocaleString()} ${currency}</td>
                          </tr>
                          <tr style="border-top: 1px solid #f1f5f9;">
                            <td style="color: #64748b; padding: 10px 0 6px 0; font-family: 'Outfit', sans-serif; font-weight: 600;">Porcentaje Consumido:</td>
                            <td align="right" style="font-weight: 900; color: ${themeColor}; padding: 10px 0 6px 0; font-family: 'Outfit', sans-serif; font-size: 16px;">${percent.toFixed(1)}%</td>
                          </tr>
                        </table>
                      </div>

                      <!-- Recommendations Section -->
                      ${recommendations.length > 0 ? `
                        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; font-family: 'Outfit', sans-serif;">💡 Sugerencias del Asesor Financiero</h3>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                          ${recommendationList}
                        </table>
                      ` : ''}

                      <!-- Notice -->
                      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
                        <p style="margin: 0; color: #64748b; font-size: 11px; line-height: 1.5; font-family: 'Outfit', sans-serif;">
                          Esta es una alerta preventiva. No te enviaremos más correos de este límite a menos que alcances el siguiente umbral de advertencia o comience un nuevo ciclo presupuestario.
                        </p>
                      </div>

                      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                      <p style="margin: 0; color: #94a3b8; font-size: 11px; text-align: center; font-family: 'Outfit', sans-serif;">
                        FinControl PWA — Gestión Financiera Inteligente
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  static getWeeklySummaryTemplate(
    fullName: string,
    startDateStr: string,
    endDateStr: string,
    totalIncome: number,
    totalExpenses: number,
    balance: number,
    topCategory: string,
    topCategoryAmount: number,
    currency: string
  ): string {
    const isPositive = balance >= 0;
    const balanceColor = isPositive ? '#10b981' : '#ef4444';
    const bgLight = isPositive ? '#f0fdf4' : '#fef2f2';
    const border = isPositive ? '#a7f3d0' : '#fee2e2';

    return `
      <!DOCTYPE html>
      <html>
        ${this.getBaseHead('Resumen Semanal - FinControl')}
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Outfit', 'Segoe UI', sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 0;">
            <tr>
              <td align="center">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="550" style="margin: 0 auto;">
                  
                  <!-- Logo / Header -->
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #6366f1; border-radius: 12px; padding: 8px;">
                            <span style="color: #ffffff; font-size: 24px; font-weight: 900; line-height: 1; display: block; font-family: 'Outfit', sans-serif;">FC</span>
                          </td>
                          <td style="padding-left: 10px;">
                            <span style="font-size: 22px; font-weight: 800; color: #0f172a; tracking-tight: -0.5px; font-family: 'Outfit', sans-serif;">FinControl</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Card -->
                  <tr>
                    <td class="card" style="background-color: #ffffff; border-radius: 20px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.03), 0 8px 10px -6px rgba(0, 0, 0, 0.03);">
                      
                      <!-- Title -->
                      <h2 style="margin: 0 0 4px 0; color: #0f172a; font-size: 22px; font-weight: 800; font-family: 'Outfit', sans-serif;">📊 Tu Resumen Semanal</h2>
                      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 13px; font-family: 'Outfit', sans-serif;">
                        Periodo: <strong>${startDateStr}</strong> al <strong>${endDateStr}</strong>
                      </p>

                      <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6; font-family: 'Outfit', sans-serif;">
                        Hola, <strong>${fullName}</strong>. Aquí tienes el balance de tus movimientos financieros de la última semana.
                      </p>

                      <!-- Balance Panel -->
                      <div style="background: linear-gradient(135deg, ${bgLight} 0%, #ffffff 100%); border: 1px solid ${border}; padding: 24px; border-radius: 16px; margin-bottom: 24px; text-align: center;">
                        <span style="color: #64748b; font-size: 12px; text-transform: uppercase; tracking-spacing: 1px; font-weight: 600; display: block; margin-bottom: 6px;">Balance de la Semana</span>
                        <span style="font-size: 32px; font-weight: 900; color: ${balanceColor}; font-family: 'Outfit', sans-serif; display: block;">
                          ${isPositive ? '+' : ''}${balance.toLocaleString()} ${currency}
                        </span>
                      </div>

                      <!-- Income vs Expense Grid -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                        <tr>
                          <td width="48%" style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 16px; border-radius: 12px; text-align: center;">
                            <span style="color: #10b981; font-size: 16px; font-weight: bold; display: block; margin-bottom: 4px;">📈 Ingresos</span>
                            <span style="font-size: 14px; font-weight: 800; color: #0f172a;">${totalIncome.toLocaleString()} ${currency}</span>
                          </td>
                          <td width="4%"></td>
                          <td width="48%" style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 16px; border-radius: 12px; text-align: center;">
                            <span style="color: #ef4444; font-size: 16px; font-weight: bold; display: block; margin-bottom: 4px;">📉 Gastos</span>
                            <span style="font-size: 14px; font-weight: 800; color: #0f172a;">${totalExpenses.toLocaleString()} ${currency}</span>
                          </td>
                        </tr>
                      </table>

                      <!-- Category Breakdown -->
                      ${topCategory ? `
                        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; font-family: 'Outfit', sans-serif;">🔍 Categoría de mayor gasto</h3>
                        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="color: #475569; font-size: 14px; font-weight: 500; font-family: 'Outfit', sans-serif;">
                                📁 ${topCategory}
                              </td>
                              <td align="right" style="font-weight: 800; color: #0f172a; font-size: 14px; font-family: 'Outfit', sans-serif;">
                                ${topCategoryAmount.toLocaleString()} ${currency}
                              </td>
                            </tr>
                          </table>
                        </div>
                      ` : ''}

                      <!-- Recommendations / Tips -->
                      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; font-family: 'Outfit', sans-serif;">💡 Consejo Financiero Semanal</h3>
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                        <tr>
                          <td valign="top" style="padding-right: 8px; font-size: 14px; color: #6366f1;">✨</td>
                          <td style="color: #475569; font-size: 13px; line-height: 1.5; font-family: 'Outfit', sans-serif;">
                            ${isPositive 
                              ? '¡Buen trabajo! Has mantenido un saldo positivo esta semana. Considera enviar una parte de este remanente directamente a tus objetivos de ahorro para hacer crecer tu patrimonio.'
                              : 'Tus gastos superaron tus ingresos esta semana. Te recomendamos revisar tus gastos hormiga y categorizar detalladamente tus compras para identificar dónde puedes recortar.'
                            }
                          </td>
                        </tr>
                      </table>

                      <!-- Notice -->
                      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
                        <p style="margin: 0; color: #64748b; font-size: 11px; line-height: 1.5; font-family: 'Outfit', sans-serif;">
                          Recibes este correo porque tienes activado el "Resumen Semanal" en la configuración de notificaciones de FinControl. Puedes desactivarlo en cualquier momento desde tu perfil.
                        </p>
                      </div>

                      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                      <p style="margin: 0; color: #94a3b8; font-size: 11px; text-align: center; font-family: 'Outfit', sans-serif;">
                        FinControl PWA — Gestión Financiera Inteligente
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }
}
