import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  console.log("POST request received at /api/admin/inspection");

  try {
    const contentType = request.headers.get("Content-Type") || "";
    console.log("Content-Type received:", contentType);

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          message: "Failed to process request",
          status: false,
          error: "Content-Type must be 'application/json'",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Received JSON Data:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.date) throw new Error("Missing required field: date");
    if (!body.company) throw new Error("Missing required field: company");
    if (!body.invoiceno) throw new Error("Missing required field: invoiceno");
    if (!body.admin_id) throw new Error("Missing required field: admin_id");

    const adminId = parseInt(body.admin_id);

    const result = await prisma.$transaction(
      async (tx) => {
        console.log("Starting transaction");

        // Create inspection
        const inspectionData = {
          date: new Date(body.date),
          company: body.company || "",
          vehicleNo: body.vehicleNo || "",
          invoiceno: body.invoiceno || "",
          invoice_amount: parseFloat(body.invoice_amount) || 0,
          invoice_tax: parseFloat(body.invoice_tax) || 0,
          invoice_total: parseFloat(body.invoice_total) || 0,
          invoice_amount_dollers: parseFloat(body.invoice_amount_dollers) || 0,
          vamount_doller: parseFloat(body.vamount_doller) || 0,
          imagePath: body.imagePath || "",
          paid_status: body.paid_status || "UnPaid",
          admin_id: adminId,
          createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
          updatedAt: body.updatedAt ? new Date(body.updatedAt) : new Date(),
        };

        const inspection = await tx.inspection.create({ data: inspectionData });
        console.log("Inspection created:", inspection);

        // Update vehicle statuses if provided
        const vehicleUpdates = (body.vehicles || []).map((vehicle) => ({
          id: parseInt(vehicle.id),
        }));

        for (const vehicle of vehicleUpdates) {
          if (!vehicle.id) throw new Error("Missing required field: vehicle.id");
          await tx.addVehicle.update({
            where: { id: vehicle.id },
            data: { status: "Inspection" },
          });
          console.log(`Vehicle ID ${vehicle.id} status updated to Inspection`);
        }

        // Payment logic for paid_status: "Paid"
        if (inspection.paid_status === "Paid") {
          console.log("Processing Paid status");
          const admin = await tx.admin.findUnique({
            where: { id: 1 },
            select: { balance: true },
          });
          if (!admin) throw new Error("Admin with ID 1 not found");

          const currentBalance = admin.balance || 0;
          const invoiceAmount = parseFloat(body.invoice_amount_dollers) || 0;
          const newBalance = currentBalance - invoiceAmount;

          // Optional: Uncomment to enforce positive balance
          // if (newBalance < 0) {
          //   throw new Error("Insufficient admin balance for this transaction");
          // }

          const ledgerEntry = await tx.ledger.create({
            data: {
              admin_id: 1,
              debit: 0.0,
              credit: invoiceAmount,
              balance: newBalance,
              description: `Payment for Inspection #${inspection.invoiceno}`,
              transaction_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
          console.log("Ledger entry created:", ledgerEntry);

          await tx.admin.update({
            where: { id: 1 },
            data: { balance: newBalance },
          });
          console.log(`Admin ID 1 balance updated to: ${newBalance}`);
        }

        console.log("Transaction completing");
        return { inspection, vehicles: vehicleUpdates };
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    console.log("Transaction completed, data saved:", JSON.stringify(result, null, 2));

    return NextResponse.json(
      {
        message: "Inspection created successfully",
        status: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing request:", error.stack || error);
    if (error.code === "P2002" && error.meta?.target?.includes("invoiceno")) {
      return NextResponse.json(
        {
          message: "An inspection with this invoice number already exists",
          status: false,
          error: "Duplicate invoice number",
        },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          message: "Invalid admin_id or vehicle ID: Record not found",
          status: false,
          error: error.message,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        message: "Unexpected server error occurred",
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    console.log("Disconnecting Prisma client");
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    console.log("Fetching invoices with related vehicles and images...");

    // Fetch all invoices with their related vehicles and images
    const invoices = await prisma.invoice.findMany({
      include: {
        vehicles: {
          include: {
            vehicleImages: true,
            admin: true,
            seaPort: true,
          },
        },
      },
    });

    console.log("Fetched data:", JSON.stringify(invoices, null, 2));

    return NextResponse.json({
      message: "Invoices fetched successfully",
      status: true,
      data: invoices,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoices:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      {
        message: 'Failed to fetch invoices',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}