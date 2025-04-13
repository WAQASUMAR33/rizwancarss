import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';



export async function GET(request, { params }) {
  const { id } = params; // Extract the id from the slug

  try {
    // Fetch the invoice from the database using Prisma
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) }, // Convert id to integer
      include: {
        vehicles: {
          include: {
            seaPort: true, // Include related SeaPort data
            admin: true,   // Include related Admin data
            vehicleImages: true, // Include related VehicleImage data
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Return the invoice data
    return NextResponse.json(
      { data: invoice },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client
  }
}



export async function PUT(request, { params }) {
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
    if (!body.date) throw new Error("Missing required field: date");
    if (!body.number) throw new Error("Missing required field: number");
    if (!body.status) throw new Error("Missing required field: status");
    if (!body.added_by) throw new Error("Missing required field: added_by");

    const addedBy = parseInt(body.added_by);

    const result = await prisma.$transaction(async (tx) => {
      // Update Invoice
      const invoiceData = {
        date: new Date(body.date),
        number: body.number,
        status: body.status,
        auctionHouse: body.auctionHouse || "",
        imagePath: body.imagePath || "",
        amountYen: parseFloat(body.amountYen) || 0,
        amount_doller: parseFloat(body.amount_doller) || 0,
        added_by: addedBy,
      };

      const updatedInvoice = await tx.invoice.update({
        where: { id: parseInt(id) },
        data: invoiceData,
      });
      console.log("Invoice updated:", updatedInvoice);

      // Update or Create Vehicles
      const existingVehicles = await tx.addVehicle.findMany({
        where: { invoiceId: parseInt(id) },
      });

      const vehicleDataList = (body.vehicles || []).map((vehicle) => ({
        id: vehicle.id ? parseInt(vehicle.id) : undefined, // For existing vehicles
        invoiceId: parseInt(id),
        chassisNo: vehicle.chassisNo || "",
        maker: vehicle.maker || "",
        year: vehicle.year || "",
        color: vehicle.color || "",
        lotnumber: vehicle.lotnumber || "",
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

      // Handle vehicle updates or creations
      const updatedVehicles = [];
      for (const vehicleData of vehicleDataList) {
        if (vehicleData.id && existingVehicles.some((v) => v.id === vehicleData.id)) {
          // Update existing vehicle
          const updatedVehicle = await tx.addVehicle.update({
            where: { id: vehicleData.id },
            data: { ...vehicleData, id: undefined }, // Remove id from data to avoid conflict
          });
          updatedVehicles.push(updatedVehicle);
          console.log(`Vehicle ${vehicleData.id} updated:`, updatedVehicle);
        } else {
          // Create new vehicle if no ID or not found
          const newVehicle = await tx.addVehicle.create({ data: vehicleData });
          updatedVehicles.push(newVehicle);
          console.log(`New vehicle created:`, newVehicle);
        }
      }

      // Handle Payment Logic if Status is PAID
      if (body.status === "PAID") {
        console.log("Processing PAID status for invoice:", updatedInvoice.id);

        // Fetch admin with ID 1
        const admin = await tx.admin.findUnique({
          where: { id: 1 },
          select: { balance: true },
        });
        if (!admin) throw new Error("Admin with ID 1 not found");

        let currentBalance = admin.balance || 0;

        // Process each vehicle's amount
        for (const vehicle of updatedVehicles) {
          const vehicleAmount = parseFloat(vehicle.totalAmount_dollers) || 0;
          if (vehicleAmount > 0) {
            currentBalance -= vehicleAmount;

            // Create ledger entry for this vehicle
            const ledgerEntry = await tx.ledger.create({
              data: {
                admin_id: 1,
                debit: 0.0,
                credit: vehicleAmount,
                balance: currentBalance,
                description: `Payment for Vehicle #${vehicle.id} (Invoice #${updatedInvoice.number})`,
                transaction_at: new Date(),
              },
            });
            console.log(`Ledger entry created for vehicle ${vehicle.id}:`, ledgerEntry);
          }
        }

        // Update admin balance
        await tx.admin.update({
          where: { id: 1 },
          data: { balance: currentBalance },
        });
        console.log(`Admin balance updated to: ${currentBalance}`);
      }

      return { invoice: updatedInvoice, vehicles: updatedVehicles };
    });

    return NextResponse.json(
      {
        message: "Invoice and vehicles updated successfully",
        status: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating invoice:", error);
    if (error.code === "P2002" && error.meta?.target?.includes("number")) {
      return NextResponse.json(
        { message: "An invoice with this number already exists", status: false, error: "Duplicate invoice number" },
        { status: 400 }
      );
    }
    if (error.code === "P2002" && error.meta?.target?.includes("chassisNo")) {
      return NextResponse.json(
        { message: "A vehicle with this chassis number already exists", status: false, error: "Duplicate chassis number" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Failed to update invoice", status: false, error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}