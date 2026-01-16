import { NextRequest, NextResponse } from 'next/server';
import {
  getMilkEntries,
  getMilkEntriesByUserId,
  addMilkEntry,
  generateNextEntryId,
  getUserById,
  getCustomerRate,
  convertToNepaliDate,
  MilkEntry,
} from '@/lib/utils';

// GET: Return all entries (admin) or filtered by userId (customer)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let entries;
    if (userId) {
      // Customer view - only their entries
      entries = getMilkEntriesByUserId(userId);
    } else {
      // Admin view - all entries
      entries = getMilkEntries();
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Get milk entries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new milk entry
export async function POST(request: NextRequest) {
  try {
    const { userId, date, liters, rate, time } = await request.json();

    if (!userId || !date || !liters) {
      return NextResponse.json(
        { error: 'userId, date, and liters are required' },
        { status: 400 }
      );
    }

    // Validate userId exists
    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate numeric values
    const litersNum = parseFloat(liters);

    if (isNaN(litersNum) || litersNum <= 0) {
      return NextResponse.json(
        { error: 'Liters must be a positive number' },
        { status: 400 }
      );
    }

    // Get rate - use provided rate or customer-specific rate
    let rateNum: number;
    if (rate && parseFloat(rate) > 0) {
      rateNum = parseFloat(rate);
    } else {
      // Try to get customer-specific rate
      const customerRate = getCustomerRate(userId, date);
      if (!customerRate) {
        return NextResponse.json(
          { error: 'Rate is required. Please provide rate or set customer rate in Settings.' },
          { status: 400 }
        );
      }
      rateNum = customerRate;
    }

    // Calculate total
    const total = litersNum * rateNum;

    // Generate entry ID
    const entryId = generateNextEntryId();

    // Convert to Nepali date
    const nepaliDate = convertToNepaliDate(date);

    // Create new entry
    const newEntry: MilkEntry = {
      entryId,
      userId,
      date,
      nepaliDate,
      liters: litersNum,
      rate: rateNum,
      total,
      time: time || 'morning',
    };

    addMilkEntry(newEntry);

    return NextResponse.json({
      success: true,
      entry: newEntry,
    });
  } catch (error) {
    console.error('Create milk entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
