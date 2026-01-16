import { NextRequest, NextResponse } from 'next/server';
import { backupData } from '@/lib/utils';

// POST: Backup data files
export async function POST(request: NextRequest) {
  try {
    const result = backupData();

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
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
