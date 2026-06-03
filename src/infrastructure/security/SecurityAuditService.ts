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

  static async getRecentLogins(userId: string): Promise<any[]> {
    if (!hasSupabaseKeys) {
      // Mock data if database is disabled or offline
      return [
        {
          id: 'mock-1',
          created_at: new Date().toISOString(),
          ip_address: '192.168.1.15',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          action: 'login_success'
        },
        {
          id: 'mock-2',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          ip_address: '186.112.5.90',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
          action: 'login_success'
        }
      ];
    }

    try {
      const { data, error } = await supabase
        .from('security_audits')
        .select('*')
        .eq('user_id', userId)
        .in('action', ['login_success', 'login_success_google', '2fa_login_success'])
        .order('created_at', { ascending: false })
        .limit(5); // Show top 5 recent logins

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to get security audits:', err);
      return [];
    }
  }
}
