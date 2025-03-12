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

    // Create a new package in the database
    const newPackage = await prisma.packages.create({
      data: {
        title,
        description,
        amount: numericAmount,
        image: image || null, // Handle optional image
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(newPackage);
  } catch (error) {
    console.error('Error creating package:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to create package',
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
