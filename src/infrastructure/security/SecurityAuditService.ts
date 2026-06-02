import { supabase, hasSupabaseKeys } from '../database/supabaseClient';

export class SecurityAuditService {
  static async logAction(
    userId: string | null,
    action: string,
    req?: Request
  ): Promise<void> {
    const ipAddress = req ? req.headers.get('x-forwarded-for') || '127.0.0.1' : '127.0.0.1';
    const userAgent = req ? req.headers.get('user-agent') || 'Unknown' : 'Server/System';

    console.log(`[AUDIT LOG] User: ${userId || 'Anonymous'} | Action: ${action} | IP: ${ipAddress} | UA: ${userAgent}`);

    if (!hasSupabaseKeys) return;

    try {
      await supabase.from('security_audits').insert({
        user_id: userId,
        action,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (err) {
      console.error('Failed to write security audit log to Supabase:', err);
    }
  }
}
