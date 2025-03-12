import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// POST: Create a new bank account
export async function POST(request) {
  try {
    const body = await request.json();
    const { bank_title, account_title, account_no } = body;

    // Validate required fields
    if (!bank_title || !account_title || !account_no) {
      return NextResponse.json(
        { message: 'Missing required fields', status: false },
        { status: 400 }
      );
    }

    // Ensure account number is valid (basic validation for length or format can be added here if needed)
    if (account_no.length < 5) {
      return NextResponse.json(
        { message: 'Account number is too short', status: false },
        { status: 400 }
      );
    }

    // Create a new bank account in the database
    const newBankAccount = await prisma.bankAccounts.create({
      data: {
        bank_title,
        account_title,
        account_no,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(newBankAccount);
  } catch (error) {
    console.error('Error creating bank account:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to create bank account',
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
