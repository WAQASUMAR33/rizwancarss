import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
    const { id } = params;

    try {
        const { bookingid, status } = await request.json(); // Correctly destructure the JSON body
        console.log("Booking ID and status:", bookingid, status);

        const updateddata = await prisma.hotelBooking.update({
            where: {
                id: parseInt(id, 10), // Ensure id is an integer
            },
            data: {
                status: status, // Update the status field
            },
        });

        if (updateddata) {
            return NextResponse.json(
                { message: "Successfully updated" },
                { status: 200 } // Proper status usage
            );
        }
    } catch (error) {
        console.error("Error occurred while updating data:", error);
        return NextResponse.json(
            { message: "Error occurred" },
            { status: 500 } // Proper status usage
        );
    }
}
