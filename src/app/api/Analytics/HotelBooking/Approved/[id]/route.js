import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request,{params}) {
  const id = params.id;
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); 
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); 
    // Fetch pending flight bookings
    const pendingHotelBookings = await prisma.hotelBooking.findMany({
      where: { status: 'Approved',
        agent_id: parseInt(id),
        updated_at: {
          gte: startOfDay,
          lt: endOfDay,
        }, },
    });

    
    // Prepare the response
    const response = {
      hotelBookings: {
        count: pendingHotelBookings.length,
        data: pendingHotelBookings,
      },
    };

    // Return the response with status 200
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending hotel booking:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
