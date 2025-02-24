import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendReferralInvite } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId, rewardType, rewardAmount, videoUrl } = await request.json();

    // Generate unique referral code
    const code = nanoid(8);

    // Create referral code in database
    const { data: referralCode, error: dbError } = await supabase
      .from('referral_codes')
      .insert({
        code,
        contractor_id: user.id,
        customer_id: customerId,
        reward_type: rewardType,
        reward_amount: rewardAmount,
        educational_video_url: videoUrl,
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('phone_number, email')
      .eq('id', customerId)
      .single();

    if (customerError) {
      throw customerError;
    }

    // Send notifications
    await sendReferralInvite(
      customer.phone_number,
      customer.email,
      code,
      videoUrl
    );

    return NextResponse.json({ success: true, referralCode });
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json(
      { error: 'Failed to create referral' },
      { status: 500 }
    );
  }
}
