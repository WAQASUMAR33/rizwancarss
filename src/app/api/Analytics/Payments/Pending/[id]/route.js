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
    const pendingpaymentRequests = await prisma.paymentRequests.findMany({
      where: { status: 'Pending',
        userid:parseInt(id),
        created_at: {
          gte: startOfDay,
          lt: endOfDay,
        }, },
    });

    
    // Prepare the response
    const response = {
      paymentRequests: {
        count: pendingpaymentRequests.length,
        data: pendingpaymentRequests,
      },
    };

    // Return the response with status 200
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending paymentRequests:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
