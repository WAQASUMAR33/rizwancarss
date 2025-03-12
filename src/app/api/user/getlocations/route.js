import prisma from '@/utils/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch hotels and select only unique locations
    const hotels = await prisma.hotel.findMany({
      select: { location: true },
      where: { availability: true }, // Optionally filter available hotels
    });

    // Extract unique locations
    const uniqueLocations = [...new Set(hotels.map((hotel) => hotel.location))];

    // Return the locations in the response
    return NextResponse.json(uniqueLocations, { status: 200 });
  } catch (error) {
    console.error('Error fetching locations:', error);

    // Return an error response
    return NextResponse.json({ message: 'An error occurred while fetching locations' }, { status: 500 });
  }
}
