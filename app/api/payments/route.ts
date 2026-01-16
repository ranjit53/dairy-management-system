import { NextRequest, NextResponse } from 'next/server';
import {
  getPayments,
  addPayment,
  generateNextPaymentId,
  Payment,
} from '@/lib/utils';

// GET: Return all payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let payments = getPayments();
    
    if (userId) {
      payments = payments.filter(p => p.userId === userId);
    }

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new payment
export async function POST(request: NextRequest) {
  try {
    const { userId, amount, date, description } = await request.json();

    if (!userId || !amount || !date) {
      return NextResponse.json(
        { error: 'userId, amount, and date are required' },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const paymentId = generateNextPaymentId();

    const newPayment: Payment = {
      paymentId,
      userId,
      amount: amountNum,
      date,
      description: description || '',
    };

    addPayment(newPayment);

    return NextResponse.json({
      success: true,
      payment: newPayment,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
