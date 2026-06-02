import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || 're_mock_key';
const resend = new Resend(resendApiKey);

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
          from: 'FinControl <noreply@resend.dev>', // Resend free tier sends from noreply@resend.dev
          to,
          subject,
          html,
        });

        if (error) {
          throw new Error(error.message);
        }

        console.log(`[EMAIL SERVICE] Successfully sent email on attempt ${attempts}. Data:`, data);
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
      console.error(`[EMAIL SERVICE] Permanently failed to send email to ${to} after ${maxRetries} attempts. Last error:`, lastError);
    }

    return success;
  }
}
