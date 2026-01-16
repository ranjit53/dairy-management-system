import { NextRequest, NextResponse } from 'next/server';
import { restoreFromFiles } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    // Read all uploaded files
    const fileData: Record<string, any> = {};
    
    for (const file of files) {
      const fileName = file.name.toLowerCase();
      const content = await file.text();
      
      try {
        const jsonData = JSON.parse(content);
        
        // Map file names to data types
        if (fileName.includes('user')) {
          fileData.users = jsonData;
        } else if (fileName.includes('milk') || fileName.includes('entry')) {
          fileData.milkEntries = jsonData;
        } else if (fileName.includes('payment')) {
          fileData.payments = jsonData;
        } else if (fileName.includes('rate') || fileName.includes('customerrate')) {
          fileData.customerRates = jsonData;
        }
      } catch (parseError) {
        return NextResponse.json(
          { error: `Invalid JSON in file ${file.name}` },
          { status: 400 }
        );
      }
    }

    // Restore data from uploaded files
    const result = restoreFromFiles(fileData);

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
    console.error('Restore upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
