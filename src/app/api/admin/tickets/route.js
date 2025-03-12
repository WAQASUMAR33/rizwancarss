import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, amount, image } = body;

    // Validate required fields
    if (!title || !description || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields', status: false },
        { status: 400 }
      );
    }

    // Ensure amount is a valid number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return NextResponse.json(
        { message: 'Invalid amount value', status: false },
        { status: 400 }
      );
    }

    // Create a new ticket in the database
    const newticket = await prisma.tickets.create({
      data: {
        title,
        description,
        amount: numericAmount,
        image: image || null, // Handle optional image
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(newticket);
  } catch (error) {
    console.error('Error creating ticket:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to create ticket',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET request to fetch all tickets
export async function GET() {
  try {
    const tickets = await prisma.tickets.findMany();
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch tickets',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
