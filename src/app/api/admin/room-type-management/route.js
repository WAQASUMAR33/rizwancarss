import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description} = body;

    // Validate required fields
    if (!title || !description ) {
      return NextResponse.json(
        { message: 'Missing required fields', status: false },
        { status: 400 }
      );
    }

    const roomtype = await prisma.roomType.create({
      data: {
        title,
        description, 
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(roomtype);
  } catch (error) {
    console.error('Error creating hotel:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to create hotel',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET request to fetch all packages
export async function GET() {
  try {
    const roomType = await prisma.roomType.findMany();
    return NextResponse.json(roomType);
  } catch (error) {
    console.error('Error fetching roomType:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch roomType',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
