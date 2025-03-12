import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function PUT(request,{params}) {
  const {id} = params;
  try {
    const body = await request.json();
    const { status } = body;

    console.log("Payload is ", body);

    // Fetch user's balance
    

    const booking = await prisma.PackageBookings.findUnique({
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
      console.log("Data for ledger is : ",booking.user_id,booking.total_amount,newamount,booking)
      const newrecord = await prisma.NewLedger.create({
        data: {
          agent_id: parseInt(booking.user_id), // Correct user ID
          amount_in: parseFloat(0),
          amount_out: parseFloat(booking.total_amount),
          balance: parseFloat(newamount>0 ? newamount : 0),
          description: 'Package Booking is happened',
          type: 'package-booking',
          package_booking_id: parseInt(booking.booking_id),
        },
      }).catch(error => {
        console.error("Error creating ledger record:", error);
        throw new Error("Failed to create ledger record");
      });
      const notification = await prisma.Notifications.create({
        data: {
          user_id: parseInt(booking.user_id), // Correct user ID
          message: "Your package booking has been approved",
          status: "sent"
        },
      }).catch(error => {
        console.error("Error creating notification record:", error);
        throw new Error("Failed to create notification record");
      });
    }

    // Create the booking if balance is sufficient
    const newBooking = await prisma.PackageBookings.update({
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
    const bookings = await prisma.packageBookings.findMany({where:{
        user_id: id
    } }); // Corrected typo in `packageBookings`
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
  const bookings = await prisma.packageBookings.delete({where:{
      booking_id: parseInt(id)
  } }); // Corrected typo in `packageBookings`
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
