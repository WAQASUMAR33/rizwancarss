import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const groupflights = await prisma.singleGroupFlight.findMany({
      where: {
        flightgroup_id: parseInt(id),
      },
      include: {
        FlightGroups: true,
        FlightSector: true,
        FlightAirline: true,
      }
    });
    return NextResponse.json(groupflights);
  } catch (error) {
    console.error("Error fetching groupflights:", error.message);
    return NextResponse.json(
      {
        message: "Failed to fetch groupflights",
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

