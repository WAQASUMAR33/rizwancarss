import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET method - Retrieve a payment request by ID
export async function GET(request, { params }) {
  const { id } = await params; // Await params for Next.js App Router compatibility

  try {
    // Fetch the payment request by ID from the database
    const paymentRequest = await prisma.paymentRequests.findUnique({
      where: { id: parseInt(id, 10) },
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

    // If the payment request doesn't exist
    if (!paymentRequest) {
      return NextResponse.json(
        { error: "Payment request not found" },
        { status: 404 }
      );
    }

    // Return the found payment request
    return NextResponse.json(paymentRequest, { status: 200 });
  } catch (error) {
    console.error("Error fetching payment request:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment request" },
      { status: 500 }
    );
  }
}

// PUT method - Update a payment request by ID
export async function PUT(request, { params }) {
  const { id } = await params; // Await params for Next.js App Router compatibility

  try {
    const data = await request.json();

    // Validate input data
    if (!id || !data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "Invalid payload", error: true },
        { status: 400 }
      );
    }

    // Fetch the existing payment request
    const paymentRequest = await prisma.paymentRequests.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!paymentRequest) {
      return NextResponse.json(
        { message: "Payment request not found", error: true },
        { status: 404 }
      );
    }

    // Check if already approved
    if (paymentRequest.status === "Approved") {
      return NextResponse.json(
        { message: "Payment is already approved", error: true },
        { status: 400 }
      );
    }

    // Fetch the associated admin
    const admin = await prisma.admin.findUnique({
      where: { id: paymentRequest.admin_id },
    });

    if (!admin) {
      return NextResponse.json(
        { message: "Admin not found", error: true },
        { status: 404 }
      );
    }

    // Calculate new balance if status is being updated to Approved
    let newBalance = admin.balance;
    if (data.status === "Approved" && paymentRequest.status !== "Approved") {
      newBalance = admin.balance - parseFloat(data.amount || paymentRequest.amount);
    }

    // Start a transaction to ensure atomic updates
    const [updatedRequest, updatedAdmin, newLedger] = await prisma.$transaction([
      // Update the payment request
      prisma.paymentRequests.update({
        where: { id: parseInt(id, 10) },
        data: {
          transactionno: data.transactionno || paymentRequest.transactionno,
          img_url: data.img_url || paymentRequest.img_url,
          status: data.status || paymentRequest.status,
          verified_by: data.verified_by || paymentRequest.verified_by,
          amount: parseFloat(data.amount) || paymentRequest.amount,
          updated_at: new Date(),
        },
      }),

      // Update admin balance if approved
      prisma.admin.update({
        where: { id: paymentRequest.admin_id },
        data: { balance: newBalance, updated_at: new Date() },
      }),

      // Create ledger record if status is Approved
      ...(data.status === "Approved" && paymentRequest.status !== "Approved"
        ? [
            prisma.ledger.create({
              data: {
                admin_id: paymentRequest.admin_id,
                credit: parseFloat(data.amount || paymentRequest.amount), // Amount added to balance
                debit: 0.0,
                balance: newBalance,
                description: "Payment Request is approved",
                transaction_at: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json(
      {
        message: `Payment request ${data.status.toLowerCase()} successfully`,
        data: updatedRequest,
        error: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating payment request:", error);
    return NextResponse.json(
      { message: "Failed to update payment request", error: true },
      { status: 500 }
    );
  }
}

// DELETE method - Delete a payment request by ID
export async function DELETE(request, { params }) {
  const { id } = await params; // Await params for Next.js App Router compatibility

  try {
    // Check if the payment request exists
    const paymentRequest = await prisma.paymentRequests.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!paymentRequest) {
      return NextResponse.json(
        { message: "Payment request not found", error: true },
        { status: 404 }
      );
    }

    // Delete the payment request
    await prisma.paymentRequests.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json(
      { message: "Payment request deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting payment request:", error);
    return NextResponse.json(
      { error: "Failed to delete payment request" },
      { status: 500 }
    );
  }
}