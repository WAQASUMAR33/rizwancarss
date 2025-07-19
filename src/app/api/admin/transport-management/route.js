import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    // Parse the incoming request data
    const data = await request.json();
    console.log("Received data:", JSON.stringify(data, null, 2));

    // Destructure the request body
    const {
      date,
      deliveryDate,
      port,
      yard,
      company,
      yardname,
      paymentStatus,
      imagePath,
      admin_id, // Ignored since we're hardcoding admin_id 1
      createdAt,
      updatedAt,
      vehicles,
    } = data;

    // Validation for required fields
    if (!port || !company || !vehicles || !yardname || vehicles.length === 0) {
      console.log("Validation failed: Missing required fields", { port, company, vehicles });
      return NextResponse.json(
        { error: "Missing required fields (port, company, or vehicles)", status: false },
        { status: 400 }
      );
    }

    // Validate paymentStatus
    if (!["Paid", "UnPaid"].includes(paymentStatus)) {
      console.log("Validation failed: Invalid paymentStatus", { paymentStatus });
      return NextResponse.json(
        { error: "Invalid paymentStatus. Must be 'Paid' or 'UnPaid'", status: false },
        { status: 400 }
      );
    }

    // Validate vehicle data and totals
    vehicles.forEach((vehicle, index) => {
      if (
        !vehicle.vehicleNo ||
        vehicle.id === undefined ||
        isNaN(vehicle.v_amount) ||
        isNaN(vehicle.v_10per) ||
        isNaN(vehicle.v_amount_total) ||
        isNaN(vehicle.v_amount_total_dollers)
      ) {
        console.log(`Validation failed: Missing vehicle fields at index ${index}`, vehicle);
        throw new Error(
          `Missing or invalid required vehicle fields (vehicleNo, id, v_amount, v_10per, v_amount_total, or v_amount_total_dollers) at index ${index}`
        );
      }
    });

    // Fetch AddVehicle records to verify vehicle IDs
    const vehicleIds = vehicles.map((v) => parseInt(v.id));
    console.log("Fetching AddVehicle records for IDs:", vehicleIds);
    const vehicleRecords = await prisma.addVehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, admin_id: true, status: true },
    });

    if (vehicleRecords.length !== vehicles.length) {
      console.log("Some vehicle IDs not found:", vehicleIds);
      return NextResponse.json(
        { error: "One or more vehicle IDs not found", status: false },
        { status: 404 }
      );
    }

    // Check if all vehicles have status "Pending"
    const invalidVehicles = vehicleRecords.filter((v) => v.status !== "Pending");
    if (invalidVehicles.length > 0) {
      console.log(
        "Invalid vehicle statuses:",
        invalidVehicles.map((v) => ({ id: v.id, status: v.status }))
      );
      return NextResponse.json(
        { error: "One or more vehicles are not in 'Pending' status", status: false },
        { status: 400 }
      );
    }

    // Fetch the admin's balance for hardcoded admin_id 1
    const targetAdminId = 1; // Hardcode admin_id to 1
    console.log("Fetching admin with ID:", targetAdminId);
    const admin = await prisma.admin.findUnique({
      where: { id: targetAdminId },
      select: { balance: true },
    });

    if (!admin) {
      console.log("Admin not found for ID:", targetAdminId);
      return NextResponse.json(
        { error: `Admin not found for ID ${targetAdminId}`, status: false },
        { status: 404 }
      );
    }

    const currentBalance = parseFloat(admin.balance);
    console.log("Current admin balance:", currentBalance);

    // Calculate totalTransactionAmount and newBalance (only if paymentStatus is "Paid")
    let totalTransactionAmount = 0;
    let newBalance = currentBalance;
    if (paymentStatus === "Paid") {
      // Use the totals from the first vehicle (they are shared across all vehicles)
      const firstVehicle = vehicles[0];
      totalTransactionAmount = parseFloat(firstVehicle.v_amount_total_dollers);
      console.log("Calculated totalTransactionAmount (USD):", totalTransactionAmount);

      if (isNaN(totalTransactionAmount)) {
        console.log("Validation failed: Invalid v_amount_total_dollers");
        return NextResponse.json(
          { error: "Invalid v_amount_total_dollers", status: false },
          { status: 400 }
        );
      }

      newBalance = currentBalance - totalTransactionAmount;
      console.log("New admin balance after deduction:", newBalance);

      // Optional: Check for sufficient balance
      if (newBalance < 0) {
        console.log(
          "Insufficient balance. Current:",
          currentBalance,
          "Required:",
          totalTransactionAmount
        );
        return NextResponse.json(
          { error: "Insufficient admin balance", status: false },
          { status: 400 }
        );
      }
    }

    // Prepare Prisma operations
    const operations = [];

    // Create a Transport record for each vehicle
    for (const vehicle of vehicles) {
      const transportData = {
        date: date ? new Date(date) : new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
        port,
        company,
        yardname,
        paid_status: paymentStatus,
        v_amount: parseFloat(vehicle.v_amount),
        v_10per: parseFloat(vehicle.v_10per),
        v_amount_total: parseFloat(vehicle.v_amount_total),
        v_amount_total_dollers: parseFloat(vehicle.v_amount_total_dollers),
        imagePath: imagePath || "",
        vehicleNo: parseInt(vehicle.vehicleNo),
        admin_id: targetAdminId,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      };
      console.log("Creating Transport record with data:", JSON.stringify(transportData, null, 2));

      operations.push(
        prisma.transport.create({
          data: transportData,
        })
      );

      const vehicleUpdateData = {
        status: "Transport", // Changed from "Transport" to "InTransport"
        updatedAt: new Date(),
      };
      console.log("Updating AddVehicle record with data:", JSON.stringify(vehicleUpdateData, null, 2));

      operations.push(
        prisma.addVehicle.update({
          where: { id: parseInt(vehicle.id) },
          data: vehicleUpdateData,
        })
      );
    }

    // Update Admin balance and create Ledger entry only if paymentStatus is "Paid"
    if (paymentStatus === "Paid") {
      const adminUpdateData = {
        balance: newBalance,
        updated_at: new Date(),
      };
      console.log("Updating Admin balance with data:", JSON.stringify(adminUpdateData, null, 2));

      operations.push(
        prisma.admin.update({
          where: { id: targetAdminId },
          data: adminUpdateData,
        })
      );

      const ledgerData = {
        admin_id: targetAdminId,
        debit: 0.0,
        credit: totalTransactionAmount,
        balance: newBalance,
        description: `Transport booking for ${vehicles.length} vehicles - Total: ${totalTransactionAmount} USD`,
        transaction_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };
      console.log("Creating Ledger entry with data:", JSON.stringify(ledgerData, null, 2));

      operations.push(
        prisma.ledger.create({
          data: ledgerData,
        })
      );
    }

    console.log("Executing transaction with", operations.length, "operations");
    const results = await prisma.$transaction(operations);
    console.log("Transaction completed successfully");

    const createdTransports = results.filter((result) => result.hasOwnProperty("vehicleNo"));

    return NextResponse.json(
      {
        message:
          paymentStatus === "Paid"
            ? "Transports created successfully, admin balance updated, and ledger entry added"
            : "Transports created successfully (UnPaid status, no balance or ledger updates)",
        status: true,
        data: createdTransports,
      },
      { status: 201 }
    );
  } catch (error) {
   
    return NextResponse.json(
      {
        error: "Internal server error",
        status: false,
        details: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request) {
  try {
    console.log("Fetching transports from API...");

    console.log("Querying transports...");
    const transports = await prisma.transport.findMany({
      include: {
        Admin: {
          select: {
            id: true,
            fullname: true,
            username: true,
            balance: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log("Transports fetched:", transports.length);
    console.log("Transports data:", JSON.stringify(transports, null, 2));

    console.log("Processing transports with vehicles...");
    const transportWithVehicles = await Promise.all(
      transports.map(async (transport) => {
        const vehicle = await prisma.addVehicle.findFirst({
          where: {
            id: transport.vehicleNo,
          },
          select: {
            id: true,
            chassisNo: true,
            maker: true,
            year: true,
            status: true,
            admin_id: true,
          },
        });

        return {
          ...transport,
          vehicles: vehicle ? [vehicle] : [],
        };
      })
    );

    console.log("Fetched transports with vehicles:", JSON.stringify(transportWithVehicles, null, 2));

    return NextResponse.json(
      {
        message: "Transports created successfully",
        status: true,
        data: transportWithVehicles,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching transports:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: "Internal server error",
        status: false,
        details: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  } finally {
    console.log("Disconnecting Prisma...");
    await prisma.$disconnect();
  }
}