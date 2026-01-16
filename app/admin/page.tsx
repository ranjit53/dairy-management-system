'use client';

import { useEffect, useState } from 'react';
import { MilkEntry, Payment, User } from '@/lib/utils';

export default function DashboardPage() {
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesRes, paymentsRes, usersRes] = await Promise.all([
        fetch('/api/milk'),
        fetch('/api/payments'),
        fetch('/api/users'),
      ]);

      const entriesData = await entriesRes.json();
      const paymentsData = await paymentsRes.json();
      const usersData = await usersRes.json();

      setEntries(entriesData.entries || []);
      setPayments(paymentsData.payments || []);
      setUsers(usersData.users || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalCustomers = users.filter(u => u.role === 'customer').length;
  const totalMilkLiters = entries.reduce((sum, entry) => sum + entry.liters, 0);
  const totalPayment = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalBill = entries.reduce((sum, entry) => sum + entry.total, 0);
  const totalDues = totalBill - totalPayment;

  // Prepare data for graph (last 7 days) - Morning and Evening
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const dailyData = last7Days.map(date => {
    const dayEntries = entries.filter(e => e.date === date);
    const morningEntries = dayEntries.filter(e => e.time === 'morning');
    const eveningEntries = dayEntries.filter(e => e.time === 'evening');
    
    return {
      date,
      morning: {
        liters: morningEntries.reduce((sum, e) => sum + e.liters, 0),
        amount: morningEntries.reduce((sum, e) => sum + e.total, 0),
      },
      evening: {
        liters: eveningEntries.reduce((sum, e) => sum + e.liters, 0),
        amount: eveningEntries.reduce((sum, e) => sum + e.total, 0),
      },
      total: {
        liters: dayEntries.reduce((sum, e) => sum + e.liters, 0),
        amount: dayEntries.reduce((sum, e) => sum + e.total, 0),
      },
    };
  });

  const maxLiters = Math.max(...dailyData.map(d => Math.max(d.morning.liters, d.evening.liters)), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Overview of your dairy operations</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 overflow-hidden shadow-lg rounded-xl transform hover:scale-105 transition-all duration-200">
          <div className="p-6">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Total Customers</p>
              <p className="text-3xl font-bold text-white">{totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden shadow-lg rounded-xl transform hover:scale-105 transition-all duration-200">
          <div className="p-6">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Milk (Liters)</p>
              <p className="text-3xl font-bold text-white">{totalMilkLiters.toFixed(2)} L</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 overflow-hidden shadow-lg rounded-xl transform hover:scale-105 transition-all duration-200">
          <div className="p-6">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Total Payment</p>
              <p className="text-3xl font-bold text-white">RS {totalPayment.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 overflow-hidden shadow-lg rounded-xl transform hover:scale-105 transition-all duration-200">
          <div className="p-6">
            <div>
              <p className="text-yellow-100 text-sm font-medium mb-1">Total Bill</p>
              <p className="text-3xl font-bold text-white">RS {totalBill.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 overflow-hidden shadow-lg rounded-xl transform hover:scale-105 transition-all duration-200">
          <div className="p-6">
            <div>
              <p className="text-red-100 text-sm font-medium mb-1">Total Dues</p>
              <p className="text-3xl font-bold text-white">RS {totalDues.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graph - Horizontal Bar Diagram */}
      <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Last 7 Days Milk Collection</h3>
            <p className="text-sm text-gray-600 mt-1">Morning & Evening breakdown</p>
          </div>
        </div>
        <div className="space-y-6">
          {dailyData.map((day, index) => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const morningPercentage = (day.morning.liters / maxLiters) * 100;
            const eveningPercentage = (day.evening.liters / maxLiters) * 100;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="w-full sm:w-24 text-sm text-gray-600">
                    <div className="font-medium">{dayName}</div>
                    <div className="text-xs text-gray-500">{day.date}</div>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    {/* Morning Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                      <div className="w-20 text-xs text-gray-600 font-medium">Morning:</div>
                      <div className="flex-1 w-full sm:w-auto bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-yellow-400 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${morningPercentage}%` }}
                        >
                          {day.morning.liters > 0 && (
                            <span className="text-gray-800 text-xs font-medium px-1">{day.morning.liters.toFixed(1)}L</span>
                          )}
                        </div>
                      </div>
                      <div className="w-20 text-right text-xs font-medium text-gray-700">
                        {day.morning.liters.toFixed(2)} L
                      </div>
                    </div>
                    {/* Evening Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                      <div className="w-20 text-xs text-gray-600 font-medium">Evening:</div>
                      <div className="flex-1 w-full sm:w-auto bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${eveningPercentage}%` }}
                        >
                          {day.evening.liters > 0 && (
                            <span className="text-white text-xs font-medium px-1">{day.evening.liters.toFixed(1)}L</span>
                          )}
                        </div>
                      </div>
                      <div className="w-20 text-right text-xs font-medium text-gray-700">
                        {day.evening.liters.toFixed(2)} L
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex gap-6 justify-center pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Morning</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Evening</span>
          </div>
        </div>
      </div>
    </div>
  );
}
