import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/infrastructure/security/AuthHelper';
import { supabase, hasSupabaseKeys } from '@/infrastructure/database/supabaseClient';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    const body = await req.json();
    const amount = Number(body.amount);

    // Validate donation amount in backend (must be >= 1.00 USD)
    if (isNaN(amount) || amount < 1.00) {
      return NextResponse.json(
        { success: false, error: 'El monto mínimo de donación es 1 USD / Minimum donation amount is 1 USD' }, 
        { status: 400 }
      );
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Mercado Pago Integration: MERCADOPAGO_ACCESS_TOKEN is missing');
      return NextResponse.json(
        { success: false, error: 'Mercado Pago no está configurado en el servidor / Mercado Pago is not configured on the server' }, 
        { status: 500 }
      );
    }

    const currency = process.env.NEXT_PUBLIC_MERCADOPAGO_CURRENCY || 'USD';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const isHttps = baseUrl.startsWith('https://');

    let finalAmount = amount;
    if (currency === 'COP') {
      const exchangeRate = Number(process.env.COP_EXCHANGE_RATE) || 4000;
      finalAmount = Math.round(amount * exchangeRate);
    }

    // Create Preference using raw Mercado Pago API
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            title: 'Donación FinControl',
            unit_price: Number(finalAmount.toFixed(2)),
            currency_id: currency,
            quantity: 1
          }
        ],
        external_reference: JSON.stringify({ userId: user?.userId || null }),
        back_urls: {
          success: `${baseUrl}/donacion/exito`,
          pending: `${baseUrl}/donacion/pendiente`,
          failure: `${baseUrl}/donacion/error`
        },
        ...(isHttps ? { auto_return: 'approved' } : {})
      })
    });

    const data = await response.json();
    
    if (data.init_point) {
      // Record pending donation in database
      if (hasSupabaseKeys) {
        try {
          const { error } = await supabase.from('donations').insert({
            user_id: user?.userId || null,
            amount: Number(finalAmount.toFixed(2)),
            currency,
            status: 'pending',
            preference_id: data.id
          });
          if (error) {
            console.error('Supabase write error when inserting pending donation:', error);
          } else {
            console.log(`[DONATION INITIATED] Preference ID: ${data.id} | Amount: ${finalAmount} ${currency} (Original: ${amount} USD) | User: ${user?.userId || 'Anonymous'}`);
          }
        } catch (dbErr) {
          console.error('Supabase DB connection failed:', dbErr);
        }
      } else {
        console.log(`[DONATION INITIATED - NO DB] Preference ID: ${data.id} | Amount: ${finalAmount} ${currency} (Original: ${amount} USD) | User: ${user?.userId || 'Anonymous'}`);
      }

      return NextResponse.json({ success: true, url: data.init_point });
    } else {
      console.error('Mercado Pago API preference creation failed:', data);
      return NextResponse.json(
        { 
          success: false, 
          error: data.message || 'Error al generar el checkout de Mercado Pago / Error creating checkout preference' 
        }, 
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in POST /api/donaciones:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
