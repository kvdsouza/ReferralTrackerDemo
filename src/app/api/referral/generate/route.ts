import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createReferralCode, sendReferralCode } from '@/lib/referral';
import { z } from 'zod';
import { cookies } from 'next/headers';

const GenerateReferralSchema = z.object({
  referrerEmail: z.string().email(),
  referrerPhone: z.string().optional(),
  rewardType: z.enum(['CASH', 'GIFT_CARD', 'SERVICE_CREDIT', 'POINTS']),
  rewardAmount: z.number().positive(),
  videoUrl: z.string().url(),
});

export async function POST(request: Request) {
  try {
    // Verify authentication
    const token = cookies().get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const verified = verifyToken(token);
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = GenerateReferralSchema.parse(body);

    // Create referral code
    const referralCode = await createReferralCode(
      verified.userId,
      validatedData.referrerEmail,
      validatedData.rewardType,
      validatedData.rewardAmount
    );

    // Send referral code to referrer
    await sendReferralCode(
      referralCode.code,
      {
        email: validatedData.referrerEmail,
        phone: validatedData.referrerPhone,
      },
      validatedData.videoUrl
    );

    return NextResponse.json({
      message: 'Referral code generated and sent successfully',
      referralCode: {
        code: referralCode.code,
        expiresAt: referralCode.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Referral generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
