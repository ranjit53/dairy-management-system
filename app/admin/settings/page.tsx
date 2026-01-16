'use client';

import { useEffect, useState } from 'react';
import { User, CustomerRate } from '@/lib/utils';

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [customerRates, setCustomerRates] = useState<CustomerRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRateForm, setShowRateForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Rate form states
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [rate, setRate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, ratesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/customer-rates'),
      ]);

      const usersData = await usersRes.json();
      const ratesData = await ratesRes.json();

      setUsers(usersData.users || []);
      setCustomerRates(ratesData.rates || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSetRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedCustomer || !rate) {
      setMessage({ type: 'error', text: 'Please select customer and enter rate' });
      return;
    }

    try {
      const response = await fetch('/api/customer-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedCustomer,
          rate: parseFloat(rate),
          effectiveDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to set rate' });
        return;
      }

      setMessage({ type: 'success', text: 'Customer rate set successfully!' });
      setSelectedCustomer('');
      setRate('');
      setEffectiveDate(new Date().toISOString().split('T')[0]);
      setShowRateForm(false);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Backup failed' });
        return;
      }

      setMessage({ type: 'success', text: 'Backup created successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleRestore = async () => {
    if (!confirm('Are you sure you want to restore from backup? This will overwrite current data.')) return;

    try {
      const response = await fetch('/api/restore', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Restore failed' });
        return;
      }

      setMessage({ type: 'success', text: 'Data restored successfully!' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!confirm('Are you sure you want to restore from uploaded files? This will overwrite current data.')) {
      e.target.value = '';
      return;
    }

    setMessage(null);

    try {
      const formData = new FormData();
      
      // Add all uploaded files
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/restore/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Restore from file failed' });
        e.target.value = '';
        return;
      }

      setMessage({ type: 'success', text: 'Data restored successfully from uploaded files!' });
      e.target.value = '';
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while uploading files' });
      e.target.value = '';
    }
  };

  const getCurrentRate = (userId: string): number | null => {
    const userRates = customerRates
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    
    return userRates.length > 0 ? userRates[0].rate : null;
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

  const customers = users.filter(u => u.role === 'customer');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Configure system settings and manage data</p>
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

      {/* Customer Rates Section */}
      <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Customer Milk Rates</h3>
              <p className="text-sm text-gray-600">Set individual rates for each customer</p>
            </div>
          </div>
          <button
            onClick={() => setShowRateForm(!showRateForm)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            {showRateForm ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Set Rate
              </>
            )}
          </button>
        </div>

        {showRateForm && (
          <form onSubmit={handleSetRate} className="mb-6 p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer</label>
                <select
                  required
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none bg-white"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.userId} value={customer.userId}>
                      {customer.userId} - {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rate (per liter)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">RS</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none bg-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Effective Date</label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none bg-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Set Rate
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  User ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  Current Rate
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  Effective Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {customers.map((customer, index) => {
                const currentRate = getCurrentRate(customer.userId);
                const rateHistory = customerRates
                  .filter(r => r.userId === customer.userId)
                  .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

                return (
                  <tr key={customer.userId} className={`hover:bg-purple-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                        {customer.userId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {currentRate ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-700">
                          RS {currentRate.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {rateHistory.length > 0 ? rateHistory[0].effectiveDate : <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> When a rate is changed, new milk entries will use the latest rate. 
              Existing entries will keep their original rate. The effective date determines when the rate becomes active.
            </p>
          </div>
        </div>
      </div>

      {/* Backup/Restore Section */}
      <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Backup & Restore</h3>
            <p className="text-sm text-gray-600">Manage your data backups and restore from files</p>
          </div>
        </div>
        
        <div className="space-y-5">
          <div className="flex gap-3">
            <button
              onClick={handleBackup}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Backup Data
            </button>
            <button
              onClick={handleRestore}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-600 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-yellow-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Restore from Backup
            </button>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload JSON Files to Restore
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Upload JSON files (users.json, milkEntries.json, payments.json, customerRates.json) to restore data.
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all bg-gray-50">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <span className="text-sm font-semibold text-gray-700">Choose JSON Files</span>
                  <p className="text-xs text-gray-500">Click to browse or drag and drop</p>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
