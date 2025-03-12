import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();
    console.log('Payload is:', body);

    const { name, description, location, availability, hotelDetails } = body;

    // Validate required fields
    if (!name || !description || !location || availability === undefined || !Array.isArray(hotelDetails)) {
      return NextResponse.json(
        { message: 'Missing required fields', status: false },
        { status: 400 }
      );
    }

    // Parse availability as boolean
    const parsedAvailability = Boolean(availability);

    // Start a transaction to update hotel and hotelDetails atomically
    const updatedHotel = await prisma.$transaction(async (prisma) => {
      // Update the hotel
      const hotel = await prisma.hotel.update({
        where: { id: parseInt(id, 10) },
        data: {
          name,
          description,
          location,
          availability: parsedAvailability,
          updated_at: new Date(),
        },
      });

      // Update HotelDetails
      const existingDetails = await prisma.hotelDetails.findMany({
        where: { hotel_id: parseInt(id, 10) },
      });

      const existingDetailIds = existingDetails.map((detail) => detail.id);
      const newDetailIds = hotelDetails.map((detail) => detail.id).filter(Boolean);

      // Delete details not in the new payload
      const detailsToDelete = existingDetailIds.filter((id) => !newDetailIds.includes(id));
      await prisma.hotelDetails.deleteMany({
        where: { id: { in: detailsToDelete } },
      });

      // Update or create details
      const detailsPromises = hotelDetails.map((detail) => {
        if (detail.id) {
          // Update existing detail
          return prisma.hotelDetails.update({
            where: { id: detail.id },
            data: {
              roomtype_id: detail.roomtype_id,
              price: detail.price,
              updated_at: new Date(),
            },
          });
        } else {
          // Create new detail
          return prisma.hotelDetails.create({
            data: {
              hotel_id: hotel.id,
              roomtype_id: detail.roomtype_id,
              price: detail.price,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        }
      });

      await Promise.all(detailsPromises);

      return hotel;
    });

    return NextResponse.json({
      message: 'Hotel and details updated successfully',
      status: true,
      hotel: updatedHotel,
    });
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


// GET request to fetch all hotel
export async function GET() {
  try {
    const hotel = await prisma.hotel.findMany();
    return NextResponse.json(hotel);
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
    const existinghotel= await prisma.hotel.findUnique({
      where: { id: parseInt(id, 10) }, // Ensure id is an integer
    });

    if (!existinghotel) {
      return NextResponse.json(
        {
          message: 'hotel not found',
          status: false,
        },
        { status: 404 }
      );
    }

    // Delete the package
    await prisma.hotel.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json(
      {
        message: 'hotel deleted successfully',
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