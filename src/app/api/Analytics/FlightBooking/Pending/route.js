import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); 
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); 
    // Fetch pending flight bookings
    const pendingFlightBookings = await prisma.flightBookings.findMany({
      where: { status: 'Pending',
        created_at: {
          gte: startOfDay,
          lt: endOfDay,
        }, },
    });

    // Fetch pending group flight bookings
    const pendingGroupFlightBookings = await prisma.groupFlightBookings.findMany({
      where: { status: 'Pending',
        created_at: {
          gte: startOfDay,
          lt: endOfDay,
        }, },
    });

    // Prepare the response
    const response = {
      flightBookings: {
        count: pendingFlightBookings.length,
        data: pendingFlightBookings,
      },
      groupFlightBookings: {
        count: pendingGroupFlightBookings.length,
        data: pendingGroupFlightBookings,
      },
    };

    // Return the response with status 200
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending flights:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
