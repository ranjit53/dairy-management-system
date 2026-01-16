import { NextRequest, NextResponse } from 'next/server';
import {
  getUsers,
  addUser,
  generateNextUserId,
  User,
} from '@/lib/utils';

// GET: Return all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd verify admin role from session/cookie
    // For simplicity, we'll allow this endpoint to be called
    const users = getUsers();
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    
    return NextResponse.json({ users: usersWithoutPasswords });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new customer
export async function POST(request: NextRequest) {
  try {
    const { name, password, address, mobile } = await request.json();

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Name and password are required' },
        { status: 400 }
      );
    }

    // Generate next customer ID
    const userId = generateNextUserId();

    // Create new customer
    const newUser: User = {
      userId,
      name,
      password,
      role: 'customer',
      address: address || '',
      mobile: mobile || '',
    };

    addUser(newUser);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
