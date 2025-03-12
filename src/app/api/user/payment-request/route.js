import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { admin_id, transactionno, amount, img_url, status } = body;

    // Validate required fields
    if (!admin_id || !transactionno || !amount || !img_url || !status) {
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

    // Verify if admin exists (optional but recommended)
    const adminExists = await prisma.admin.findUnique({
      where: { id: admin_id },
    });
    if (!adminExists) {
      return NextResponse.json(
        { message: 'Admin not found', status: false },
        { status: 404 }
      );
    }

    // Create a new payment request in the database
    const newPaymentRequest = await prisma.paymentRequests.create({
      data: {
        admin_id, // Changed from userid to admin_id
        transactionno,
        img_url,
        amount: numericAmount,
        status,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(newPaymentRequest);
  } catch (error) {
    console.error('Error creating payment request:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to create payment request',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET request to fetch all payment requests
export async function GET() {
  try {
    const paymentRequests = await prisma.paymentRequests.findMany({
      include: {
        Admin: {
          select: {
            id: true,
            username: true,
            fullname: true,
          },
        },
      },
    });
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