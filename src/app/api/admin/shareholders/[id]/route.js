// app/api/admin/distributors/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// ✅ GET: Fetch a Distributor by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Find distributor by ID
    const distributor = await prisma.distributor.findUnique({
      where: { id: parseInt(id, 10) }, // Changed to 'id'
    });

    if (!distributor) {
      return NextResponse.json(
        { message: 'Distributor not found', status: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Distributor fetched successfully',
      status: true,
      data: distributor,
    });
  } catch (error) {
    console.error('Error fetching distributor:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch distributor',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ✅ PUT: Update a Distributor by ID
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, location, username, password, balance, status } = body;

    // Validate required fields
    if (!name || !location || !username || !password || balance === undefined) {
      return NextResponse.json(
        {
          message: 'Missing required fields: name, location, username, password, or balance',
          status: false,
        },
        { status: 400 }
      );
    }

    // Update distributor in database
    const updatedDistributor = await prisma.distributor.update({
      where: { id: parseInt(id, 10) }, // Changed to 'id'
      data: {
        name,          // Changed from distributors_name
        location,      // Changed from distributors_location
        username,
        password,      // Should be hashed in production
        balance: parseFloat(balance), // Convert to number for Decimal
        status: status || 'ACTIVE',   // Default to ACTIVE if not provided
        // updatedAt is handled by Prisma
      },
    });

    return NextResponse.json({
      message: 'Distributor updated successfully',
      status: true,
      data: updatedDistributor,
    });
  } catch (error) {
    console.error('Error updating distributor:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to update distributor',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ✅ DELETE: Delete a Distributor by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if distributor exists
    const existingDistributor = await prisma.distributor.findUnique({
      where: { id: parseInt(id, 10) }, // Changed to 'id'
    });

    if (!existingDistributor) {
      return NextResponse.json(
        { message: 'Distributor not found', status: false },
        { status: 404 }
      );
    }

    // Delete distributor
    await prisma.distributor.delete({
      where: { id: parseInt(id, 10) }, // Changed to 'id' and fixed typo
    });

    return NextResponse.json({
      message: 'Distributor deleted successfully',
      status: true,
    });
  } catch (error) {
    console.error('Error deleting distributor:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to delete distributor',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}