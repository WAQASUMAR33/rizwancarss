// GET: Fetch all expenses
import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";


// GET: Fetch all expenses
export async function GET() {
  try {
    const expenses = await prisma.expenses.findMany({
      include: { admin: true }, // Optionally include related Admin data
    });
    console.log("Fetched expenses:", expenses);
    return NextResponse.json(
      { message: "Expenses fetched successfully", status: true, data: expenses },
      { status: 200 }
    );
  } catch (error) {
   
    return NextResponse.json(
      { error: "Internal server error", status: false, details: error.message },
      { status: 500 }
    );
  }
}


// POST: Create a new expense, update admin balance, and create ledger entry
export async function POST(request) {
  try {
    const data = await request.json();
    console.log("Received data:", JSON.stringify(data, null, 2));

    const { adminId, expense_title, expense_description, imagePath, amount, added_by } = data;

    if (!expense_title || amount === undefined || !added_by) {
      return NextResponse.json(
        { error: "Missing required fields (expense_title, amount, added_by)", status: false },
        { status: 400 }
      );
    }

    const parsedAdminId = adminId !== undefined ? parseInt(adminId) : 0;
    const parsedAmount = parseFloat(amount);
    const parsedAddedBy = parseInt(added_by);

    // Fetch admin
    const admin = await prisma.admin.findUnique({
      where: { id: parsedAdminId },
      select: { balance: true },
    });
    if (!admin) throw new Error(`Admin with ID ${parsedAdminId} not found`);

    const addedByAdmin = await prisma.admin.findUnique({
      where: { id: parsedAddedBy },
    });
    if (!addedByAdmin) throw new Error(`Admin with ID ${parsedAddedBy} (added_by) not found`);

    const oldBalance = admin.balance;
    const newBalance = oldBalance - parsedAmount;

    // Update balance
    await prisma.admin.update({
      where: { id: parsedAdminId },
      data: { balance: newBalance },
    });

    // Create expense
    const expense = await prisma.expenses.create({
      data: {
        adminId: parsedAdminId,
        expense_title,
        expense_description: expense_description || "",
        imagePath: imagePath || "",
        amount: parsedAmount,
        added_by: parsedAddedBy,
      },
    });

    // Create ledger entry
    const ledgerEntry = await prisma.ledger.create({
      data: {
        admin_id: parsedAdminId,
        debit: 0.0,
        credit: parsedAmount,
        balance: newBalance,
        description: `Expense: ${expense_title}`,
        transaction_at: new Date(),
      },
    });

    console.log("Created expense:", expense);
    console.log("Created ledger entry:", ledgerEntry);
    return NextResponse.json(
      { message: "Expense created successfully", status: true, data: expense },
      { status: 201 }
    );
  } catch (error) {
    // console.error("Error creating expense:", {
    //   message: error.message,
    //   stack: error.stack,
    //   data: JSON.stringify(data, null, 2),
    //   prismaCode: error.code,
    // });
    return NextResponse.json(
      { error: "Internal server error", status: false, details: error.message },
      { status: 500 }
    );
  }
}