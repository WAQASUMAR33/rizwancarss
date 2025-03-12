import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
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

    // 
    const newHotel = await prisma.hotel.create({
      data: {
        name,
        description,
        location,
        availability: Boolean(availability),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Create hotel details for each room type
    const hotelDetailsPromises = hotelDetails.map((detail) =>
      prisma.hotelDetails.create({
        data: {
          hotel_id: newHotel.id,
          roomtype_id: detail.roomtype_id,
          price: detail.price,
        },
      })
    );
    await Promise.all(hotelDetailsPromises);

    return NextResponse.json({ message: 'Hotel created successfully', status: true, hotel: newHotel });
  } catch (error) {
    console.error('Error creating hotel:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to create hotel',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET request to fetch all hotels with details
export async function GET() {
  try {
    const hotels = await prisma.hotel.findMany({
      include: {
        HotelDetails: true, // Include related hotel details
      },
    });
    return NextResponse.json(hotels);
  } catch (error) {
    console.error('Error fetching hotels:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch hotels',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
