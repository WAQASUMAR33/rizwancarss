import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// POST: Create a new bank account
export async function POST(request) {
  try {
    const body = await request.json();
    const { bank_title, account_title, account_no, banno, swiftcode } = body;

    // Validate required fields
    if (!bank_title || !account_title || !account_no) {
      return NextResponse.json(
        { message: "Missing required fields", status: false },
        { status: 400 }
      );
    }

    // Ensure account number is valid (basic validation for length or format)
    if (account_no.length < 5) {
      return NextResponse.json(
        { message: "Account number is too short", status: false },
        { status: 400 }
      );
    }

    // Create a new bank account in the database
    const newBankAccount = await prisma.bankAccounts.create({
      data: {
        bank_title,
        account_title,
        account_no,
        banno: banno || "", // Default to empty string if not provided
        swiftcode: swiftcode || "", // Default to empty string if not provided
      },
    });

    return NextResponse.json(
      {
        message: "Bank account created successfully",
        status: true,
        data: newBankAccount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bank account:", error.message);
    return NextResponse.json(
      {
        message: "Failed to create bank account",
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
    const bankAccounts = await prisma.bankAccounts.findMany({
      orderBy: { created_at: "desc" }, // Optional: Order by creation date
    });
    return NextResponse.json(
      {
        message: "Bank accounts fetched successfully",
        status: true,
        data: bankAccounts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching bank accounts:", error.message);
    return NextResponse.json(
      {
        message: "Failed to fetch bank accounts",
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}