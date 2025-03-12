import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, visa_id, total_amount, paid_amount, remaining_amount, status, payment_method, notes } = body;

    console.log("Payload is ", body);

    // Fetch user's balance
    const user = await prisma.users.findUnique({
      where: { id: user_id },
      select: { balance: true },
    });

    // Check if user exists and balance is sufficient
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', status: false },
        { status: 404 }
      );
    }

    if (user.balance < total_amount) {
        console.log("insufficient balance")
      return NextResponse.json(
        { message: 'Insufficient balance', status: false },
        { status: 400 }
      );
    }

    // Create the booking if balance is sufficient
    const newBooking = await prisma.VisaBookings.create({
      data: {
        user_id,
        visa_id: parseInt(visa_id),
        total_amount: parseFloat(total_amount),
        paid_amount: parseFloat(paid_amount),
        remaining_amount: parseFloat(remaining_amount),
        status,
        payment_method,
        notes,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to create booking',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET request to fetch all bookings
export async function GET(request,{params}) {
    const id = params.id
    console.log("id",id);
  try {
    const bookings = await prisma.visaBookings.findMany({where:{
        user_id: parseInt(id)
    } ,
    include:{
      Visa:true
    }
  }); // Corrected typo in `visaBookings`
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
