// flight-group/route.js
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Payload is ", body);
    const {   title,
        image,} = body;

    console.log("Payload is ", body);

    const newFlightGroup = await prisma.FlightGroups.create({
      data: {
        title,
        image,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(newFlightGroup);
  } catch (error) {
    console.error('Error creating flight group:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to create flight group',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET request to fetch all flight groups
export async function GET() {
  try {
    const flightGroups = await prisma.FlightGroups.findMany();
    console.log("Flight Groups", flightGroups);
    return NextResponse.json(flightGroups);
  } catch (error) {
    console.error('Error fetching flight groups:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch flight groups',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
