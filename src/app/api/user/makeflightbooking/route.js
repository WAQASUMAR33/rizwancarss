import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const data = await request.json();

        console.log("data received", data);


        // Destructure the expected fields
        const { flightdetails_id,agent_id, agentRemarks, adults, children, infants, passengers } = data;

        // Define required fields and check for missing ones
        const requiredFields = {
            flightdetails_id,
            agent_id,
            agentRemarks,
            passengers,
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value || (Array.isArray(value) && value.length === 0))
            .map(([key]) => key);

        if (missingFields.length > 0) {
            console.error("Missing fields:", missingFields.join(", "));
            return NextResponse.json(
                { message: `Invalid data. Missing fields: ${missingFields.join(", ")}` },
                { status: 400 }
            );
        }

        // Create a FlightBooking record
        const newBooking = await prisma.FlightBookings.create({
            data: {
                flightdetails_id: parseInt(flightdetails_id),
                agent_id: parseInt(agent_id),
                childs: children,
                adults: adults,
                infants: infants,
                status: "Pending",
                remarks: agentRemarks || "",
            },
        });

        console.log("Booking created successfully:", newBooking);

        // Create Passengers linked to the new booking
        const passengerPromises = passengers.map((passenger) =>
            prisma.Passengers.create({
                data: {
                    booking_id: newBooking.id,
                    givenname: passenger.givenName,
                    surname: passenger.surname,
                    title: passenger.title,
                    type: passenger.type || "Adult",
                    passportid: passenger.passport,
                    dob: passenger.dob,
                    doe: passenger.doe,
                },
            })
        );

        await Promise.all(passengerPromises);

        return NextResponse.json(
            { message: "Booking and passengers added successfully." },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error saving booking or passengers:", error);

        return NextResponse.json(
            { message: "An error occurred while saving the data.", error: error.message },
            { status: 500 }
        );
    }
}
