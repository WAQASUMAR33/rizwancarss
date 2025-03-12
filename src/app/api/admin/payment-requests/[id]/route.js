import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET method - Retrieve a payment request by ID
export async function GET(request, { params }) {
  try {
    const id = params.id;

    // Fetch the payment request by ID from the database
    const paymentRequest = await prisma.paymentRequests.findUnique({
      where: { id },
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

    // Return an error response
    return NextResponse.json(
      { error: "Failed to fetch payment request" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
    try {
      const { id } = params; // Correct destructuring
  
      // Parse the request body
      const data = await request.json();
  
      // Validate input data
      if (!data || Object.keys(data).length === 0) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }
  
      // Validate id
      if (!id) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
      }
  
      // Update the payment request in the database
      const response = await prisma.paymentRequests.update({
        where: { id: parseInt(id, 10) }, // Ensure `id` is a number
        data: {
          userid: parseInt(data.userid),
          transactionno: data.transactionno,
          img_url: data.img_url,
          status: data.status,
          verified_by: data.verified_by,
          amount: data.amount,
        },
      });
  
      // Return the updated record
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error("Error updating payment request:", error);
  
      // Return an error response
      return NextResponse.json(
        { error: "Failed to update payment request" },
        { status: 500 }
      );
    }
  }
  
  

// DELETE method - Delete a payment request by ID
export async function DELETE(request, { params }) {
  try {
    const id = params.id;
    console.log("ID",id);
    const response = await prisma.paymentRequests.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: "Payment request deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting payment request:", error);

    // Return an error response
    return NextResponse.json(
      { error: "Failed to delete payment request" },
      { status: 500 }
    );
  }
}
