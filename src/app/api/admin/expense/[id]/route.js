// app/api/admin/expenses/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// PUT: Update an existing expense
export async function PUT(request) {
  try {
    const data = await request.json();
    console.log("Received data for update:", JSON.stringify(data, null, 2));

    const { id, adminId, expense_title, expense_description, imagePath, amount, added_by } = data;

    // Validation for required fields
    if (!id) {
      return NextResponse.json(
        { error: "Missing required field (id)", status: false },
        { status: 400 }
      );
    }
    if (!expense_title || amount === undefined || !added_by) {
      return NextResponse.json(
        { error: "Missing required fields (expense_title, amount, added_by)", status: false },
        { status: 400 }
      );
    }

    const expense = await prisma.expenses.update({
      where: { id: parseInt(id) },
      data: {
        adminId: adminId !== undefined ? parseInt(adminId) : 0, // Use provided adminId or default to 0
        expense_title,
        expense_description: expense_description || "",
        imagePath: imagePath || "",
        amount: parseFloat(amount),
        added_by: parseInt(added_by),
      },
    });

    console.log("Updated expense:", expense);
    return NextResponse.json(
      { message: "Expense updated successfully", status: true, data: expense },
      { status: 200 }
    );
  } catch (error) {
    
    return NextResponse.json(
      { error: "Internal server error", status: false, details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete an expense
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop(); // Extract ID from URL (e.g., /api/admin/expense/1)
    console.log("Received ID for deletion:", id);

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Missing or invalid required field (id)", status: false },
        { status: 400 }
      );
    }

    await prisma.expenses.delete({
      where: { id: parseInt(id) },
    });

    console.log("Deleted expense with ID:", id);
    return NextResponse.json(
      { message: "Expense deleted successfully", status: true },
      { status: 200 }
    );
  } catch (error) {
   
    return NextResponse.json(
      { error: "Internal server error", status: false, details: error.message },
      { status: 500 }
    );
  }
}



export async function GET(request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop(); // Extract ID from URL if present (e.g., /api/admin/expense/1)

    if (id && !isNaN(parseInt(id))) {
      // Fetch single expense by ID
      const expense = await prisma.expenses.findUnique({
        where: { id: parseInt(id) },
        include: { admin: true }, // Optionally include related Admin data
      });

      if (!expense) {
        return NextResponse.json(
          { error: "Expense not found", status: false },
          { status: 404 }
        );
      }

     
      return NextResponse.json(
        { message: "Expense fetched successfully", status: true, data: expense },
        { status: 200 }
      );
    } else {
      // Fetch all expenses
      const expenses = await prisma.expenses.findMany({
        include: { admin: true }, // Optionally include related Admin data
      });
      console.log("Fetched expenses:", expenses);
      return NextResponse.json(
        { message: "Expenses fetched successfully", status: true, data: expenses },
        { status: 200 }
      );
    }
  } catch (error) {
    
    return NextResponse.json(
      { error: "Internal server error", status: false, details: error.message },
      { status: 500 }
    );
  }
}