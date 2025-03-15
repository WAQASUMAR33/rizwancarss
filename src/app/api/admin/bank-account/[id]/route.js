import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// PUT: Update a bank account
export async function PUT(request) {
  try {
    const body = await request.json();
    console.log("Payload is:", body);

    const { id, bank_title, account_title, account_no, banno, swiftcode } = body;

    // Validate required fields
    if (!id || !bank_title || !account_title || !account_no) {
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

    // Check if the bank account exists
    const existingAccount = await prisma.bankAccounts.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!existingAccount) {
      return NextResponse.json(
        { message: "Bank account not found", status: false },
        { status: 404 }
      );
    }

    // Construct the data object for update
    const updateData = {
      bank_title,
      account_title,
      account_no,
      banno: banno || "", // Default to empty string if not provided
      swiftcode: swiftcode || "", // Default to empty string if not provided
    };

    // Update the bank account in the database
    const updatedBankAccount = await prisma.bankAccounts.update({
      where: { id: parseInt(id, 10) }, // Ensure id is an integer
      data: updateData,
    });

    return NextResponse.json(
      {
        message: "Bank account updated successfully",
        status: true,
        data: updatedBankAccount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating bank account:", error.message);
    return NextResponse.json(
      {
        message: "Failed to update bank account",
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE: Delete a bank account
export async function DELETE(request) {
  try {
    // Extract id from the URL query or body (depending on how it's passed)
    const url = new URL(request.url);
    const id = url.searchParams.get("id"); // For query params: /api/admin/bank-account?id=1
    // Alternatively, if passed in the body:
    // const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "Missing bank account ID", status: false },
        { status: 400 }
      );
    }

    // Check if the bank account exists
    const existingBankAccount = await prisma.bankAccounts.findUnique({
      where: { id: parseInt(id, 10) }, // Ensure id is an integer
    });

    if (!existingBankAccount) {
      return NextResponse.json(
        {
          message: "Bank account not found",
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
        message: "Bank account deleted successfully",
        status: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting bank account:", error.message);
    return NextResponse.json(
      {
        message: "Failed to delete bank account",
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}