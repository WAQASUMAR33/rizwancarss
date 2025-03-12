// fligh-groups/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const flightGroup = await prisma.FlightSector.findUnique({
      where: { id: parseInt(id) },
    });

    if (!flightGroup) {
      return NextResponse.json(
        { message: 'Flight group not found', status: false },
        { status: 404 }
      );
    }

    return NextResponse.json(flightGroup);
  } catch (error) {
    console.error('Error fetching flight group:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch flight group',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const updatedFlightGroup = await prisma.FlightSector.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updatedFlightGroup);
  } catch (error) {
    console.error('Error updating flight group:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to update flight group',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    await prisma.FlightSector.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Flight group deleted successfully', status: true });
  } catch (error) {
    console.error('Error deleting flight group:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to delete flight group',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
