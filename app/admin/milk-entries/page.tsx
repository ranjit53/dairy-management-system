'use client';

import { useEffect, useState } from 'react';
import { MilkEntry, User } from '@/lib/utils';

export default function MilkEntriesPage() {
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewingMember, setViewingMember] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<MilkEntry | null>(null);

  // Excel-like form states
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [nepaliDate, setNepaliDate] = useState('');
  const [entryTime, setEntryTime] = useState<'morning' | 'evening'>('morning');
  const [milkEntries, setMilkEntries] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesRes, usersRes] = await Promise.all([
        fetch('/api/milk'),
        fetch('/api/users'),
      ]);

      const entriesData = await entriesRes.json();
      const usersData = await usersRes.json();

      setEntries(entriesData.entries || []);
      setUsers(usersData.users || []);
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

  useEffect(() => {
    if (entryDate) {
      setNepaliDate(convertToNepaliDate(entryDate));
    }
  }, [entryDate]);

  const handleNepaliDateChange = (bsDate: string) => {
    setNepaliDate(bsDate);
    // Convert B.S. to A.D. (reverse conversion using reference date)
    const parts = bsDate.split('-');
    if (parts.length === 3) {
      const bsYear = parseInt(parts[0]);
      const bsMonth = parseInt(parts[1]);
      const bsDay = parseInt(parts[2]);
      
      // Reference: Jan 16, 2026 = Magh 2, 2082 BS
      const refAD = new Date('2026-01-16T12:00:00');
      const refBSYear = 2082;
      const refBSMonth = 10; // Magh
      const refBSDay = 2;
      
      // Nepali month lengths for 2082 BS
      const monthLengths2082 = [30, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30];
      
      // Calculate days difference from reference BS date
      let daysDiff = 0;
      
      // Calculate days from reference BS date to target BS date
      if (bsYear === refBSYear) {
        // Same year
        if (bsMonth === refBSMonth) {
          daysDiff = bsDay - refBSDay;
        } else if (bsMonth > refBSMonth) {
          // Forward in same year
          daysDiff = refBSDay; // Days remaining in ref month
          for (let m = refBSMonth; m < bsMonth - 1; m++) {
            daysDiff += monthLengths2082[m];
          }
          daysDiff += bsDay - monthLengths2082[refBSMonth - 1];
        } else {
          // Backward in same year
          daysDiff = -refBSDay; // Days back in ref month
          for (let m = bsMonth - 1; m < refBSMonth - 1; m++) {
            daysDiff -= monthLengths2082[m];
          }
          daysDiff -= (monthLengths2082[bsMonth - 1] - bsDay);
        }
      } else {
        // Different year - simplified calculation
        const yearDiff = bsYear - refBSYear;
        daysDiff = yearDiff * 365; // Approximate
        // Add/subtract month and day differences
        if (bsYear > refBSYear) {
          daysDiff += (bsMonth - refBSMonth) * 30 + (bsDay - refBSDay);
        } else {
          daysDiff += (bsMonth - refBSMonth) * 30 + (bsDay - refBSDay);
        }
      }
      
      // Calculate AD date
      const adDate = new Date(refAD);
      adDate.setDate(adDate.getDate() + daysDiff);
      
      const adYear = adDate.getFullYear();
      const adMonth = adDate.getMonth() + 1;
      const adDay = adDate.getDate();
      
      const adDateStr = `${adYear}-${adMonth.toString().padStart(2, '0')}-${adDay.toString().padStart(2, '0')}`;
      setEntryDate(adDateStr);
    }
  };

  const handleMilkEntryChange = (userId: string, value: string) => {
    setMilkEntries(prev => ({
      ...prev,
      [userId]: value,
    }));
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const entriesToSubmit = Object.entries(milkEntries)
      .filter(([_, liters]) => liters && parseFloat(liters) > 0)
      .map(([userId, liters]) => ({
        userId,
        date: entryDate,
        liters: parseFloat(liters),
        rate: null, // Will use customer rate
        time: entryTime,
      }));

    if (entriesToSubmit.length === 0) {
      setMessage({ type: 'error', text: 'Please enter milk liters for at least one customer' });
      return;
    }

    try {
      // Submit all entries
      const promises = entriesToSubmit.map(entry =>
        fetch('/api/milk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        })
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => !r.ok);

      if (errors.length > 0) {
        setMessage({ type: 'error', text: 'Some entries failed to save. Please try again.' });
        return;
      }

      setMessage({ type: 'success', text: `${entriesToSubmit.length} milk entries added successfully!` });
      setMilkEntries({});
      setEntryDate(new Date().toISOString().split('T')[0]);
      setEntryTime('morning');
      setShowAddEntry(false);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const response = await fetch(`/api/milk/${entryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to delete entry' });
        return;
      }

      setMessage({ type: 'success', text: 'Entry deleted successfully!' });
      setViewingMember(null);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    setMessage(null);

    try {
      const response = await fetch(`/api/milk/${editingEntry.entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editingEntry.date,
          liters: editingEntry.liters,
          rate: editingEntry.rate,
          time: editingEntry.time,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update entry' });
        return;
      }

      setMessage({ type: 'success', text: 'Entry updated successfully!' });
      setEditingEntry(null);
      setViewingMember(null);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  // Group entries by member (userId)
  const groupedEntries = entries.reduce((acc, entry) => {
    if (!acc[entry.userId]) {
      acc[entry.userId] = [];
    }
    acc[entry.userId].push(entry);
    return acc;
  }, {} as Record<string, MilkEntry[]>);

  // Calculate merged totals for each member
  const mergedEntries = Object.entries(groupedEntries).map(([userId, memberEntries]) => {
    const customer = users.find(u => u.userId === userId);
    const totalLiters = memberEntries.reduce((sum, e) => sum + e.liters, 0);
    const totalAmount = memberEntries.reduce((sum, e) => sum + e.total, 0);
    const avgRate = totalAmount / totalLiters || 0;

    return {
      userId,
      memberName: customer ? customer.name : userId,
      entries: memberEntries,
      totalLiters,
      totalAmount,
      avgRate,
    };
  });

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

  const customers = users.filter(u => u.role === 'customer');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Milk Entries</h2>
          <p className="text-gray-600 mt-1">Manage milk collection entries</p>
        </div>
        <button
          onClick={() => {
            setShowAddEntry(!showAddEntry);
            if (!showAddEntry) {
              setMilkEntries({});
              setEntryDate(new Date().toISOString().split('T')[0]);
              setEntryTime('morning');
            }
          }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showAddEntry ? 'Cancel' : 'Add Entry'}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 border-l-4 flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : 'bg-red-50 border-red-400 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {showAddEntry && (
        <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
          <form onSubmit={handleSubmitAll}>
            {/* Top Header - Excel-like */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
              {/* Top Left - Shift Toggle */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Shift:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryTime('morning')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      entryTime === 'morning'
                        ? 'bg-yellow-400 text-gray-900 shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Morning
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryTime('evening')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      entryTime === 'evening'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Evening
                  </button>
                </div>
              </div>

              {/* Top Right - Date (Both B.S. and A.D. editable) */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Date (B.S.):</label>
                <input
                  type="text"
                  value={nepaliDate}
                  onChange={(e) => handleNepaliDateChange(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <span className="text-gray-400">|</span>
                <label className="text-sm font-medium text-gray-700">Date (A.D.):</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => {
                    setEntryDate(e.target.value);
                    if (e.target.value) {
                      setNepaliDate(convertToNepaliDate(e.target.value));
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Excel-like Table Form */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-inner">
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                <div className="grid grid-cols-2 gap-0">
                  <div className="px-5 py-4 font-bold text-sm text-gray-800 border-r-2 border-gray-300 bg-gray-100">
                    Member Name
                  </div>
                  <div className="px-5 py-4 font-bold text-sm text-gray-800 bg-gray-100">
                    Milk (Liters)
                  </div>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto bg-white">
                {customers.map((customer, index) => (
                  <div
                    key={customer.userId}
                    className={`grid grid-cols-2 gap-0 border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    {/* Left Side - Member Name */}
                    <div className="px-5 py-3.5 border-r border-gray-200">
                      <div className="text-sm font-semibold text-gray-900">{customer.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{customer.userId}</div>
                    </div>
                    {/* Right Side - Milk Input */}
                    <div className="px-5 py-3.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={milkEntries[customer.userId] || ''}
                        onChange={(e) => handleMilkEntryChange(customer.userId, e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3 text-sm font-semibold text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save All Entries
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Merged Entries Table */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  Member Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  Total Liters
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  Avg Rate
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  Total Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  Entries Count
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {mergedEntries.map((merged, index) => (
                <tr key={merged.userId} className={`hover:bg-yellow-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {merged.memberName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {merged.totalLiters.toFixed(2)} L
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                    RS {merged.avgRate.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    RS {merged.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                      {merged.entries.length}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setViewingMember(merged.userId)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-all"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {viewingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {mergedEntries.find(m => m.userId === viewingMember)?.memberName} - Entry Details
              </h3>
              <button
                onClick={() => {
                  setViewingMember(null);
                  setEditingEntry(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {editingEntry ? (
                <form onSubmit={handleEditEntry} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date (A.D.)</label>
                      <input
                        type="date"
                        value={editingEntry.date}
                        onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time</label>
                      <select
                        value={editingEntry.time || 'morning'}
                        onChange={(e) => setEditingEntry({ ...editingEntry, time: e.target.value as 'morning' | 'evening' })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      >
                        <option value="morning">Morning</option>
                        <option value="evening">Evening</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Liters</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingEntry.liters}
                        onChange={(e) => {
                          const liters = parseFloat(e.target.value);
                          const total = liters * editingEntry.rate;
                          setEditingEntry({ ...editingEntry, liters, total });
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingEntry.rate}
                        onChange={(e) => {
                          const rate = parseFloat(e.target.value);
                          const total = editingEntry.liters * rate;
                          setEditingEntry({ ...editingEntry, rate, total });
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingEntry(null)}
                      className="rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Date (B.S.)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Liters
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Rate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mergedEntries
                        .find(m => m.userId === viewingMember)
                        ?.entries.map((entry) => (
                          <tr key={entry.entryId}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {entry.nepaliDate || convertToNepaliDate(entry.date)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 py-1 rounded text-xs ${
                                entry.time === 'morning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {entry.time || 'morning'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {entry.liters}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              RS {entry.rate}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                              RS {entry.total.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingEntry(entry)}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                  title="Edit"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(entry.entryId)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                  title="Delete"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
