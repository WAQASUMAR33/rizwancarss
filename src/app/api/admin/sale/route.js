import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function POST(request) {
  try {
    const data = await request.json();

    // Log the incoming data
    console.log("Received data:", data);

    // Validate required fields
    const requiredFields = ["admin_id", "vehicleNo", "date", "sale_price"];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { message: `Missing required field: ${field}`, error: true },
          { status: 400 }
        );
      }
    }

    // Ensure admin exists and fetch current balance
    console.log("Fetching admin with ID:", data.admin_id);
    const admin = await prisma.admin.findUnique({
      where: { id: parseInt(data.admin_id) },
      select: { id: true, balance: true },
    });
    if (!admin) {
      console.error("Admin not found for ID:", data.admin_id);
      return NextResponse.json(
        { message: "Admin not found", error: true },
        { status: 404 }
      );
    }

    // Ensure vehicle exists and is not already sold
    console.log("Fetching vehicle with vehicleNo:", data.vehicleNo);
    const vehicle = await prisma.addVehicle.findUnique({
      where: { id: parseInt(data.vehicleNo) },
    });
    if (!vehicle) {
      console.error("Vehicle not found for vehicleNo:", data.vehicleNo);
      return NextResponse.json(
        { message: `Vehicle with vehicleNo ${data.vehicleNo} not found`, error: true },
        { status: 404 }
      );
    }
    if (vehicle.status === "Sold") {
      console.error("Vehicle already sold:", data.vehicleNo);
      return NextResponse.json(
        { message: `Vehicle ${data.vehicleNo} is already sold`, error: true },
        { status: 400 }
      );
    }

    // Parse and validate numeric fields
    const salePrice = parseFloat(data.sale_price) || 0;
    const commissionAmount = parseFloat(data.commission_amount) || 0;
    const otherCharges = parseFloat(data.othercharges) || 0;
    const totalAmount = parseFloat(data.totalAmount) || 0;

    // Validate totalAmount
    const calculatedTotal = commissionAmount + otherCharges;
    if (Math.abs(totalAmount - calculatedTotal) > 0.01) {
      console.warn("totalAmount mismatch - frontend:", totalAmount, "calculated:", calculatedTotal);
    }

    // Get the old balance
    const oldBalance = parseFloat(admin.balance) || 0;

    // Calculate new balance: old balance + sale price - (commission + other charges)
    const totalExpenses = commissionAmount + otherCharges;
    const newBalance = oldBalance + salePrice - totalExpenses;

    // Use a transaction to ensure all operations succeed or fail together
    console.log("Starting Prisma transaction...");
    const [saleVehicle, updatedVehicle, ledgerEntryCredit, ledgerEntryDebit, updatedAdmin] =
      await prisma.$transaction([
        // Create the sale vehicle record
        prisma.sale_Vehicle.create({
          data: {
            admin_id: parseInt(data.admin_id),
            vehicleNo: data.vehicleNo,
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
          where: { id: parseInt(data.vehicleNo) },
          data: { status: "Sold" },
        }),

        // Ledger Entry 1: Credit sale amount to balance
        prisma.ledger.create({
          data: {
            admin_id: parseInt(data.admin_id),
            debit: 0,
            credit: salePrice,
            balance: oldBalance + salePrice,
            description: `Sale amount credited for vehicle ${data.vehicleNo}`,
            transaction_at: new Date(),
          },
        }),

        // Ledger Entry 2: Debit commission + other charges from balance
        prisma.ledger.create({
          data: {
            admin_id: parseInt(data.admin_id),
            debit: totalExpenses,
            credit: 0,
            balance: newBalance,
            description: `Expenses (Commission: ${commissionAmount}, Other: ${otherCharges}) for vehicle ${data.vehicleNo} - ${data.details || "No details"}`,
            transaction_at: new Date(),
          },
        }),

        // Update admin balance
        prisma.admin.update({
          where: { id: parseInt(data.admin_id) },
          data: { balance: newBalance },
        }),
      ]);

    console.log("Transaction successful:", { saleVehicle, updatedVehicle, newBalance });

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
    console.error("Transaction error:", error.message, error.stack);
    return NextResponse.json(
      {
        message: "Failed to save sale vehicle",
        error: true,
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Fetch all sale vehicles with related AddVehicle data
    const saleVehicles = await prisma.sale_Vehicle.findMany({
      orderBy: { createdAt: 'desc' }, // Optional: latest first
      include: {
        Admin: {
          select: { username: true }, // Include admin username if needed
        },
      },
    });

    // Calculate cost price for each Sale_Vehicle
    const saleVehiclesWithCostPrice = await Promise.all(
      saleVehicles.map(async (saleVehicle) => {
        const vehicleNo = saleVehicle.vehicleNo;

        // 1. Find the AddVehicle record for this vehicleNo to get vehicleId
        const addVehicle = await prisma.addVehicle.findFirst({
          where: { chassisNo: vehicleNo },
          select: { id: true, totalAmount_dollers: true },
        });

        const vehicleId = addVehicle?.id;

        // 2. ContainerItemDetail: Sum amount for this vehicle
        const containerItemsTotal = vehicleId
          ? await prisma.containerItemDetail.aggregate({
              where: { vehicleId: vehicleId },
              _sum: { amount: true },
            })
          : { _sum: { amount: 0 } };

        // 3. AddVehicle: Get totalAmount_dollers
        const addVehicleTotal = addVehicle?.totalAmount_dollers || 0;

        // 4. Transport: Sum totaldollers for this vehicleNo
        const transportTotal = await prisma.transport.aggregate({
          where: { vehicleNo: vehicleNo },
          _sum: { totaldollers: true },
        });

        // 5. Inspection: Sum invoice_amount_dollers for this vehicleNo
        const inspectionTotal = await prisma.inspection.aggregate({
          where: { vehicleNo: vehicleNo },
          _sum: { invoice_amount_dollers: true },
        });

        // 6. PortCollect: Sum totalAmount for this vehicleNo (assuming USD)
        const portCollectTotal = await prisma.portCollect.aggregate({
          where: { vehicleNo: vehicleNo },
          _sum: { totalAmount: true },
        });

        // 7. ShowRoom_Vehicle: Sum vtotalAmount for this vehicleNo (assuming USD)
        const showRoomVehicleTotal = await prisma.showRoom_Vehicle.aggregate({
          where: { vehicleNo: vehicleNo },
          _sum: { vtotalAmount: true },
        });

        // Calculate total cost price for this vehicle
        const costPrice =
          (containerItemsTotal._sum.amount || 0) +
          (addVehicleTotal || 0) +
          (transportTotal._sum.totaldollers || 0) +
          (inspectionTotal._sum.invoice_amount_dollers || 0) +
          (portCollectTotal._sum.totalAmount || 0) +
          (showRoomVehicleTotal._sum.vtotalAmount || 0);

        return {
          ...saleVehicle,
          costPrice: parseFloat(costPrice.toFixed(2)), // Format to 2 decimal places
          salePrice: saleVehicle.sale_price, // Rename sale_price for clarity
        };
      })
    );

    return NextResponse.json(
      {
        message: "Sale vehicles retrieved successfully with cost prices",
        data: saleVehiclesWithCostPrice,
        error: false,
      },
      { status: 200 }
    );
  } catch (error) {
   
    return NextResponse.json(
      { message: "Failed to fetch sale vehicles or calculate cost prices", error: true },
      { status: 500 }
    );
  }
}