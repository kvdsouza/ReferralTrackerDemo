import { customAlphabet } from 'nanoid';
import { prisma } from './prisma';
import { sendSMS, sendEmail, generateReferralMessage } from './communications';

// Generate a referral code using numbers and uppercase letters
const generateCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

export async function createReferralCode(
  contractorId: string,
  referrerEmail: string,
  rewardType: 'CASH' | 'GIFT_CARD' | 'SERVICE_CREDIT' | 'POINTS',
  rewardAmount: number
) {
  try {
    const code = generateCode();
    
    const referralCode = await prisma.referralCode.create({
      data: {
        code,
        contractorId,
        referrer: referrerEmail,
        rewardType,
        rewardAmount,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      },
    });

    return referralCode;
  } catch (error) {
    console.error('Error creating referral code:', error);
    throw error;
  }
}

export async function verifyReferralCode(code: string) {
  try {
    const referralCode = await prisma.referralCode.findUnique({
      where: { code },
      include: { contractor: true },
    });

    if (!referralCode) {
      return { valid: false, message: 'Invalid referral code' };
    }

    if (referralCode.status === 'USED') {
      return { valid: false, message: 'Referral code has already been used' };
    }

    if (referralCode.status === 'EXPIRED' || 
        (referralCode.expiresAt && referralCode.expiresAt < new Date())) {
      return { valid: false, message: 'Referral code has expired' };
    }

    return { 
      valid: true, 
      contractorId: referralCode.contractorId,
      contractor: referralCode.contractor,
    };
  } catch (error) {
    console.error('Error verifying referral code:', error);
    throw error;
  }
}

export async function sendReferralCode(
  referralCode: string,
  contactInfo: { email?: string; phone?: string },
  videoUrl: string
) {
  const message = generateReferralMessage(referralCode, videoUrl);

  if (contactInfo.email) {
    await sendEmail(
      contactInfo.email,
      'Your Referral Code',
      message
    );
  }

  if (contactInfo.phone) {
    await sendSMS(contactInfo.phone, message);
  }
}
