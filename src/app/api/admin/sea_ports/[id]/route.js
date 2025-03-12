import { NextResponse } from 'next/server';
import prisma from '../../../../../utils/prisma';

// POST: Create a new sea port
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, location, admin_id } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: 'Missing required field: name', status: false },
        { status: 400 }
      );
    }

    // Validate admin_id if provided (optional, defaults to 0)
    if (admin_id && isNaN(parseInt(admin_id))) {
      return NextResponse.json(
        { message: 'Invalid admin_id: must be an integer', status: false },
        { status: 400 }
      );
    }

    const newSeaPort = await prisma.seaPort.create({
      data: {
        name,
        location: location || '', // Optional, defaults to empty string
        admin_id: admin_id ? parseInt(admin_id) : 0, // Optional, defaults to 0
      },
    });

    return NextResponse.json(
      { message: 'Sea port created successfully', status: true, data: newSeaPort },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating sea port:', error.message);
    return NextResponse.json(
      { message: 'Failed to create sea port', status: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET: Fetch all sea ports
export async function GET() {
  try {
    const seaPorts = await prisma.seaPort.findMany({
      include: {
        admin: {
          select: {
            id: true,
            fullname: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { message: 'Sea ports fetched successfully', status: true, data: seaPorts },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching sea ports:', error.message);
    return NextResponse.json(
      { message: 'Failed to fetch sea ports', status: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update a sea port
export async function PUT(request) {
  try {
    const body = await request.json();
    console.log("Payload is:", body);

    const { id, name, location, admin_id } = body;

    // Validate required fields
    if (!id || !name) {
      return NextResponse.json(
        { message: 'Missing required fields: id or name', status: false },
        { status: 400 }
      );
    }

    // Validate admin_id if provided
    if (admin_id && isNaN(parseInt(admin_id))) {
      return NextResponse.json(
        { message: 'Invalid admin_id: must be an integer', status: false },
        { status: 400 }
      );
    }

    // Update the sea port in the database
    const updatedSeaPort = await prisma.seaPort.update({
      where: { id: parseInt(id, 10) }, // Ensure id is an integer
      data: {
        name,
        location: location || '', // Optional, defaults to empty string if not provided
        admin_id: admin_id ? parseInt(admin_id) : 0, // Update admin_id if provided, else keep existing or default to 0
      },
    });

    return NextResponse.json(
      { message: 'Sea port updated successfully', status: true, data: updatedSeaPort },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating sea port:', error.message);
    return NextResponse.json(
      { message: 'Failed to update sea port', status: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a sea port
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.pathname.split('/').pop(), 10); // Extract ID from URL (e.g., /api/admin/sea_ports/1)

    // Ensure id is valid
    if (!id || isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid or missing id', status: false },
        { status: 400 }
      );
    }

    // Check if the sea port exists
    const existingSeaPort = await prisma.seaPort.findUnique({
      where: { id },
    });

    if (!existingSeaPort) {
      return NextResponse.json(
        { message: 'Sea port not found', status: false },
        { status: 404 }
      );
    }

    // Delete the sea port
    await prisma.seaPort.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Sea port deleted successfully', status: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting sea port:', error.message);
    return NextResponse.json(
      { message: 'Failed to delete sea port', status: false, error: error.message },
      { status: 500 }
    );
  }
}