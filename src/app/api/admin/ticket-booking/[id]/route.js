import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function PUT(request,{params}) {
  const {id} = params;
  try {
    const body = await request.json();
    const { status } = body;

    console.log("Payload is ", body);

    // Fetch user's balance
    

    const booking = await prisma.ticketBookings.findUnique({
      where: { booking_id: parseInt(id) },
    });

    // Check if user exists and balance is sufficient
    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found', status: false },
        { status: 404 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: booking.user_id },
    });

    // Check if user exists and balance is sufficient
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', status: false },
        { status: 404 }
      );
    }
    if (user.balance < booking.total_amount) {
        console.log("insufficient balance")
      return NextResponse.json(
        { message: 'Insufficient balance', status: false },
        { status: 400 }
      );
    }else{
      const newamount = user.balance - booking.total_amount;
      const update = await prisma.users.update({
        where: { id: booking.user_id },
        data:{
          balance: newamount>0 ? newamount : 0
        }
      });
      console.log("ledger is going to create")

      const newrecord = await prisma.ledger.create({
        data: {
          userId: parseInt(booking.user_id), // Correct user ID
          credit: parseFloat(0),
          debit: parseFloat(booking.total_amount),
          balance: parseFloat(newamount>0 ? newamount : 0),
          description: 'Booking is happened',
        },
      }).catch(error => {
        console.error("Error creating ledger record:", error);
        throw new Error("Failed to create ledger record");
      });

    }

    // Create the booking if balance is sufficient
    const newBooking = await prisma.ticketBookings.update({
      where:{booking_id: parseInt(id)},
      data: {
        status,
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
    const {id} = parseInt(params);
    console.log("id",id);
  try {
    const bookings = await prisma.ticketBookings.findMany({where:{
        user_id: id
    } }); // Corrected typo in `ticketBookings`
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

export async function DELETE(request,{params}) {
  const {id} = params;
  console.log("id",id);
try {
  const bookings = await prisma.ticketBookings.delete({where:{
      booking_id: parseInt(id)
  } }); // Corrected typo in `ticketBookings`
  return NextResponse.json(bookings);
} catch (error) {
  console.error('Error delete bookings:', error.message);
  return NextResponse.json(
    {
      message: 'Failed to delete bookings',
      status: false,
      error: error.message,
    },
    { status: 500 }
  );
}
}
