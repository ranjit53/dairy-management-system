'use client';

import { useEffect, useState } from 'react';
import { User, MilkEntry, Payment } from '@/lib/utils';

export default function PaymentPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Payment form states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentDescription, setPaymentDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, entriesRes, paymentsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/milk'),
        fetch('/api/payments'),
      ]);

      const usersData = await usersRes.json();
      const entriesData = await entriesRes.json();
      const paymentsData = await paymentsRes.json();

      setUsers(usersData.users || []);
      setEntries(entriesData.entries || []);
      setPayments(paymentsData.payments || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const calculateCustomerDues = (userId: string): number => {
    const customerEntries = entries.filter(e => e.userId === userId);
    const customerPayments = payments.filter(p => p.userId === userId);
    
    const totalBill = customerEntries.reduce((sum, entry) => sum + entry.total, 0);
    const totalPaid = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    return totalBill - totalPaid;
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedCustomer) {
      setMessage({ type: 'error', text: 'Please select a customer' });
      return;
    }

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedCustomer,
          amount: parseFloat(paymentAmount),
          date: paymentDate,
          description: paymentDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to create payment' });
        return;
      }

      setMessage({ type: 'success', text: 'Payment recorded successfully!' });
      setSelectedCustomer('');
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentDescription('');
      setShowPaymentForm(false);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleCreateInvoice = (userId: string) => {
    const customer = users.find(u => u.userId === userId);
    const customerEntries = entries.filter(e => e.userId === userId);
    const customerPayments = payments.filter(p => p.userId === userId);
    const totalBill = customerEntries.reduce((sum, entry) => sum + entry.total, 0);
    const totalPaid = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const dues = totalBill - totalPaid;

    // Create invoice content
    const invoiceContent = `
DAIRY MANAGEMENT SYSTEM - INVOICE
==================================
Customer: ${customer?.name} (${userId})
Date: ${new Date().toLocaleDateString()}

MILK ENTRIES:
${customerEntries.map(e => 
  `${e.date} - ${e.liters}L @ RS ${e.rate} = RS ${e.total.toFixed(2)}`
).join('\n')}

TOTAL BILL: RS ${totalBill.toFixed(2)}
TOTAL PAID: RS ${totalPaid.toFixed(2)}
DUES: RS ${dues.toFixed(2)}
==================================
    `;

    // Create and download invoice
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${userId}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Payment Management</h2>
          <p className="text-gray-600 mt-1">Track payments and manage customer dues</p>
        </div>
        <button
          onClick={() => setShowPaymentForm(!showPaymentForm)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showPaymentForm ? 'Cancel' : 'Record Payment'}
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

      {showPaymentForm && (
        <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Record Payment</h3>
          </div>
          <form onSubmit={handleCreatePayment}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer</label>
                <select
                  required
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">RS</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
                  placeholder="Payment description"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Record Payment
            </button>
          </form>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
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
                  Total Bill
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  Total Paid
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  Dues Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {customers.map((customer, index) => {
                const customerEntries = entries.filter(e => e.userId === customer.userId);
                const customerPayments = payments.filter(p => p.userId === customer.userId);
                const totalBill = customerEntries.reduce((sum, entry) => sum + entry.total, 0);
                const totalPaid = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
                const dues = totalBill - totalPaid;

                return (
                  <tr key={customer.userId} className={`hover:bg-green-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                        {customer.userId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      RS {totalBill.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      RS {totalPaid.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                      dues > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${
                        dues > 0 ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        RS {dues.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleCreateInvoice(customer.userId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Invoice
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
