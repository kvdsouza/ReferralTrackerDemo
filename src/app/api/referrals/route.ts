import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendReferralEmail } from '@/lib/email';
import type { Database } from '@/lib/database.types';

export async function POST(request: Request) {
  try {
    const { customerName, customerEmail, customerPhone, projectDescription } = await request.json();
    
    // Get the current user
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Create the referral
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert([
        {
          referrer_id: user.id,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          project_description: projectDescription,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (referralError) {
      throw referralError;
    }

    // Send email notification
    await sendReferralEmail({
      customerEmail,
      customerName,
      referrerName: user.user_metadata.name || 'Someone',
      projectDescription
    });

    return NextResponse.json({ 
      message: 'Referral created successfully',
      referral 
    });
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json(
      { error: 'Failed to create referral' },
      { status: 500 }
    );
  }
}
