import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// GET request to fetch all bookings
export async function GET() {
  try {
    const bookings = await prisma.FlightBookings.findMany({
      include: {
        FlightDetails: {
            include: {
              SingleFlight: true, // Include related SingleFlight data through FlightDetails
            },
          },
          Passengers: true, // Include related passengers
          Users:true
        },
    });
    
    console.log("Bookings",bookings);
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch bookings',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
