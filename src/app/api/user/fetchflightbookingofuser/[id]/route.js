import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const id = params.id;
  try {
    const response = await prisma.FlightBookings.findMany({
      where: {
        agent_id: parseInt(id),
      },
      include: {
        FlightDetails: {
            include: {
              SingleFlight: true, 
              FlightBookings:{
                include: {
                  Users:true,
                  FlightDetails:true,
                  Passengers:true,
                }
              },
            },
          },
          Passengers: true, 
          Users:true,
        },
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
