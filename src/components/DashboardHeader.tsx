import { useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

interface DashboardHeaderProps {
  user: User;
  userType: 'contractor' | 'customer';
  isContractor: boolean;
  onModeSwitch: (mode: 'contractor' | 'customer') => void;
  onLogout: () => void;
}

export default function DashboardHeader({
  user,
  userType,
  isContractor,
  onModeSwitch,
  onLogout
}: DashboardHeaderProps) {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800">
                {userType === 'contractor' ? 'Contractor Dashboard' : 'Customer Dashboard'}
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard/projects"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Projects
              </Link>
              <Link
                href="/dashboard/referrals"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Referrals
              </Link>
              {userType === 'contractor' && (
                <Link
                  href="/dashboard/customers"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Customers
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isContractor && (
              <select
                value={userType}
                onChange={(e) => onModeSwitch(e.target.value as 'contractor' | 'customer')}
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value="contractor">Contractor Mode</option>
                <option value="customer">Customer Mode</option>
              </select>
            )}
            <button
              onClick={onLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
