import { NextRequest, NextResponse } from 'next/server';
import { deleteMilkEntry, updateMilkEntry, getMilkEntries } from '@/lib/utils';

// PUT: Update milk entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await params;
    const { date, liters, rate, time } = await request.json();

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    if (!date || !liters || !rate) {
      return NextResponse.json(
        { error: 'date, liters, and rate are required' },
        { status: 400 }
      );
    }

    const litersNum = parseFloat(liters);
    const rateNum = parseFloat(rate);

    if (isNaN(litersNum) || isNaN(rateNum) || litersNum <= 0 || rateNum <= 0) {
      return NextResponse.json(
        { error: 'Liters and rate must be positive numbers' },
        { status: 400 }
      );
    }

    const updated = updateMilkEntry(entryId, {
      date,
      liters: litersNum,
      rate: rateNum,
      time: time || 'morning',
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    const entries = getMilkEntries();
    const updatedEntry = entries.find(e => e.entryId === entryId);

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
    });
  } catch (error) {
    console.error('Update milk entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove milk entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await params;

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const deleted = deleteMilkEntry(entryId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Entry deleted successfully',
    });
  } catch (error) {
    console.error('Delete milk entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
