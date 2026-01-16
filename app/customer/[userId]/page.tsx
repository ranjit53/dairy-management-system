'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MilkEntry, Payment } from '@/lib/utils';

export default function CustomerPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const [entriesRes, paymentsRes] = await Promise.all([
        fetch(`/api/milk?userId=${userId}`),
        fetch(`/api/payments?userId=${userId}`),
      ]);

      const entriesData = await entriesRes.json();
      const paymentsData = await paymentsRes.json();

      setEntries(entriesData.entries || []);
      setPayments(paymentsData.payments || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  // Convert AD date to Nepali (B.S.) - accurate conversion
  // Reference: Jan 16, 2026 = Magh 2, 2082 BS
  const convertToNepaliDate = (adDate: string): string => {
    const date = new Date(adDate + 'T12:00:00');
    const refAD = new Date('2026-01-16T12:00:00');
    const daysDiff = Math.floor((date.getTime() - refAD.getTime()) / (1000 * 60 * 60 * 24));
    
    const refBSYear = 2082;
    const refBSMonth = 10; // Magh
    const refBSDay = 2;
    
    // Nepali month lengths for 2082 BS
    const monthLengths2082 = [30, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30];
    
    let bsYear = refBSYear;
    let bsMonth = refBSMonth;
    let bsDay = refBSDay + daysDiff;
    
    // Adjust day and month forward
    while (bsDay > monthLengths2082[bsMonth - 1]) {
      bsDay -= monthLengths2082[bsMonth - 1];
      bsMonth += 1;
      if (bsMonth > 12) {
        bsMonth = 1;
        bsYear += 1;
      }
    }
    
    // Adjust day and month backward
    while (bsDay < 1) {
      bsMonth -= 1;
      if (bsMonth < 1) {
        bsMonth = 12;
        bsYear -= 1;
      }
      bsDay += monthLengths2082[bsMonth - 1];
    }
    
    if (bsDay < 1) bsDay = 1;
    if (bsDay > 32) bsDay = 32;
    if (bsMonth < 1) bsMonth = 1;
    if (bsMonth > 12) bsMonth = 12;
    
    return `${bsYear}-${bsMonth.toString().padStart(2, '0')}-${bsDay.toString().padStart(2, '0')}`;
  };

  // Get month name from date
  const getMonthName = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Get short month name (Nov, Dec, etc.)
  const getShortMonthName = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  // Get month key (YYYY-MM) from date
  const getMonthKey = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  // Get last 3 months
  const getLast3Months = (): string[] => {
    const months: string[] = [];
    const today = new Date();
    for (let i = 2; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`);
    }
    return months;
  };

  // Group entries and payments by month
  const monthlyData = getLast3Months().map((monthKey, index) => {
    const monthEntries = entries.filter(e => getMonthKey(e.date) === monthKey);
    const monthPayments = payments.filter(p => getMonthKey(p.date) === monthKey);
    
    const totalAmount = monthEntries.reduce((sum, e) => sum + e.total, 0);
    const paymentAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const duesAmount = totalAmount - paymentAmount;

    const dateForMonth = monthEntries.length > 0 ? monthEntries[0].date : 
                        monthPayments.length > 0 ? monthPayments[0].date : 
                        monthKey + '-01';

    return {
      monthKey,
      monthName: getMonthName(dateForMonth),
      shortMonthName: getShortMonthName(dateForMonth),
      entries: monthEntries,
      payments: monthPayments,
      totalAmount,
      paymentAmount,
      duesAmount,
      isCurrentMonth: index === 2, // Last month in array is current month
    };
  });

  // Initialize: expand current month by default
  useEffect(() => {
    if (entries.length > 0 || payments.length > 0) {
      const currentMonthKey = getLast3Months()[2]; // Current month is the last one
      if (expandedMonths.size === 0) {
        setExpandedMonths(new Set([currentMonthKey]));
      }
    }
  }, [entries.length, payments.length]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
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

  // Calculate overall totals
  const overallTotal = entries.reduce((sum, e) => sum + e.total, 0);
  const overallPayment = payments.reduce((sum, p) => sum + p.amount, 0);
  const overallDues = overallTotal - overallPayment;

  return (
    <div className="space-y-8">
      <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Milk Entries</h2>
            <p className="text-gray-600 mt-1">View your milk collection history</p>
          </div>
        </div>
        
        {/* Overall Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-100 text-sm font-medium mb-1">Total Amount</div>
                <div className="text-3xl font-bold text-white">RS {overallTotal.toFixed(2)}</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="p-5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-sm font-medium mb-1">Payment Amount</div>
                <div className="text-3xl font-bold text-white">RS {overallPayment.toFixed(2)}</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="p-5 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-100 text-sm font-medium mb-1">Dues Amount</div>
                <div className="text-3xl font-bold text-white">RS {overallDues.toFixed(2)}</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Data */}
        {monthlyData.map((monthData) => {
          const isExpanded = expandedMonths.has(monthData.monthKey);
          const isCurrentMonth = monthData.isCurrentMonth;

          // Current month: show full data by default
          if (isCurrentMonth) {
            return (
              <div key={monthData.monthKey} className="mb-8 border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
                {/* Month Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 border-b-2 border-blue-400">
                  <h3 className="text-xl font-bold text-white mb-3">{monthData.monthName}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
                      <span className="text-blue-100 text-xs block mb-1">Total</span>
                      <span className="text-lg font-bold text-white">RS {monthData.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
                      <span className="text-blue-100 text-xs block mb-1">Payment</span>
                      <span className="text-lg font-bold text-white">RS {monthData.paymentAmount.toFixed(2)}</span>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
                      <span className="text-blue-100 text-xs block mb-1">Dues</span>
                      <span className="text-lg font-bold text-white">RS {monthData.duesAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Month Entries */}
                {monthData.entries.length === 0 ? (
                  <div className="p-8 text-center bg-white">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-500 font-medium">No entries for this month.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                            Date (B.S.)
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                            Time
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                            Liters
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                            Rate (per liter)
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {monthData.entries.map((entry, index) => (
                          <tr key={entry.entryId} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                              {entry.nepaliDate || convertToNepaliDate(entry.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                entry.time === 'morning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {entry.time || 'morning'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                              {entry.liters} L
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              RS {entry.rate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              RS {entry.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          }

          // Previous months: show as clickable button, expand when clicked
          return (
            <div key={monthData.monthKey} className="mb-4">
              {!isExpanded ? (
                <button
                  onClick={() => toggleMonth(monthData.monthKey)}
                  className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-gray-200 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-white rounded-lg shadow-sm">
                      <span className="text-xl font-bold text-gray-800">{monthData.shortMonthName}</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-bold text-blue-600">RS {monthData.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Payment:</span>
                        <span className="font-bold text-green-600">RS {monthData.paymentAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Dues:</span>
                        <span className="font-bold text-red-600">RS {monthData.duesAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <svg
                    className="w-6 h-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
                  {/* Month Header with Collapse Button */}
                  <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-6 py-4 border-b-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">{monthData.monthName}</h3>
                      <button
                        onClick={() => toggleMonth(monthData.monthKey)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <span className="text-xs text-gray-600 block">Total</span>
                        <span className="text-sm font-bold text-blue-600">RS {monthData.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg">
                        <span className="text-xs text-gray-600 block">Payment</span>
                        <span className="text-sm font-bold text-green-600">RS {monthData.paymentAmount.toFixed(2)}</span>
                      </div>
                      <div className="p-2 bg-red-50 rounded-lg">
                        <span className="text-xs text-gray-600 block">Dues</span>
                        <span className="text-sm font-bold text-red-600">RS {monthData.duesAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Month Entries */}
                  {monthData.entries.length === 0 ? (
                    <div className="p-8 text-center bg-white">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 font-medium">No entries for this month.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-white">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                              Date (B.S.)
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                              Time
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                              Liters
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                              Rate (per liter)
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {monthData.entries.map((entry, index) => (
                            <tr key={entry.entryId} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                                {entry.nepaliDate || convertToNepaliDate(entry.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  entry.time === 'morning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {entry.time || 'morning'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                                {entry.liters} L
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                RS {entry.rate}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                RS {entry.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {entries.length === 0 && payments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No milk entries or payments found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
