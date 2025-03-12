import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// PUT: Update a bank account
export async function PUT(request) {
  try {
    const body = await request.json();
    console.log("Payload is:", body);

    const { id, bank_title, account_title, account_no } = body;

    // Validate required fields
    if (!id || !bank_title || !account_title || !account_no) {
      return NextResponse.json(
        { message: 'Missing required fields', status: false },
        { status: 400 }
      );
    }

    // Construct the data object conditionally
    const updateData = {
      bank_title,
      account_title,
      account_no,
      updated_at: new Date(),
    };

    // Update the bank account in the database
    const updatedBankAccount = await prisma.bankAccounts.update({
      where: { id: parseInt(id, 10) }, // Ensure id is an integer
      data: updateData,
    });

    return NextResponse.json(updatedBankAccount);
  } catch (error) {
    console.error('Error updating bank account:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to update bank account',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET: Fetch all bank accounts
export async function GET() {
  try {
    const bankAccounts = await prisma.bankAccounts.findMany();
    return NextResponse.json(bankAccounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch bank accounts',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete a bank account
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Check if the bank account exists
    const existingBankAccount = await prisma.bankAccounts.findUnique({
      where: { id: parseInt(id, 10) }, // Ensure id is an integer
    });

    if (!existingBankAccount) {
      return NextResponse.json(
        {
          message: 'Bank account not found',
          status: false,
        },
        { status: 404 }
      );
    }

    // Delete the bank account
    await prisma.bankAccounts.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json(
      {
        message: 'Bank account deleted successfully',
        status: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting bank account:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to delete bank account',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
