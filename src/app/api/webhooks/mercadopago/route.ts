import { NextResponse } from 'next/server';
import { supabase, hasSupabaseKeys } from '@/infrastructure/database/supabaseClient';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Mercado Pago webhook notifications can send info via query params (IPN) or JSON body
    let paymentId = searchParams.get('id') || searchParams.get('data.id');
    let topic = searchParams.get('topic') || searchParams.get('type');

    try {
      const body = await req.json();
      console.log('[MERCADO PAGO WEBHOOK RECEIVED] Body:', JSON.stringify(body));

      if (body.data?.id) {
        paymentId = String(body.data.id);
      } else if (body.id && body.type === 'payment') {
        paymentId = String(body.id);
      }
      if (body.type) {
        topic = body.type;
      }
    } catch (e) {
      console.log('[MERCADO PAGO WEBHOOK] No JSON body or failed to parse body');
    }

    // Only process payment notifications
    if (!paymentId || (topic && topic !== 'payment')) {
      console.log(`[MERCADO PAGO WEBHOOK] Ignored event. Payment ID: ${paymentId}, Topic: ${topic}`);
      return NextResponse.json({ success: true, message: 'Notification received but ignored (non-payment)' });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('[MERCADO PAGO WEBHOOK] Access token missing on server configuration');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // Mercado Pago Developer Sandbox testing tool uses a fake payment ID "123456"
    // to test webhook connectivity. We bypass the verification query and return 200 OK.
    if (paymentId === '123456') {
      console.log('[MERCADO PAGO WEBHOOK] Sandbox connectivity test received successfully (ID: 123456)');
      return NextResponse.json({ success: true, message: 'Test webhook verified successfully' });
    }

    // Fetch real payment status directly from Mercado Pago API
    console.log(`[MERCADO PAGO WEBHOOK] Fetching payment details for ID: ${paymentId}`);
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[MERCADO PAGO WEBHOOK] Failed to fetch payment details from Mercado Pago API. Status: ${response.status}. Error: ${errText}`);
      return NextResponse.json({ success: false, error: 'Failed to verify payment with gateway' }, { status: 502 });
    }

    const paymentDetails = await response.json();
    const { status, preference_id, transaction_amount, currency_id } = paymentDetails;
    
    console.log(`[MERCADO PAGO WEBHOOK] Payment details verified: ID: ${paymentId} | Preference ID: ${preference_id} | Status: ${status} | Amount: ${transaction_amount} ${currency_id}`);

    // Map Mercado Pago payment status to donations status
    let mappedStatus = 'pending';
    if (status === 'approved') {
      mappedStatus = 'approved';
    } else if (status === 'rejected' || status === 'cancelled' || status === 'refunded' || status === 'charged_back') {
      mappedStatus = 'rejected';
    }

    if (hasSupabaseKeys && preference_id) {
      // Find and update donation record
      try {
        // First retrieve user_id of the donation record to send notification
        const { data: donationRecord, error: findError } = await supabase
          .from('donations')
          .select('user_id, status')
          .eq('preference_id', preference_id)
          .single();

        if (findError || !donationRecord) {
          console.warn(`[MERCADO PAGO WEBHOOK] No donation record found matching preference_id: ${preference_id}`);
        } else {
          // Update donation status
          const { error: updateError } = await supabase
            .from('donations')
            .update({
              status: mappedStatus,
              payment_id: paymentId,
              updated_at: new Date().toISOString()
            })
            .eq('preference_id', preference_id);

          if (updateError) {
            console.error('[MERCADO PAGO WEBHOOK] Database update failed:', updateError);
          } else {
            console.log(`[MERCADO PAGO WEBHOOK] Database record updated successfully to status: ${mappedStatus}`);

            // If status transitioned to approved, trigger user system notification
            if (mappedStatus === 'approved' && donationRecord.status !== 'approved' && donationRecord.user_id) {
              const { error: notifyError } = await supabase
                .from('notifications')
                .insert({
                  user_id: donationRecord.user_id,
                  title: '¡Donación Aprobada! ❤️',
                  message: `Tu donación voluntaria de $${Number(transaction_amount).toFixed(2)} ${currency_id} ha sido recibida y confirmada. ¡Muchas gracias por tu apoyo a FinControl!`,
                  type: 'success',
                  read: false
                });

              if (notifyError) {
                console.error('[MERCADO PAGO WEBHOOK] Failed to write system notification:', notifyError);
              } else {
                console.log(`[MERCADO PAGO WEBHOOK] System notification generated for user: ${donationRecord.user_id}`);
              }
            }
          }
        }
      } catch (dbErr) {
        console.error('[MERCADO PAGO WEBHOOK] Database operation crash:', dbErr);
      }
    } else {
      console.log(`[MERCADO PAGO WEBHOOK - NO DB] Verified payment details processed. Preference: ${preference_id}, Mapped Status: ${mappedStatus}`);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('[MERCADO PAGO WEBHOOK] Exception error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Webhook internal crash' }, { status: 500 });
  }
}
