import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { referralCode } = await request.json();

    // Check if referral code exists and is active
    const { data: referralData, error: referralError } = await supabase
      .from('referral_codes')
      .select(`
        id,
        contractor_id,
        customer_id,
        status
      `)
      .eq('code', referralCode)
      .single();

    if (referralError || !referralData) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      );
    }

    if (referralData.status !== 'active') {
      return NextResponse.json(
        { error: 'Referral code has already been used or expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      contractorId: referralData.contractor_id,
      referrerId: referralData.customer_id
    });
  } catch (error) {
    console.error('Error verifying referral:', error);
    return NextResponse.json(
      { error: 'Failed to verify referral code' },
      { status: 500 }
    );
  }
}
