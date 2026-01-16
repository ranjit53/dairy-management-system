import { NextRequest, NextResponse } from 'next/server';
import {
  getUsers,
  saveUsers,
  getUserById,
  User,
} from '@/lib/utils';

// PUT: Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { name, password, address, mobile } = await request.json();

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Name and password are required' },
        { status: 400 }
      );
    }

    const users = getUsers();
    const userIndex = users.findIndex(u => u.userId === userId);

    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user
    users[userIndex] = {
      ...users[userIndex],
      name,
      password,
      address: address || users[userIndex].address,
      mobile: mobile || users[userIndex].mobile,
    };

    saveUsers(users);

    const { password: _, ...userWithoutPassword } = users[userIndex];

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
