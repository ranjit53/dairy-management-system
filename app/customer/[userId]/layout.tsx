'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('user');
    
    if (!isAuthenticated || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Verify user is accessing their own page
    if (parsedUser.userId !== userId || parsedUser.role !== 'customer') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
  }, [router, userId]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    router.push('/login');
  };

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">Dairy Management System</h1>
              <span className="hidden sm:inline ml-4 text-sm text-gray-500">Customer Dashboard</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-0">
              <span className="hidden sm:inline text-sm text-gray-700 truncate max-w-[120px] sm:max-w-none">Welcome, {user.name}</span>
              <span className="sm:hidden text-xs text-gray-700 truncate max-w-[80px]">{user.name}</span>
              <button
                onClick={handleLogout}
                className="rounded-md bg-red-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
