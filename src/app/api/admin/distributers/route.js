// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { fullname, phonenumber, address, balance, status, adminId } = body;

    // Validate required fields
    if (!fullname || !phonenumber || !address || balance === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields: fullname, phonenumber, address, or balance', status: false },
        { status: 400 }
      );
    }

    const createdUser = await prisma.user.create({
      data: {
        fullname,
        phonenumber,
        address,
        balance: parseFloat(balance),
        status: status || 'Active', // Default to 'Active' as per the User model
        adminId: adminId ? parseInt(adminId) : null, // Optional adminId
      },
    });

    return NextResponse.json(
      { message: 'User created successfully', status: true, data: createdUser },
      { status: 201 }
    );
  } catch (error) {
   
    return NextResponse.json(
      { message: 'Failed to create user', status: false, error: error.message },
      { status: 500 }
    );
  }
}

// ✅ GET: Fetch all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, // Sort by creation date
      include: {
        admin: true, // Include related admin data (e.g., admin.fullname)
      },
    });

    return NextResponse.json(users); // Return as array per your original code
  } catch (error) {
   
    return NextResponse.json(
      {
        message: 'Failed to fetch users',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}