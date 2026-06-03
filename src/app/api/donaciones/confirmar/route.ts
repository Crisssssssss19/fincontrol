import { NextResponse } from 'next/server';
import { supabase, hasSupabaseKeys } from '@/infrastructure/database/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { preferenceId } = body;

    if (!preferenceId) {
      return NextResponse.json({ success: false, error: 'preferenceId is required' }, { status: 400 });
    }

    if (!hasSupabaseKeys) {
      console.warn('[DONATION CONFIRMATION - NO DB] Supabase keys missing. Skipping DB updates.');
      return NextResponse.json({ success: true, message: 'Simulated success (no database config)' });
    }

    // 1. Fetch the donation to check its status and grab the user_id and amount
    const { data: donation, error: fetchErr } = await supabase
      .from('donations')
      .select('*')
      .eq('preference_id', preferenceId)
      .single();

    if (fetchErr || !donation) {
      console.error(`[DONATION CONFIRMATION] Donation record not found for preferenceId: ${preferenceId}`, fetchErr);
      return NextResponse.json({ success: false, error: 'Donation not found' }, { status: 404 });
    }

    // 2. Only update if it is currently pending (to avoid multiple triggers or overrides)
    if (donation.status !== 'approved') {
      const { error: updateErr } = await supabase
        .from('donations')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('preference_id', preferenceId);

      if (updateErr) {
        console.error('[DONATION CONFIRMATION] Failed to update donation status:', updateErr);
        return NextResponse.json({ success: false, error: 'Database update failed' }, { status: 500 });
      }

      console.log(`[DONATION CONFIRMATION] Donation ${preferenceId} successfully updated to approved.`);

      // 3. Insert notification for user if user_id is present
      if (donation.user_id) {
        const { error: notifyErr } = await supabase
          .from('notifications')
          .insert({
            user_id: donation.user_id,
            title: '¡Donación Recibida! ❤️',
            message: `Muchas gracias por tu donación de $${Number(donation.amount).toFixed(2)} USD vía PayPal. Tu apoyo ayuda a mantener FinControl activo.`,
            type: 'success',
            read: false
          });

        if (notifyErr) {
          console.error('[DONATION CONFIRMATION] Failed to insert notification:', notifyErr);
        } else {
          console.log(`[DONATION CONFIRMATION] Success notification sent to user: ${donation.user_id}`);
        }
      }
    } else {
      console.log(`[DONATION CONFIRMATION] Donation ${preferenceId} was already approved.`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DONATION CONFIRMATION] Exception error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
