import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomerRates,
  setCustomerRate,
  CustomerRate,
} from '@/lib/utils';

// GET: Return all customer rates
export async function GET(request: NextRequest) {
  try {
    const rates = getCustomerRates();
    return NextResponse.json({ rates });
  } catch (error) {
    console.error('Get customer rates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Set customer rate
export async function POST(request: NextRequest) {
  try {
    const { userId, rate, effectiveDate } = await request.json();

    if (!userId || !rate || !effectiveDate) {
      return NextResponse.json(
        { error: 'userId, rate, and effectiveDate are required' },
        { status: 400 }
      );
    }

    const rateNum = parseFloat(rate);
    if (isNaN(rateNum) || rateNum <= 0) {
      return NextResponse.json(
        { error: 'Rate must be a positive number' },
        { status: 400 }
      );
    }

    setCustomerRate(userId, rateNum, effectiveDate);

    return NextResponse.json({
      success: true,
      message: 'Customer rate set successfully',
    });
  } catch (error) {
    console.error('Set customer rate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
