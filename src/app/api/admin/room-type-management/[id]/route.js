import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function PUT(request) {
  try {
    const body = await request.json();
    console.log("Payload is:", body);

    const { title,
      description, } = body;
    // Validate required fields
    if (!title || !description ) {
      return NextResponse.json(
        { message: 'Missing required fields', status: false },
        { status: 400 }
      );
    }


    // Construct the data object conditionally
    const updateData = {
      title,
      description,
      updated_at: new Date(),
    };

    // Update the package in the database
    const roomType = await prisma.roomType.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(roomType);
  } catch (error) {
    console.error('Error updating hotel:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to update roomType',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET request to fetch all hotel
export async function GET() {
  try {
    const roomType = await prisma.roomType.findMany();
    return NextResponse.json(roomType);
  } catch (error) {
    console.error('Error fetching hotel:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch hotel',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Check if the package exists
    const roomType = await prisma.hotel.findUnique({
      where: { id: parseInt(id, 10) }, // Ensure id is an integer
    });

    if (!roomType) {
      return NextResponse.json(
        {
          message: 'roomType not found',
          status: false,
        },
        { status: 404 }
      );
    }

    // Delete the package
    await prisma.roomType.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json(
      {
        message: 'roomType deleted successfully',
        status: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting roomType:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to delete roomType',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}