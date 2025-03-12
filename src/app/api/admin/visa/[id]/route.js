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

    // Update the visa in the database
    const updatedvisa = await prisma.visa.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedvisa);
  } catch (error) {
    console.error('Error updating visa:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to update visa',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET request to fetch all visa
export async function GET() {
  try {
    const visa = await prisma.visa.findMany();
    return NextResponse.json(visa);
  } catch (error) {
    console.error('Error fetching visa:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch visa',
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
  
      // Check if the visa exists
      const existingvisa = await prisma.visa.findUnique({
        where: { id: parseInt(id, 10) }, // Ensure id is an integer
      });
  
      if (!existingvisa) {
        return NextResponse.json(
          {
            message: 'visa not found',
            status: false,
          },
          { status: 404 }
        );
      }
  
      // Delete the visa
      await prisma.visa.delete({
        where: { id: parseInt(id, 10) },
      });
  
      return NextResponse.json(
        {
          message: 'visa deleted successfully',
          status: true,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error deleting visa:', error.message);
      return NextResponse.json(
        {
          message: 'Failed to delete visa',
          status: false,
          error: error.message,
        },
        { status: 500 }
      );
    }
  }