import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendSMS, sendEmail } from '@/lib/notifications';

async function generateReferralContent(customerName: string, contractorName: string, referralCode: string) {
  const videoUrl = 'https://example.com/educational-video'; // Replace with actual video URL
  
  return {
    sms: `Hi ${customerName}! Thanks for choosing ${contractorName}. Share your great experience and earn rewards! Your referral code is: ${referralCode}. Watch our quick guide: ${videoUrl}`,
    email: {
      subject: `Share Your Experience with ${contractorName} and Earn Rewards`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank You for Choosing ${contractorName}!</h2>
          <p>We hope you're happy with our service. As a valued customer, we'd love for you to share your experience with friends and family.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 18px; font-weight: bold;">Your Referral Code:</p>
            <p style="font-size: 24px; color: #2563eb; font-weight: bold;">${referralCode}</p>
          </div>
          <p>Share this code with anyone who might need our services. When they use your code:</p>
          <ul>
            <li>They'll get priority scheduling</li>
            <li>You'll earn rewards for successful referrals</li>
          </ul>
          <p>Watch our quick video guide to learn more:</p>
          <a href="${videoUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Watch Video Guide
          </a>
        </div>
      `
    }
  };
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { customerId, contractorId, referralCode } = await request.json();

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('name, email, phone_number')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get contractor details
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select('name')
      .eq('id', contractorId)
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Generate content
    const content = await generateReferralContent(
      customer.name,
      contractor.name,
      referralCode
    );

    // Send communications
    const [smsResult, emailResult] = await Promise.all([
      sendSMS(customer.phone_number, content.sms),
      sendEmail(customer.email, content.email.subject, content.email.html)
    ]);

    if (!smsResult.success || !emailResult.success) {
      throw new Error('Failed to send communications');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending communications:', error);
    return NextResponse.json(
      { error: 'Failed to send communications' },
      { status: 500 }
    );
  }
}
