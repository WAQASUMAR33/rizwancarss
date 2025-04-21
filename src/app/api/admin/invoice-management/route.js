import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  console.log("POST request received at /api/admin/invoice-management");

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

    // Validate required fields based on Invoice model
    if (!body.date) throw new Error("Missing required field: date");
    if (!body.number) throw new Error("Missing required field: number");
    if (!body.added_by) throw new Error("Missing required field: added_by");

    const addedBy = parseInt(body.added_by);

    const result = await prisma.$transaction(async (tx) => {
      console.log("Starting transaction");

      // Create Invoice
      const invoiceData = {
        date: new Date(body.date),
        number: body.number || "",
        status: body.status || "UNPAID",
        auctionHouse: body.auctionHouse || "",
        imagePath: body.imagePath || "",
        amountYen: parseFloat(body.amountYen) || 0,
        amount_doller: parseFloat(body.amount_doller) || 0,
        added_by: addedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const invoice = await tx.invoice.create({ data: invoiceData });
      console.log("Invoice created:", invoice);

      // Create vehicles if provided
      const vehicles = body.vehicles || [];
      const vehicleRecords = await Promise.all(
        vehicles.map(async (vehicle) => {
          if (!vehicle.admin_id) throw new Error(`Missing required field: admin_id for vehicle ${vehicle.chassisNo || 'unknown'}`);

          const vehicleData = {
            invoiceId: invoice.id,
            chassisNo: vehicle.chassisNo || "",
            maker: vehicle.maker || "",
            year: vehicle.year || "",
            color: vehicle.color || "",
            engineType: vehicle.engineType || "",
            auction_amount: parseFloat(vehicle.auction_amount) || 0,
            tenPercentAdd: parseFloat(vehicle.tenPercentAdd) || 0,
            bidAmount: parseFloat(vehicle.bidAmount) || 0,
            bidAmount10per: parseFloat(vehicle.bidAmount10per) || 0,
            recycleAmount: parseFloat(vehicle.recycleAmount) || 0,
            auction_house: vehicle.auction_house || "",
            lotnumber: vehicle.lotnumber || "",
            commissionAmount: parseFloat(vehicle.commissionAmount) || 0,
            numberPlateTax: parseFloat(vehicle.numberPlateTax) || 0,
            repairCharges: parseFloat(vehicle.repairCharges) || 0,
            totalAmount_yen: parseFloat(vehicle.totalAmount_yen) || 0,
            totalAmount_dollers: parseFloat(vehicle.totalAmount_dollers) || 0,
            sendingPort: vehicle.sendingPort ? parseInt(vehicle.sendingPort) : null,
            additionalAmount: parseFloat(vehicle.additionalAmount) || 0,
            isDocumentRequired: vehicle.isDocumentRequired || "",
            documentReceiveDate: vehicle.documentReceiveDate ? new Date(vehicle.documentReceiveDate) : null,
            isOwnership: vehicle.isOwnership || "",
            ownershipDate: vehicle.ownershipDate ? new Date(vehicle.ownershipDate) : null,
            status: vehicle.status || "Pending",
            admin_id: parseInt(vehicle.admin_id),
            added_by: parseInt(vehicle.added_by) || addedBy,
            createdAt: new Date(),
            updatedAt: new Date(),
            vehicleImages: {
              create: (vehicle.vehicleImages || []).map((image) => ({
                imagePath: image,
                createdAt: new Date(),
                updatedAt: new Date(),
              })),
            },
          };

          const vehicleRecord = await tx.addVehicle.create({ data: vehicleData });
          console.log(`Vehicle created: ${vehicleRecord.chassisNo}`);
          return vehicleRecord;
        })
      );

      console.log("Transaction completing");
      return { invoice, vehicles: vehicleRecords };
    });

    console.log("Transaction completed, data saved:", JSON.stringify(result, null, 2));

    return NextResponse.json(
      {
        message: "Invoice created successfully",
        status: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing request:", error.stack || error);
    if (error.code === "P2002" && error.meta?.target?.includes("number")) {
      return NextResponse.json(
        {
          message: "An invoice with this number already exists",
          status: false,
          error: "Duplicate invoice number",
        },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          message: "Invalid admin_id, sendingPort, or other reference: Record not found",
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