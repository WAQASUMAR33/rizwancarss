// app/api/admin/shareholders/route.js
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// ✅ POST: Create a new ShareHolder
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phonenumber, address, balance, status, adminId } = body;

    // Validate required fields
    if (!name || !phonenumber || !address || balance === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields: name, phonenumber, address, or balance', status: false },
        { status: 400 }
      );
    }

    const createdShareHolder = await prisma.shareHolders.create({
      data: {
        name,
        phonenumber,
        address,
        balance: parseFloat(balance),
        status: status || 'ACTIVE', // Default to 'ACTIVE' as per DistributorStatus enum
        adminId: adminId ? parseInt(adminId) : null, // Optional adminId
      },
    });

    return NextResponse.json(
      { message: 'ShareHolder created successfully', status: true, data: createdShareHolder },
      { status: 201 }
    );
  } catch (error) {
  
    return NextResponse.json(
      { message: 'Failed to create ShareHolder', status: false, error: error.message },
      { status: 500 }
    );
  }
}

// ✅ GET: Fetch all ShareHolders
export async function GET() {
  try {
    const shareHolders = await prisma.shareHolders.findMany({
      orderBy: { createdAt: 'desc' }, // Sort by creation date
      include: {
        admin: true, // Include related admin data (e.g., admin.fullname)
      },
    });

    return NextResponse.json(shareHolders); // Return as array per your original code
  } catch (error) {
  
    return NextResponse.json(
      {
        message: 'Failed to fetch ShareHolders',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}