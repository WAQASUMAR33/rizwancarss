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

    // Update the package in the database
    const updatedPackage = await prisma.packages.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error('Error updating package:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to update package',
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
    const packages = await prisma.packages.findMany();
    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch packages',
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
  
      // Check if the package exists
      const existingPackage = await prisma.packages.findUnique({
        where: { id: parseInt(id, 10) }, // Ensure id is an integer
      });
  
      if (!existingPackage) {
        return NextResponse.json(
          {
            message: 'Package not found',
            status: false,
          },
          { status: 404 }
        );
      }
  
      // Delete the package
      await prisma.packages.delete({
        where: { id: parseInt(id, 10) },
      });
  
      return NextResponse.json(
        {
          message: 'Package deleted successfully',
          status: true,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error deleting package:', error.message);
      return NextResponse.json(
        {
          message: 'Failed to delete package',
          status: false,
          error: error.message,
        },
        { status: 500 }
      );
    }
  }