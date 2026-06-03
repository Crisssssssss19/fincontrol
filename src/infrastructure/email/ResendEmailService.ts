import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || 're_mock_key';
const resend = new Resend(resendApiKey);
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'FinControl <noreply@resend.dev>';

export class ResendEmailService {
  static async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    const maxRetries = 3;
    let attempts = 0;
    let success = false;
    let lastError: any = null;

    console.log(`[EMAIL SERVICE] Attempting to send email to: ${to} | Subject: ${subject}`);

    while (attempts < maxRetries && !success) {
      attempts++;
      try {
        if (resendApiKey === 're_mock_key' || !process.env.RESEND_API_KEY) {
          // Simulator mode for local testing if API key is not configured
          console.warn(`[EMAIL SIMULATOR] RESEND_API_KEY not configured. Simulating email:
          To: ${to}
          Subject: ${subject}
          Body: ${html.replace(/<[^>]*>/g, '').trim()}
          `);
          success = true;
          break;
        }

        const { data, error } = await resend.emails.send({
          from: resendFromEmail,
          to,
          subject,
          html,
        });

        if (error) {
          throw new Error(error.message);
        }

        console.log(`[EMAIL SERVICE] Successfully sent email on attempt ${attempts}. Data:`, data);
        console.log(`[EMAIL SERVICE LOG] Contenido del correo enviado (Copia el código de aquí):
        Para: ${to}
        Asunto: ${subject}
        Cuerpo: ${html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()}
        `);
        success = true;
      } catch (err: any) {
        lastError = err;
        console.error(`[EMAIL SERVICE] Failed email attempt ${attempts}/${maxRetries} to ${to}:`, err.message);
        // Exponential backoff wait before retrying
        if (attempts < maxRetries) {
          await new Promise((res) => setTimeout(res, Math.pow(2, attempts) * 1000));
        }
      }
    }

    if (!success) {
      console.error(`[EMAIL SERVICE] Permanently failed to send email to ${to} after ${maxRetries} attempts. Last error:`, lastError?.message || lastError);
      console.warn(`[EMAIL SERVICE FALLBACK] Since the email failed to send, here is the text content for debugging/testing:
      To: ${to}
      Subject: ${subject}
      Body: ${html.replace(/<[^>]*>/g, '').trim()}
      `);
    }

    return success;
  }
}
