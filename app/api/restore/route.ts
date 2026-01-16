import { NextRequest, NextResponse } from 'next/server';
import { restoreData } from '@/lib/utils';

// POST: Restore data from backup
export async function POST(request: NextRequest) {
  try {
    const result = restoreData();

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
