// app/api/admin/invoice-management/VehicleSearch/[chassisno]/route.js

import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function GET(request, { params }) {
  try {
    const chassisno = params.chassisno;
    console.log('Received chassisno:', chassisno);

    if (!chassisno) {
      return NextResponse.json(
        { error: 'Chassis number is required', status: false },
        { status: 400 }
      );
    }

    console.log('Querying database for chassisno:', chassisno);
    const vehicle = await prisma.addVehicle.findFirst({
      where: {
        chassisNo: {
          equals: chassisno
        },
      },
      select: {
        id: true,
        chassisNo: true,
        maker: true,
        year: true,
        status:true,
        color: true,
        engineType: true,
      },
    });


    if (!vehicle) {
      return NextResponse.json(
        { message: 'Vehicle not found', status: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Vehicle fetched successfully',
      status: true,
      data: vehicle,
    });
  } catch (error) {
  
    return NextResponse.json(
      {
        error: 'Internal server error',
        status: false,
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}