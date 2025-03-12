import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    console.log("Payload is:", body);

    const { id } = params;
    const { hotel_id, check_in_date, check_out_date, rooms, adults, childs, name, description, location, price, roomtype, availability } = body;

    // Validate required fields
    if (!hotel_id || !check_in_date || !check_out_date || !rooms || !adults || !childs) {
      return NextResponse.json(
        { message: 'Missing required fields', status: false },
        { status: 400 }
      );
    }

    // Construct the data object conditionally
    const updateData = {
      hotel_id,
      check_in_date,
      check_out_date,
      rooms,
      adults,
      childs,
      availability: (availability && availability === 'true') ? true : false,
      updated_at: new Date(),
    };

    // Update the package in the database
    const updatedhotel = await prisma.HotelBooking.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    return NextResponse.json(updatedhotel);
  } catch (error) {
    console.error('Error updating hotel:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to update hotel',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if the package exists
    const existinghotel = await prisma.HotelBooking.findUnique({
      where: { id: parseInt(id, 10) }, // Ensure id is an integer
    });

    if (!existinghotel) {
      return NextResponse.json(
        {
          message: 'Hotel not found',
          status: false,
        },
        { status: 404 }
      );
    }

    // Delete the package
    await prisma.HotelBooking.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json(
      {
        message: 'Hotel deleted successfully',
        status: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting hotel:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to delete hotel',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}