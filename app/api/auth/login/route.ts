import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const db = getDB();
    
    // Find user by email
    const user = Array.from(db.users.values()).find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get additional user details based on role
    let roleData = null;
    if (user.role === 'student') {
      roleData = Array.from(db.students.values()).find(
        (s) => s.userId === user.id
      );
    } else if (user.role === 'teacher') {
      roleData = Array.from(db.teachers.values()).find(
        (t) => t.userId === user.id
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      roleData,
    });
  } catch (error) {
    console.error('[v0] Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
