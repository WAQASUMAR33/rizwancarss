import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const data = await request.json();

        console.log("Data received", data);

        const {
            flight_id,
            flightgroup_id,
            flightsector_id,
            flightairline_id,
            agent_id,
            agentRemarks,
            adults,
            childs,
            infants,
            passengers,
        } = data;

        // Validate required fields
        const requiredFields = {
            flightgroup_id,
            flightsector_id,
            flightairline_id,
            flight_id,
            agent_id,
            agentRemarks,
        };
        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return NextResponse.json(
                { message: `Invalid data. Missing fields: ${missingFields.join(", ")}` },
                { status: 400 }
            );
        }

        if (!Array.isArray(passengers) || passengers.length === 0) {
            return NextResponse.json(
                { message: "Invalid data. Passengers must be a non-empty array." },
                { status: 400 }
            );
        }

        const flight = await prisma.singleGroupFlight.findUnique({
            where: { id: parseInt(flight_id) },
        });

        console.log("Flight Found: ", flight);
        if (!flight) {
            return NextResponse.json(
                { message: "Flight not found." },
                { status: 404 }
            );
        }

        const totalpassengers = passengers.length
        console.log("TOtal passengers are: ",totalpassengers);
        const totalprice = flight.fare * totalpassengers
        console.log("Total price ; ",totalprice)
        // const totalPrice = parseInt(flight.fare) * (parseInt(adults || 0) + parseInt(childs || 0) + parseInt(infants || 0));

        const newBooking = await prisma.GroupFlightBookings.create({
            data: {
                flightgroup_id: parseInt(flightgroup_id),
                flightsector_id: parseInt(flightsector_id),
                flightairline_id: parseInt(flightairline_id),
                flight_id: parseInt(flight_id),
                agent_id: parseInt(agent_id),
                childs: parseInt(childs || 0),
                adults: parseInt(adults || 0),
                infants: parseInt(infants || 0),
                price: totalprice,
                status: "Pending",
                remarks: agentRemarks || "",
            },
        });

        const passengerPromises = passengers.map((passenger) =>
            prisma.GroupPassengers.create({
                data: {
                    groupbooking_id: newBooking.id,
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
        console.error("Error saving booking or passengers:", error.message || error);
        return NextResponse.json(
            { message: "An error occurred while saving the data.", error: error.message || "Unknown error" },
            { status: 500 }
        );
    }
}
