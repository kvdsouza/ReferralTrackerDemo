import * as tremendousSDK from 'tremendous';

const client = new tremendousSDK.default({
  apiKey: process.env.TREMENDOUS_API_KEY!
});

export type RewardType = 'gift_card' | 'direct_payment' | 'service_credit';

interface RewardOptions {
  recipientEmail: string;
  recipientName: string;
  amount: number;
  type: RewardType;
  currency?: string;
}

export async function sendReward({
  recipientEmail,
  recipientName,
  amount,
  type,
  currency = 'USD'
}: RewardOptions) {
  try {
    // Create a reward in Tremendous
    const reward = await client.rewards.create({
      payment: {
        amount,
        currency
      },
      recipient: {
        name: recipientName,
        email: recipientEmail
      },
      delivery: {
        method: 'EMAIL'
      },
      products: type === 'gift_card' ? ['GIFTCARD'] : ['PAYMENT']
    });

    return {
      success: true,
      transactionId: reward.id,
      status: reward.status,
      error: null
    };
  } catch (error) {
    console.error('Error sending reward:', error);
    return {
      success: false,
      transactionId: null,
      status: null,
      error: error instanceof Error ? error.message : 'Failed to send reward'
    };
  }
}
