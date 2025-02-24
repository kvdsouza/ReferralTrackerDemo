import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendReward as sendTremendousReward } from '@/lib/tremendous';

async function sendReward(recipientEmail: string, amount: number, rewardType: string) {
  // This is a placeholder for the actual reward distribution logic
  // In a real implementation, you would integrate with Tremendous API here
  
  try {
    // Example implementation:
    // const tremendous = new Tremendous(process.env.TREMENDOUS_API_KEY);
    // const reward = await tremendous.rewards.create({
    //   payment: {
    //     amount,
    //     currency: "USD"
    //   },
    //   recipient: {
    //     email: recipientEmail
    //   },
    //   delivery: {
    //     method: "EMAIL"
    //   }
    // });
    
    // For now, we'll simulate a successful reward creation
    return {
      success: true,
      transactionId: `DEMO-${Date.now()}`
    };
  } catch (error) {
    console.error('Error sending reward:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { referralId } = await request.json();

    // Get referral details
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select(`
        id,
        referral_code_id,
        status,
        reward_status
      `)
      .eq('id', referralId)
      .single();

    if (referralError || !referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }

    if (referral.status !== 'completed') {
      return NextResponse.json(
        { error: 'Referral is not completed yet' },
        { status: 400 }
      );
    }

    if (referral.reward_status === 'sent') {
      return NextResponse.json(
        { error: 'Reward has already been sent' },
        { status: 400 }
      );
    }

    // Get referral code details
    const { data: referralCode, error: codeError } = await supabase
      .from('referral_codes')
      .select(`
        id,
        customer_id,
        reward_type,
        reward_amount
      `)
      .eq('id', referral.referral_code_id)
      .single();

    if (codeError || !referralCode) {
      return NextResponse.json(
        { error: 'Referral code not found' },
        { status: 404 }
      );
    }

    // Get referrer details
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', referralCode.customer_id)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { error: 'Referrer not found' },
        { status: 404 }
      );
    }

    // Send reward through Tremendous
    const { success, transactionId, error: rewardError } = await sendTremendousReward({
      recipientEmail: referrer.email,
      recipientName: referrer.name,
      amount: referralCode.reward_amount,
      type: referralCode.reward_type as 'gift_card' | 'direct_payment' | 'service_credit'
    });

    if (!success) {
      throw new Error(rewardError || 'Failed to send reward');
    }

    // Update referral status
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        reward_status: 'sent',
        reward_transaction_id: transactionId
      })
      .eq('id', referralId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, transactionId });
  } catch (error) {
    console.error('Error processing reward:', error);
    return NextResponse.json(
      { error: 'Failed to process reward' },
      { status: 500 }
    );
  }
}
