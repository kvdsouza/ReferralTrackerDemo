import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

interface Referral {
  id: string;
  code: string;
  status: 'active' | 'used' | 'completed';
  created_at: string;
  reward_sent: boolean;
  reward_amount: number;
  customer: {
    name: string;
    email: string;
  };
  referred_customer?: {
    name: string;
    email: string;
  };
}

interface ReferralsDashboardProps {
  userType: 'contractor' | 'customer';
  userId: string;
}

export default function ReferralsDashboard({ userType, userId }: ReferralsDashboardProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    loadReferrals();
  }, [userType, userId]);

  async function loadReferrals() {
    try {
      setLoading(true);
      setError(null);

      const query = supabase
        .from('referrals')
        .select(`
          *,
          customer:customer_id (
            name,
            email
          ),
          referred_customer:referred_customer_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (userType === 'customer') {
        query.eq('customer_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReferrals(data || []);
    } catch (err) {
      console.error('Error loading referrals:', err);
      setError('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReward(referralId: string) {
    try {
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reward');
      }

      await loadReferrals();
    } catch (err) {
      console.error('Error sending reward:', err);
      setError('Failed to send reward');
    }
  }

  async function generateReferralCode() {
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: userId,
          rewardType: 'gift_card',
          rewardAmount: 50,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate referral code');
      }

      await loadReferrals();
    } catch (err) {
      console.error('Error generating referral code:', err);
      setError('Failed to generate referral code');
    }
  }

  if (loading) return <div>Loading referrals...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      {userType === 'customer' && (
        <div className="mb-6">
          <button
            onClick={generateReferralCode}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Generate New Referral Code
          </button>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {referrals.map((referral) => (
            <li key={referral.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-600">
                      Code: {referral.code}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Reward Amount: ${referral.reward_amount}
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex space-x-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${referral.status === 'active' ? 'bg-green-100 text-green-800' : 
                        referral.status === 'used' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'}`}
                    >
                      {referral.status}
                    </span>
                    {userType === 'contractor' && referral.status === 'completed' && !referral.reward_sent && (
                      <button
                        onClick={() => handleSendReward(referral.id)}
                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      >
                        Send Reward
                      </button>
                    )}
                    {referral.reward_sent && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Reward Sent
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <div className="mr-6">
                      <p className="text-sm font-medium text-gray-500">Customer</p>
                      <p className="text-sm text-gray-900">{referral.customer.name}</p>
                    </div>
                    {referral.referred_customer && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Referred Customer</p>
                        <p className="text-sm text-gray-900">{referral.referred_customer.name}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p className="text-sm text-gray-900">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
