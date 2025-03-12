// app/api/transport/route.js

import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Received data:', data); // Log incoming data for debugging

   

    return NextResponse.json(
      {
        message: 'Transport created successfully',
        status: true,
        data: transport,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating transport:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        status: false,
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}