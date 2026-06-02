export class EmailTemplates {
  static getVerificationTemplate(fullName: string, code: string): string {
    return `
      <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #006c49; font-weight: 800; font-size: 24px; margin-bottom: 8px;">¡Hola, ${fullName}!</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">Gracias por registrarte en <strong>FinControl PWA</strong>. Para completar el registro y verificar tu dirección de correo electrónico, por favor introduce el siguiente código de verificación de 6 dígitos:</p>
        
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0f172a;">${code}</span>
        </div>
        
        <p style="color: #64748b; font-size: 11px; line-height: 1.4;">Este código de verificación es de un solo uso y expirará en <strong>15 minutos</strong>. Si no has solicitado esta cuenta, puedes ignorar este mensaje de forma segura.</p>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 10px; text-align: center;">FinControl PWA — Gestión Financiera Inteligente</p>
      </div>
    `;
  }

  static getRecoveryTemplate(fullName: string, code: string): string {
    return `
      <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #ef4444; font-weight: 800; font-size: 24px; margin-bottom: 8px;">Restablecer Contraseña</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>FinControl PWA</strong>. Introduce el siguiente código de seguridad de 6 dígitos para continuar:</p>
        
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 24px; border: 1px solid #fee2e2;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #ef4444;">${code}</span>
        </div>
        
        <p style="color: #64748b; font-size: 11px; line-height: 1.4;">Este código es válido durante <strong>10 minutos</strong>. Si no solicitaste este cambio, por favor ponte en contacto con nosotros inmediatamente y cambia tu contraseña actual.</p>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 10px; text-align: center;">FinControl PWA — Gestión Financiera Inteligente</p>
      </div>
    `;
  }

  static get2FATemplate(fullName: string, code: string): string {
    return `
      <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #6366f1; font-weight: 800; font-size: 24px; margin-bottom: 8px;">Verificación de Doble Factor (2FA)</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">Estás intentando iniciar sesión en tu cuenta en <strong>FinControl PWA</strong>. Introduce el siguiente código temporal de 6 dígitos para verificar tu identidad:</p>
        
        <div style="background-color: #eef2ff; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 24px; border: 1px solid #e0e7ff;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #6366f1;">${code}</span>
        </div>
        
        <p style="color: #64748b; font-size: 11px; line-height: 1.4;">Este código de 2FA expirará en <strong>5 minutos</strong>. Por motivos de seguridad, nunca compartas este código con nadie.</p>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 10px; text-align: center;">FinControl PWA — Gestión Financiera Inteligente</p>
      </div>
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

    const recommendationList = recommendations.map(rec => `<li style="margin-bottom: 8px; font-size: 13px; color: #475569;">${rec}</li>`).join('');

    return `
      <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: ${themeColor}; font-weight: 800; font-size: 22px; margin-bottom: 8px;">
          ${isCritical ? '⚠️ Límite de Presupuesto Superado' : isWarning ? '⚡ Advertencia de Presupuesto (90%)' : '🔔 Alerta Preventiva de Presupuesto (80%)'}
        </h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
          Hola, <strong>${fullName}</strong>. Te informamos que tus gastos acumulados del periodo actual han alcanzado el <strong>${percent.toFixed(1)}%</strong> de tu presupuesto mensual configurado.
        </p>
        
        <div style="background-color: ${bgLight}; border: 1px solid ${border}; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Presupuesto Total:</td>
              <td style="text-align: right; font-weight: 800; color: #0f172a; padding: 4px 0;">${totalBudget.toFixed(2)} ${currency}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Monto Gastado:</td>
              <td style="text-align: right; font-weight: 800; color: ${themeColor}; padding: 4px 0;">${spent.toFixed(2)} ${currency}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Porcentaje Consumido:</td>
              <td style="text-align: right; font-weight: 800; color: ${themeColor}; padding: 4px 0;">${percent.toFixed(1)}%</td>
            </tr>
          </table>
        </div>
        
        <h3 style="color: #0f172a; font-size: 15px; font-weight: 700; margin-bottom: 12px;">💡 Recomendaciones de Ahorro</h3>
        <ul style="padding-left: 20px; margin-bottom: 24px; margin-top: 0;">
          ${recommendationList}
        </ul>
        
        <p style="color: #64748b; font-size: 11px; line-height: 1.4;">Te notificaremos nuevamente solo si alcanzas el siguiente nivel de alerta o al reinicio de tu periodo presupuestario.</p>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 10px; text-align: center;">FinControl PWA — Gestión Financiera Inteligente</p>
      </div>
    `;
  }
}

