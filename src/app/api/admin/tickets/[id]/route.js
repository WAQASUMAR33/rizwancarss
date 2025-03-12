import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function PUT(request) {
  try {
    const body = await request.json();
    console.log("Payload is:", body);

    const { id, title, description, amount, image } = body;

    // Validate required fields
    if (!id || !title || !description || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields', status: false },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return NextResponse.json(
        { message: 'Invalid amount value', status: false },
        { status: 400 }
      );
    }

    // Construct the data object conditionally
    const updateData = {
      title,
      description,
      amount: numericAmount,
      updated_at: new Date(),
    };

    // Add image to the update data only if it exists in the request
    if (image) {
      updateData.image = image;
    }

    // Update the ticket in the database
    const updatedticket = await prisma.tickets.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedticket);
  } catch (error) {
    console.error('Error updating ticket:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to update ticket',
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

export async function DELETE(req,{params}) {
    try {
        const { id } = params;
  
      // Check if the ticket exists
      const existingticket = await prisma.tickets.findUnique({
        where: { id: parseInt(id, 10) }, // Ensure id is an integer
      });
  
      if (!existingticket) {
        return NextResponse.json(
          {
            message: 'ticket not found',
            status: false,
          },
          { status: 404 }
        );
      }
  
      // Delete the ticket
      await prisma.tickets.delete({
        where: { id: parseInt(id, 10) },
      });
  
      return NextResponse.json(
        {
          message: 'ticket deleted successfully',
          status: true,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error deleting ticket:', error.message);
      return NextResponse.json(
        {
          message: 'Failed to delete ticket',
          status: false,
          error: error.message,
        },
        { status: 500 }
      );
    }
  }