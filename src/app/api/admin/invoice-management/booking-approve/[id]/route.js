import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
    const { id } = params;

    try {
        const { bookingid, status } = await request.json();
        console.log("Booking ID and status:", bookingid, status);

        // Find the hotel booking with related data
        const booking = await prisma.hotelBooking.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                Hotel: true,
                Users: true,
            },
        });

        if (!booking) {
            return NextResponse.json(
                { message: "Booking not found", status: false },
                { status: 404 }
            );
        }
        if (booking.status==="Approved") {
            return NextResponse.json(
                { message: "Your Booking is already approved"},
                { status: 400 }
            );
        }

        // Update the booking status
        const updatedData = await prisma.hotelBooking.update({
            where: { id: parseInt(id, 10) },
            data: { status },
        });

        if (updatedData) {
            // Retrieve the user related to the booking
            const user = await prisma.users.findUnique({
                where: { id: booking.agent_id },
            });

            if (!user) {
                return NextResponse.json(
                    { message: "User not found", status: false },
                    { status: 404 }
                );
            }

            if (user.balance < booking.price) {
                console.log("Insufficient balance");
                return NextResponse.json(
                    { message: "Insufficient balance", status: false },
                    { status: 400 }
                );
            } else {
                // Deduct amount from user's balance
                const newBalance = user.balance - booking.price;

                await prisma.users.update({
                    where: { id: booking.agent_id },
                    data: { balance: Math.max(newBalance, 0) },
                });

                console.log("Ledger entry creation", booking.agent_id, booking.price);

                // Create a new ledger record
                await prisma.NewLedger.create({
                    data: {
                        agent_id: booking.agent_id,
                        amount_in: 0,
                        amount_out: booking.price,
                        balance: Math.max(newBalance, 0),
                        description: "Hotel Booking is completed",
                        type: "hotel-booking",
                        hotel_booking_id: booking.id,
                    },
                });
                const notification = await prisma.Notifications.create({
                    data: {
                      user_id: parseInt(booking.agent_id), // Correct user ID
                      message: "Your Hotel booking has been approved",
                      status: "sent"
                    },
                  }).catch(error => {
                    console.error("Error creating ledger record:", error);
                    throw new Error("Failed to create ledger record");
                  });

                return NextResponse.json(
                    { message: "Successfully updated", status: true },
                    { status: 200 }
                );
            }
        }
    } catch (error) {
        console.error("Error occurred while updating data:", error);
        return NextResponse.json(
            { message: "Error occurred", error: error.message },
            { status: 500 }
        );
    }
}
