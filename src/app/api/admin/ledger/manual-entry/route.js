import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Parse JSON payload from the request body
    const data = await request.json();
    console.log("Payload is: ", data);

    // Validate required fields
    if (
      !data.agent_id ||
      typeof data.description !== "string" ||
      typeof data.amount_in !== "number" ||
      typeof data.amount_out !== "number" ||
      typeof data.balance !== "number" ||
      typeof data.type !== "string"
    ) {
      return NextResponse.json({ message: "Invalid input data", status: 400 });
    }

    // Create a new ledger entry in the database
    const entry = await prisma.newLedger.create({
      data: {
        agent_id: data.agent_id,
        description: data.description,
        amount_in: data.amount_in,
        amount_out: data.amount_out,
        balance: data.balance,
        type: data.type,
      },
    });

    // Return a success response with the created entry
    return NextResponse.json({ message: "Entry created successfully", entry, status: 201 });
  } catch (e) {
    console.error("Error occurred:", e.message);

    // Handle specific Prisma errors or fallback to a generic error
    return NextResponse.json({ message: "An error occurred", error: e.message, status: 500 });
  }
}
