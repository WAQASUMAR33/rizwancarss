import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// GET request to fetch all payment requests for a specific admin
export async function GET(request, { params }) {
  const { id } = await params; // Await params and destructure id
  console.log("id:", id);

  try {
    // Validate that id is provided and is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { message: 'Invalid or missing admin ID', status: false },
        { status: 400 }
      );
    }

    // Fetch payment requests where admin_id matches the provided id
    const paymentRequests = await prisma.paymentRequests.findMany({
      where: {
        admin_id: parseInt(id), // Changed from userid to admin_id
      },
      include: {
        Admin: {
          select: {
            id: true,
            username: true,
            fullname: true,
            role: true, // Optional: Include additional admin fields
          },
        },
      },
    });

    // Check if any payment requests were found
    if (paymentRequests.length === 0) {
      return NextResponse.json(
        { message: 'No payment requests found for this admin', status: false },
        { status: 404 }
      );
    }

    return NextResponse.json(paymentRequests);
  } catch (error) {
    console.error('Error fetching payment requests:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch payment requests',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}