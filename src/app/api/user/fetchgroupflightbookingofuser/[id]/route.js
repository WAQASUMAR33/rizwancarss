import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const id = params.id;
  try {
    const response = await prisma.groupFlightBookings.findMany({
      where: {
        agent_id: parseInt(id),
      },
      include: {
        Users:true,
        SingleGroupFlight:true,
        GroupPassengers:true,
        FlightGroups:true,
        FlightSector:true,
        FlightAirline:true,
      }
    });
    
    if (response) {
      return NextResponse.json(response);
    }
  } catch (e) {
    return NextResponse.json(
      {
        message: 'Failed to fetch bookings',
        status: false,
        error: e.message,
      },
      { status: 500 }
    );
  }
}
