import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prisma';

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

    // Validate required fields for invoice
    if (!body.date) throw new Error("Missing required field: date");
    if (!body.number) throw new Error("Missing required field: number");
    if (!body.status) throw new Error("Missing required field: status");
    if (!body.added_by) throw new Error("Missing required field: added_by");

    const addedBy = parseInt(body.added_by);

    // Create invoice first (outside transaction if needed, but we'll keep it in for now)
    const result = await prisma.$transaction(
      async (tx) => {
        console.log("Starting transaction");

        // Create invoice
        const invoiceData = {
          date: new Date(body.date),
          number: parseInt(body.number, 10),
          status: body.status || "UNPAID",
          auctionHouse: body.auctionHouse || "",
          imagePath: body.imagePath || "",
          amountYen: parseFloat(body.amountYen) || 0,
          amount_doller: parseFloat(body.amount_doller) || 0,
          added_by: addedBy,
        };
        const invoice = await tx.invoice.create({ data: invoiceData });
        console.log("Invoice created:", invoice);

        // Prepare vehicle data
        const vehicleDataList = (body.vehicles || []).map((vehicle) => ({
          invoiceId: invoice.id,
          chassisNo: vehicle.chassisNo || "",
          maker: vehicle.maker || "",
          year: vehicle.year || "",
          color: vehicle.color || "",
          engineType: vehicle.engineType || "",
          auction_amount: parseFloat(vehicle.auction_amount) || 0,
          tenPercentAdd: parseFloat(vehicle.tenPercentAdd) || 0,
          recycleAmount: parseFloat(vehicle.recycleAmount) || 0,
          auction_house: vehicle.auction_house || "",
          bidAmount: parseFloat(vehicle.bidAmount) || 0,
          bidAmount10per: parseFloat(vehicle.bidAmount10per) || 0,
          commissionAmount: parseFloat(vehicle.commissionAmount) || 0,
          numberPlateTax: parseFloat(vehicle.numberPlateTax) || 0,
          repairCharges: parseFloat(vehicle.repairCharges) || 0,
          totalAmount_yen: parseFloat(vehicle.totalAmount_yen) || 0,
          totalAmount_dollers: parseFloat(vehicle.totalAmount_dollers) || 0,
          sendingPort: vehicle.sendingPort ? parseInt(vehicle.sendingPort, 10) : null,
          additionalAmount: parseFloat(vehicle.additionalAmount) || 0,
          isDocumentRequired: vehicle.isDocumentRequired || "no",
          documentReceiveDate: vehicle.documentReceiveDate ? new Date(vehicle.documentReceiveDate) : null,
          isOwnership: vehicle.isOwnership || "no",
          ownershipDate: vehicle.ownershipDate ? new Date(vehicle.ownershipDate) : null,
          status: vehicle.status || "Pending",
          admin_id: vehicle.admin_id ? parseInt(vehicle.admin_id, 10) : addedBy,
          added_by: addedBy,
        }));

        // Validate vehicle data
        vehicleDataList.forEach((vehicle, index) => {
          if (!vehicle.chassisNo) throw new Error(`Missing required field: chassisNo for vehicle at index ${index}`);
          if (!vehicle.admin_id) throw new Error(`Missing required field: admin_id for vehicle at index ${index}`);
        });

        // Create vehicles and images sequentially
        const createdVehicles = [];
        for (let index = 0; index < vehicleDataList.length; index++) {
          const data = vehicleDataList[index];
          const vehicle = await tx.addVehicle.create({ data });
          console.log(`Vehicle ${index} created:`, vehicle);

          const vehicleImages = body.vehicles[index]?.vehicleImages || [];
          if (vehicleImages.length > 0) {
            console.log(`Preparing to create images for vehicle ${index}`);
            try {
              await tx.vehicleImage.createMany({
                data: vehicleImages.map((imagePath) => ({
                  addVehicleId: vehicle.id,
                  imagePath: imagePath,
                })),
                skipDuplicates: true,
              });
              console.log(`Vehicle ${index} images created:`, vehicleImages);
            } catch (imageError) {
              console.error(`Error creating images for vehicle ${index}:`, imageError);
              throw new Error(`Failed to create vehicle images: ${imageError.message}`);
            }
          }
          createdVehicles.push(vehicle);
        }

        // Payment logic for PAID status
        if (body.status === "PAID") {
          console.log("Processing PAID status");
          const admin = await tx.admin.findUnique({
            where: { id: addedBy },
            select: { balance: true },
          });
          if (!admin) throw new Error(`Admin with ID ${addedBy} not found`);

          const currentBalance = admin.balance || 0;
          const invoiceAmount = parseFloat(body.amount_doller) || 0;
          const newBalance = currentBalance - invoiceAmount;

          // if (newBalance < 0) {
          //   throw new Error("Insufficient admin balance for this transaction");
          // }

          const ledgerEntry = await tx.ledger.create({
            data: {
              admin_id: addedBy,
              debit: invoiceAmount,
              credit: 0,
              balance: newBalance,
              description: `Payment for Invoice #${invoice.number}`,
              transaction_at: new Date(),
            },
          });
          console.log("Ledger entry created:", ledgerEntry);

          await tx.admin.update({
            where: { id: addedBy },
            data: { balance: newBalance },
          });
          console.log(`Admin balance updated to: ${newBalance}`);
        }

        console.log("Transaction completing");
        return { invoice, vehicles: createdVehicles };
      },
      {
        maxWait: 10000, // Increased to 10 seconds
        timeout: 30000, // Increased to 30 seconds
      }
    );

    console.log("Transaction completed, data saved:", JSON.stringify(result, null, 2));

    return NextResponse.json(
      {
        message: "Invoice and vehicles created successfully",
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
    if (error.code === "P2002" && error.meta?.target?.includes("chassisNo")) {
      return NextResponse.json(
        {
          message: "A vehicle with this chassis number already exists",
          status: false,
          error: "Duplicate chassis number",
        },
        { status: 400 }
      );
    }
    if (error.code === "P2025" && error.meta?.cause?.includes("Record to connect not found")) {
      return NextResponse.json(
        {
          message: "Invalid sendingPort or admin_id: Related record not found",
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