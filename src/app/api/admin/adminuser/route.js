import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import bcrypt from 'bcryptjs';

// POST request to create a new admin user
export async function POST(request) {
  try {
    const body = await request.json();
    const { fullname, username, password, role } = body;

    // Check if all required fields are provided
    if (!fullname || !username || !password || !role) {
      return NextResponse.json({
        message: 'All fields (fullname, username, password, and role) are required',
        status: false,
      }, { status: 400 });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new admin with the provided data
    const newAdmin = await prisma.admin.create({
      data: {
        fullname,
        username,
        password: hashedPassword, // Store the hashed password
        role,
      },
    });

    return NextResponse.json(newAdmin);
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      {
        message: 'Failed to create admin user',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET request to fetch all admin users
export async function GET() {
  try {
    const admins = await prisma.admin.findMany();
    return NextResponse.json(admins);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch admin users',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
