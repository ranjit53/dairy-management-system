import { NextRequest, NextResponse } from 'next/server';
import { getUsers, saveUsers } from '@/lib/utils';

// Initialize default users if file doesn't exist or is empty
function initializeDefaultUsers() {
  const users = getUsers();
  if (users.length === 0) {
    const defaultUsers = [
      {
        userId: 'ADMIN001',
        name: 'Admin',
        password: 'admin123',
        role: 'admin' as const,
      },
      {
        userId: 'CUST001',
        name: 'Ramesh',
        password: '1234',
        role: 'customer' as const,
      },
    ];
    saveUsers(defaultUsers);
    return defaultUsers;
  }
  return users;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'User ID and password are required' },
        { status: 400 }
      );
    }

    // Initialize default users if needed
    const users = initializeDefaultUsers();
    
    const user = users.find(
      (u) => u.userId === userId && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid User ID or password' },
        { status: 401 }
      );
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
