import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function PUT(request, context) {
  const params = await context.params;
  const { id } = params;

  try {
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be 'application/json'" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Received JSON Data for PUT:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!id) throw new Error("Missing transport ID");
    if (!body.paid_status) throw new Error("Missing required field: paid_status");
    if (!body.admin_id) throw new Error("Missing required field: admin_id");

    const transportId = parseInt(id);
    const adminId = parseInt(body.admin_id);

    const result = await prisma.$transaction(async (tx) => {
      // Prepare transport data
      const transportData = {
        date: body.date ? new Date(body.date) : undefined,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        port: body.port || "",
        company: body.company || "",
        v_amount: parseFloat(body.v_amount) || 0,
        v_10per: parseFloat(body.v_10per) || 0,
        v_amount_total: parseFloat(body.v_amount_total) || 0,
        v_amount_total_dollers: parseFloat(body.v_amount_total_dollers) || 0,
        imagePath: body.imagePath || "",
        vehicleNo: body.vehicleNo || "",
        paid_status: body.paid_status,
        admin_id: adminId,
        updatedAt: new Date(),
      };

      // Update transport record
      const updatedTransport = await tx.transport.update({
        where: { id: transportId },
        data: transportData,
        include: { Admin: true },
      });
      console.log("Transport updated:", updatedTransport);

      // Handle payment logic for "Paid" status
      if (body.paid_status.toLowerCase() === "paid") {
        console.log("Processing PAID status for transport:", updatedTransport.id);

        // Fetch admin balance
        const admin = await tx.admin.findUnique({
          where: { id: adminId },
          select: { balance: true },
        });
        if (!admin) throw new Error(`Admin with ID ${adminId} not found`);

        // Deduct v_amount_total_dollers
        const totalDollers = parseFloat(body.v_amount_total_dollers) || 0;
        if (totalDollers < 0) throw new Error("Total dollars cannot be negative");
        const currentBalance = parseFloat(admin.balance) || 0;
        const newBalance = currentBalance - totalDollers;

        // Update admin balance
        await tx.admin.update({
          where: { id: adminId },
          data: { balance: newBalance, updated_at: new Date() },
        });
        console.log(`Admin balance updated to: ${newBalance}`);

        // Create ledger entry
        const ledgerEntry = await tx.ledger.create({
          data: {
            admin_id: adminId,
            debit: 0.0,
            credit: totalDollers,
            balance: newBalance,
            description: `Payment for Transport #${updatedTransport.id} (Vehicle No: ${updatedTransport.vehicleNo || "N/A"})`,
            transaction_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
        console.log("Ledger entry created:", ledgerEntry);
      }

      return { transport: updatedTransport };
    });

    return NextResponse.json(
      {
        message: "Transport updated successfully",
        status: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/admin/transport-management:", error.message);
    return NextResponse.json(
      { message: "Failed to update transport", status: false, error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}