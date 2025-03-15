import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function POST(request) {
  try {
    const data = await request.json();

    // Checkpoint 1: Log incoming data
    console.log("Checkpoint 1 - Received data:", JSON.stringify(data, null, 2));

    // Checkpoint 2: Validate required fields
    const requiredFields = ["admin_id", "vehicleNo", "date", "sale_price"];
    for (const field of requiredFields) {
      if (!data[field]) {
        console.error(`Checkpoint 2 - Validation failed: Missing field ${field}`);
        return NextResponse.json(
          { message: `Missing required field: ${field}`, error: true },
          { status: 400 }
        );
      }
    }

    // Checkpoint 3: Fetch and validate admin
    const adminId = parseInt(data.admin_id);
    console.log("Checkpoint 3 - Fetching admin with ID:", adminId);
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, balance: true },
    });
    if (!admin) {
      console.error("Checkpoint 3 - Admin not found for ID:", adminId);
      return NextResponse.json(
        { message: "Admin not found", error: true },
        { status: 404 }
      );
    }
    console.log("Checkpoint 3 - Admin found:", admin);

    // Checkpoint 4: Fetch and validate vehicle
    const vehicleId = parseInt(data.vehicleNo);
    console.log("Checkpoint 4 - Fetching vehicle with vehicleNo (ID):", vehicleId);
    const vehicle = await prisma.addVehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      console.error("Checkpoint 4 - Vehicle not found for vehicleNo:", vehicleId);
      return NextResponse.json(
        { message: `Vehicle with vehicleNo ${vehicleId} not found`, error: true },
        { status: 404 }
      );
    }
    if (vehicle.status === "Sold") {
      console.error("Checkpoint 4 - Vehicle already sold:", vehicleId);
      return NextResponse.json(
        { message: `Vehicle ${vehicleId} is already sold`, error: true },
        { status: 400 }
      );
    }
    console.log("Checkpoint 4 - Vehicle found and not sold:", vehicle);

    // Checkpoint 5: Parse and validate numeric fields
    const salePrice = parseFloat(data.sale_price) || 0;
    const commissionAmount = parseFloat(data.commission_amount) || 0;
    const otherCharges = parseFloat(data.othercharges) || 0;
    const totalAmount = parseFloat(data.totalAmount) || 0;
    console.log("Checkpoint 5 - Parsed numeric fields:", {
      salePrice,
      commissionAmount,
      otherCharges,
      totalAmount,
    });

    // Checkpoint 6: Validate totalAmount
    const calculatedTotal = commissionAmount + otherCharges;
    if (Math.abs(totalAmount - calculatedTotal) > 0.01) {
      console.warn(
        "Checkpoint 6 - totalAmount mismatch - frontend:",
        totalAmount,
        "calculated:",
        calculatedTotal
      );
    }

    // Checkpoint 7: Calculate new balance
    const oldBalance = parseFloat(admin.balance) || 0;
    const totalExpenses = commissionAmount + otherCharges;
    const newBalance = oldBalance + salePrice - totalExpenses;
    console.log("Checkpoint 7 - Balance calculation:", {
      oldBalance,
      salePrice,
      totalExpenses,
      newBalance,
    });

    // Checkpoint 8: Start Prisma transaction
    console.log("Checkpoint 8 - Starting Prisma transaction...");
    const [saleVehicle, updatedVehicle, ledgerEntryCredit, ledgerEntryDebit, updatedAdmin] =
      await prisma.$transaction([
        // Create the sale vehicle record
        prisma.sale_Vehicle.create({
          data: {
            admin_id: adminId,
            vehicleNo: vehicleId, // Use parsed vehicleId
            date: new Date(data.date),
            commission_amount: commissionAmount,
            othercharges: otherCharges,
            totalAmount: totalAmount,
            mobileno: data.mobileno || "",
            passportNo: data.passportNo || "",
            fullname: data.fullname || "",
            details: data.details || "",
            sale_price: salePrice,
            imagePath: data.imagePath || "",
          },
        }),

        // Update the vehicle status to "Sold"
        prisma.addVehicle.update({
          where: { id: vehicleId },
          data: { status: "Sold" },
        }),

        // Ledger Entry 1: Credit sale amount to balance
        prisma.ledger.create({
          data: {
            admin_id: adminId,
            debit: 0,
            credit: salePrice,
            balance: oldBalance + salePrice,
            description: `Sale amount credited for vehicle ${vehicleId}`,
            transaction_at: new Date(),
          },
        }),

        // Ledger Entry 2: Debit commission + other charges from balance
        prisma.ledger.create({
          data: {
            admin_id: adminId,
            debit: totalExpenses,
            credit: 0,
            balance: newBalance,
            description: `Expenses (Commission: ${commissionAmount}, Other: ${otherCharges}) for vehicle ${vehicleId} - ${data.details || "No details"}`,
            transaction_at: new Date(),
          },
        }),

        // Update admin balance
        prisma.admin.update({
          where: { id: adminId },
          data: { balance: newBalance },
        }),
      ]);
    console.log("Checkpoint 8 - Transaction successful:", {
      saleVehicle,
      updatedVehicle,
      ledgerEntryCredit,
      ledgerEntryDebit,
      updatedAdmin,
    });

    return NextResponse.json(
      {
        message: "Sale vehicle saved successfully, vehicle status updated to Sold, and admin balance updated",
        data: {
          saleVehicle,
          updatedVehicle,
          ledgerEntries: [ledgerEntryCredit, ledgerEntryDebit],
          newBalance,
        },
        error: false,
      },
      { status: 201 }
    );
  } catch (error) {
    // Checkpoint 9: Handle transaction error
    console.error("Checkpoint 9 - Transaction error:", {
      message: error.message,
      stack: error.stack,
      data: JSON.stringify(data, null, 2),
    });
    return NextResponse.json(
      {
        message: "Failed to save sale vehicle",
        error: true,
        details: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  } finally {
    // Checkpoint 10: Ensure Prisma disconnect
    console.log("Checkpoint 10 - Disconnecting Prisma...");
    await prisma.$disconnect();
  }
}

export async function GET(request) {
  try {
    // Checkpoint 1: Fetch sale vehicles
    console.log("Checkpoint 1 - Fetching all sale vehicles...");
    const saleVehicles = await prisma.sale_Vehicle.findMany({
      orderBy: { createdAt: "desc" }, // Latest first
      include: {
        Admin: {
          select: { username: true }, // Include admin username
        },
        vehicle: {
          // Corrected relation name from AddVehicle to vehicle
          select: {
            id: true,
            chassisNo: true,
            maker: true,
            year: true,
            totalAmount_dollers: true,
          },
        },
      },
    });
    console.log("Checkpoint 1 - Sale vehicles fetched:", saleVehicles.length);

    // Checkpoint 2: Calculate cost price for each Sale_Vehicle
    console.log("Checkpoint 2 - Calculating cost prices for sale vehicles...");
    const saleVehiclesWithCostPrice = await Promise.all(
      saleVehicles.map(async (saleVehicle, index) => {
        // Checkpoint 2.1: Process each sale vehicle
        console.log(
          `Checkpoint 2.1 - Processing sale vehicle ${index + 1}/${saleVehicles.length}, ID: ${saleVehicle.id}, vehicleNo: ${saleVehicle.vehicleNo}`
        );

        const vehicleId = saleVehicle.vehicleNo; // vehicleNo is the AddVehicle id

        // Checkpoint 2.2: ContainerItemDetail aggregation
        console.log(`Checkpoint 2.2 - Aggregating ContainerItemDetail for vehicle ID: ${vehicleId}`);
        const containerItemsTotal = await prisma.containerItemDetail.aggregate({
          where: { vehicleId: vehicleId },
          _sum: { amount: true },
        });
        const containerItemsAmount = containerItemsTotal._sum.amount || 0;
        console.log("Checkpoint 2.2 - ContainerItemDetail total:", containerItemsTotal);

        // Checkpoint 2.3: AddVehicle totalAmount_dollers
        const addVehicleTotal = saleVehicle.vehicle?.totalAmount_dollers || 0;
        console.log("Checkpoint 2.3 - AddVehicle totalAmount_dollers:", addVehicleTotal);

        // Checkpoint 2.4: Transport aggregation
        console.log(`Checkpoint 2.4 - Aggregating Transport for vehicleNo: ${vehicleId}`);
        const transportTotal = await prisma.transport.aggregate({
          where: { vehicleNo: vehicleId },
          _sum: { v_amount: true }, // Corrected field name from v_amount to totaldollers
        });

        const transportAmount = transportTotal._sum.v_amount || 0;
        console.log("Checkpoint 2.4 - Transport total:", transportTotal);

        // Checkpoint 2.5: Inspection aggregation
        console.log(`Checkpoint 2.5 - Aggregating Inspection for vehicleNo: ${vehicleId}`);
        const inspectionTotal = await prisma.inspection.aggregate({
          where: { vehicleNo: vehicleId },
          _sum: { vamount_doller: true },
        });
        const inspectionAmount = inspectionTotal._sum.vamount_doller || 0;
        console.log("Checkpoint 2.5 - Inspection total:", inspectionTotal);

        // Checkpoint 2.6: PortCollect aggregation
        console.log(`Checkpoint 2.6 - Aggregating PortCollect for vehicleNo: ${vehicleId}`);
        const portCollectTotal = await prisma.portCollect.aggregate({
          where: { vehicleNo: vehicleId },
          _sum: { vamount: true },
        });
        const portCollectAmount = portCollectTotal._sum.vamount || 0;
        console.log("Checkpoint 2.6 - PortCollect total:", portCollectTotal);

        // Checkpoint 2.7: ShowRoom_Vehicle aggregation
        console.log(`Checkpoint 2.7 - Aggregating ShowRoom_Vehicle for vehicleNo: ${vehicleId}`);
        const showRoomVehicleTotal = await prisma.showRoom_Vehicle.aggregate({
          where: { vehicleNo: vehicleId },
          _sum: { vtotalAmount: true },
        });
        const showRoomVehicleAmount = showRoomVehicleTotal._sum.vtotalAmount || 0;
        console.log("Checkpoint 2.7 - ShowRoom_Vehicle total:", showRoomVehicleTotal);

        // Checkpoint 2.7: Sale_Vehicle aggregation
        console.log(`Checkpoint 2.7 - Aggregating Sale_Vehicle for vehicleNo: ${vehicleId}`);
        const showSaleTotal = await prisma.sale_Vehicle.aggregate({
          where: { vehicleNo: vehicleId },
          _sum: { totalAmount: true },
        });
        const showSaleAmount = showSaleTotal._sum.totalAmount || 0;
        console.log("Checkpoint 2.7 - Sale_Vehicle total:", showSaleTotal);

        // Checkpoint 2.8: Calculate cost price
        const costPrice =
          containerItemsAmount +
          addVehicleTotal +
          transportAmount +
          inspectionAmount +
          portCollectAmount +
          showRoomVehicleAmount +
          showSaleAmount;
        console.log(`Checkpoint 2.8 - Calculated cost price for vehicleNo ${vehicleId}:`, costPrice);

        return {
          ...saleVehicle,
          costPrice: parseFloat(costPrice.toFixed(2)), // Format to 2 decimal places
          salePrice: saleVehicle.sale_price, // Rename sale_price for clarity
          costBreakdown: {
            containerItemsAmount,
            addVehicleTotal,
            transportAmount,
            inspectionAmount,
            portCollectAmount,
            showRoomVehicleAmount,
            showSaleAmount,
          },
        };
      })
    );
    console.log("Checkpoint 2 - Cost prices calculated:", saleVehiclesWithCostPrice.length);

    // Checkpoint 3: Return successful response
    console.log("Checkpoint 3 - Returning successful response...");
    return NextResponse.json(
      {
        message: "Sale vehicles retrieved successfully with cost prices",
        data: saleVehiclesWithCostPrice,
        error: false,
      },
      { status: 200 }
    );
  } catch (error) {
    // Checkpoint 4: Handle error
    console.error("Checkpoint 4 - Error in GET endpoint:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        message: "Failed to fetch sale vehicles or calculate cost prices",
        error: true,
        details: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  } finally {
    // Checkpoint 5: Ensure Prisma disconnect
    console.log("Checkpoint 5 - Disconnecting Prisma...");
    await prisma.$disconnect();
  }
}