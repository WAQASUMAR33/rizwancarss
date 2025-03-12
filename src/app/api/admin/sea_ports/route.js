// app/api/admin/sea_ports/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prisma';

// POST: Create a new sea port
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, location, admin_id } = body;

    // Validate required fields (matches Prisma model: name and admin_id are required)
    if (!name) {
      return NextResponse.json(
        { message: 'Missing required field: name', status: false },
        { status: 400 }
      );
    }
    if (!admin_id) {
      return NextResponse.json(
        { message: 'Missing required field: admin_id', status: false },
        { status: 400 }
      );
    }

    // Verify admin exists (matches Prisma foreign key relation)
    const adminExists = await prisma.admin.findUnique({
      where: { id: parseInt(admin_id) },
    });
    if (!adminExists) {
      return NextResponse.json(
        { message: 'Invalid admin_id: Admin not found', status: false },
        { status: 400 }
      );
    }

    // Create a new sea port in the database (aligned with Prisma model)
    const newSeaPort = await prisma.seaPort.create({
      data: {
        name, // Required, matches model
        location: location || "", // Optional, matches model with default ""
        admin_id: parseInt(admin_id), // Required, matches model foreign key
      },
      include: {
        admin: true, // Include admin data in response, matches relation
      },
    });

    return NextResponse.json(
      {
        message: 'Sea port created successfully',
        status: true,
        data: newSeaPort,
      },
      { status: 201 }
    );
  } catch (error) {
   
    return NextResponse.json(
      {
        message: 'Failed to create sea port',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET: Fetch all sea ports
export async function GET() {
  try {
    const seaPorts = await prisma.seaPort.findMany({
      orderBy: { createdAt: 'desc' }, // Matches model createdAt field
      include: {
        // vehicles: true, // Matches relation to AddVehicle
        admin: true,    // Matches relation to Admin
      },
    });

    return NextResponse.json(
      {
        message: 'Sea ports fetched successfully',
        status: true,
        data: seaPorts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching sea ports:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch sea ports',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}