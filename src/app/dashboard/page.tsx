'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import ProjectsDashboard from '@/components/ProjectsDashboard';
import ReferralsDashboard from '@/components/ReferralsDashboard';
import { Database } from '@/lib/database.types';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<'contractor' | 'customer'>('customer');
  const [isContractor, setIsContractor] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'referrals'>('projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session) {
        router.push('/login');
        return;
      }

      // Get user details including their type
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;

      setUser(session.user);
      setIsContractor(userData.user_type === 'contractor');
      setUserType(userData.user_type);
    } catch (err) {
      console.error('Error checking user:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (err) {
      console.error('Error logging out:', err);
      setError('Failed to log out');
    }
  }

  function handleModeSwitch(mode: 'contractor' | 'customer') {
    setUserType(mode);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader
        user={user}
        userType={userType}
        isContractor={isContractor}
        onModeSwitch={handleModeSwitch}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'projects'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'referrals'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Referrals
            </button>
          </nav>
        </div>

        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'projects' ? (
            <ProjectsDashboard userType={userType} userId={user.id} />
          ) : (
            <ReferralsDashboard userType={userType} userId={user.id} />
          )}
        </div>
      </div>
    </div>
  );
}
