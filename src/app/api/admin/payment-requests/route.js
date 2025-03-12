import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Payload ", body);

    const { admin_id, transactionno, amount, img_url, status, verified_by } = body;

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

    // Ensure admin_id is a valid integer
    const numericAdminId = parseInt(admin_id);
    if (isNaN(numericAdminId)) {
      return NextResponse.json(
        { message: 'Invalid admin_id value', status: false },
        { status: 400 }
      );
    }

    // Create a new payment request in the database
    const newPaymentRequest = await prisma.paymentRequests.create({
      data: {
        admin_id: numericAdminId,
        transactionno,
        img_url,
        amount: numericAmount,
        status,
        verified_by,
      },
    });

    return NextResponse.json(
      {
        message: 'Payment request created successfully',
        status: true,
        data: newPaymentRequest,
      },
      { status: 201 }
    );
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
            fullname: true,
            username: true,
            role: true,
            balance: true,
          },
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    return NextResponse.json(
      {
        message: 'Payment requests fetched successfully',
        status: true,
        data: paymentRequests,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching payment requests:', error);
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