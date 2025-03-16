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
      invoiceno,
      port,
      company,
      amount,
      tenPercentAdd,
      totalamount,
      totaldollers,
      imagePath,
      admin_id, // Ignored since we're hardcoding admin_id 1
      createdAt,
      updatedAt,
      vehicles,
    } = data;

    // Validation for required fields
    if (!port || !company || !vehicles || vehicles.length === 0) {
      console.log("Validation failed: Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields (port, company, or vehicles)", status: false },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (isNaN(amount) || isNaN(tenPercentAdd) || isNaN(totalamount) || isNaN(totaldollers)) {
      console.log("Validation failed: Invalid numeric fields");
      return NextResponse.json(
        { error: "Invalid numeric fields (amount, tenPercentAdd, totalamount, or totaldollers)", status: false },
        { status: 400 }
      );
    }

    // Validate vehicle data
    vehicles.forEach((vehicle, index) => {
      if (!vehicle.vehicleNo || !vehicle.totaldollers || vehicle.id === undefined) {
        console.log(`Validation failed: Missing vehicle fields at index ${index}`);
        throw new Error(`Missing required vehicle fields (vehicleNo, totaldollers, or id) at index ${index}`);
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
      console.log("Invalid vehicle statuses:", invalidVehicles.map((v) => ({ id: v.id, status: v.status })));
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

    const currentBalance = admin.balance;
    console.log("Current admin balance:", currentBalance);

    // Calculate totalTransactionAmount as the sum of all vehicles' totaldollers
    const totalTransactionAmount = vehicles.reduce((sum, vehicle) => {
      return sum + parseFloat(vehicle.totaldollers || 0);
    }, 0);
    console.log("Calculated totalTransactionAmount:", totalTransactionAmount);

    const newBalance = currentBalance - totalTransactionAmount;

    // Check for sufficient balance (optional, uncomment if needed)
    // if (newBalance < 0) {
    //   console.log("Insufficient balance. Current:", currentBalance, "Required:", totalTransactionAmount);
    //   return NextResponse.json(
    //     { error: "Insufficient admin balance", status: false },
    //     { status: 400 }
    //   );
    // }

    // Prepare Prisma operations
    const operations = [];

    // Create a Transport record for each vehicle
    for (const vehicle of vehicles) {
      operations.push(
        prisma.transport.create({
        data: {
          date: date ? new Date(date) : new Date(),
          deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
          invoiceno,
          port,
          company,
          v_amount: parseFloat(vehicle.totaldollers),
          amount: parseFloat(amount),
          tenPercentAdd: parseFloat(tenPercentAdd),
          totalamount: parseFloat(totalamount),
          totaldollers: parseFloat(totaldollers),
          imagePath: imagePath || "",
          vehicleNo: parseInt(vehicle.id), // Use vehicle.id as an integer
          admin_id: targetAdminId, // Use hardcoded admin_id 1
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        },
      }));

      // Update the corresponding AddVehicle status
      operations.push(
        prisma.addVehicle.update({
          where: { id: parseInt(vehicle.id) },
          data: {
            status: "Transport",
            updatedAt: new Date(),
          },
        })
      );
    }

    // Update Admin balance (for hardcoded admin_id 1)
    operations.push(
      prisma.admin.update({
        where: { id: targetAdminId },
        data: { balance: newBalance },
      })
    );

    // Create a single Ledger entry for the total transaction (for hardcoded admin_id 1)
    operations.push(
      prisma.ledger.create({
        data: {
          admin_id: targetAdminId,
          debit: 0.0, // Record the deducted amount as debit
          credit: totalTransactionAmount, // No credit for an "Out" transaction
          balance: newBalance, // The new balance after deduction
          description: `Transport booking for ${vehicles.length} vehicles - Total: ${totalTransactionAmount} Yen`,
          transaction_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      })
    );

    console.log("Executing transaction with", operations.length, "operations");
    const results = await prisma.$transaction(operations);
    console.log("Transaction completed successfully");

    const createdTransports = results.filter((result) => result.hasOwnProperty("vehicleNo"));

    return NextResponse.json(
      {
        message: "Transports created successfully, admin balance updated, and ledger entry added",
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

    console.log("Processing transports with vehicles...");
    const transportWithVehicles = await Promise.all(
      transports.map(async (transport) => {
        const vehicleNos = transport.vehicleNo.split(", ").filter(Boolean);
        console.log(`Fetching vehicles for transport ${transport.id}, vehicleNos:`, vehicleNos);

        const vehicles = await prisma.addVehicle.findMany({
          where: {
            chassisNo: { in: vehicleNos },
          },
          select: {
            id: true,
            chassisNo: true,
            maker: true,
            year: true,
            status: true,
            admin_id: true, // Keep admin_id without relation
          },
        });
        console.log(`Vehicles fetched for transport ${transport.id}:`, vehicles.length);

        return {
          ...transport,
          vehicles,
        };
      })
    );

    console.log("Fetched transports with vehicles:", JSON.stringify(transportWithVehicles, null, 2));

    return NextResponse.json(
      {
        message: "Transports fetched successfully",
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