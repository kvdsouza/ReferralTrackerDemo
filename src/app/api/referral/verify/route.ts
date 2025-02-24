import { NextResponse } from 'next/server';
import { verifyReferralCode } from '@/lib/referral';
import { z } from 'zod';

const VerifyReferralSchema = z.object({
  code: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = VerifyReferralSchema.parse(body);

    const result = await verifyReferralCode(code);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Referral code verified successfully',
      contractor: {
        id: result.contractor.id,
        name: result.contractor.name,
        companyName: result.contractor.companyName,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Referral verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
