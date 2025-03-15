import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';



export async function POST(request) {
  try {
    const data = await request.json();
    console.log("Received data:", JSON.stringify(data, null, 2));

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
      admin_id,
      createdAt,
      updatedAt,
      vehicles,
    } = data;

    // Validation for required fields (removed vehicleNo, allow empty date/deliveryDate if optional)
    if (!port || !company || !admin_id || !vehicles || vehicles.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields (port, company, admin_id, or vehicles)", status: false },
        { status: 400 }
      );
    }

    // Validate numeric fields (per vehicle)
    if (isNaN(amount) || isNaN(tenPercentAdd) || isNaN(totalamount) || isNaN(totaldollers)) {
      return NextResponse.json(
        { error: "Invalid numeric fields (amount, tenPercentAdd, totalamount, or totaldollers)", status: false },
        { status: 400 }
      );
    }

    // Validate vehicle data
    vehicles.forEach((vehicle, index) => {
      if (!vehicle.vehicleNo || !vehicle.totaldollers || vehicle.id === undefined) {
        throw new Error(`Missing required vehicle fields (vehicleNo, totaldollers, or id) at index ${index}`);
      }
    });

    // Fetch AddVehicle records to verify vehicle IDs and admin association
    const vehicleIds = vehicles.map(v => parseInt(v.id));
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
    const invalidVehicles = vehicleRecords.filter(v => v.status !== "Pending");
    if (invalidVehicles.length > 0) {
      console.log("Invalid vehicle statuses:", invalidVehicles.map(v => ({ id: v.id, status: v.status })));
      return NextResponse.json(
        { error: "One or more vehicles are not in 'Pending' status", status: false },
        { status: 400 }
      );
    }

    // Assume all vehicles belong to the same admin for balance purposes
    const vehicleAdminIds = [...new Set(vehicleRecords.map(v => v.admin_id))];
    if (vehicleAdminIds.length > 1) {
      console.log("Vehicles belong to multiple admins:", vehicleAdminIds);
      return NextResponse.json(
        { error: "Vehicles belong to multiple admins, not supported yet", status: false },
        { status: 400 }
      );
    }

    const vehicleAdminId = vehicleAdminIds[0];
    console.log("Using admin_id from vehicle records for balance:", vehicleAdminId);

    // Fetch the admin's balance using the vehicle's admin_id
    console.log("Fetching admin with ID:", vehicleAdminId);
    const admin = await prisma.admin.findUnique({
      where: { id: vehicleAdminId },
      select: { balance: true },
    });

    if (!admin) {
      console.log("Admin not found for ID:", vehicleAdminId);
      return NextResponse.json(
        { error: "Vehicle admin not found", status: false },
        { status: 404 }
      );
    }

    const currentBalance = admin.balance;
    console.log("Current vehicle admin balance:", currentBalance);
    const totalTransactionAmount = vehicles.length * totalamount; // Total amount across all vehicles
    const newBalance = currentBalance - totalTransactionAmount;

    // Optionally enforce balance check (uncomment if needed)
    // if (newBalance < 0) {
    //   console.log("Insufficient balance. Current:", currentBalance, "Required:", totalTransactionAmount);
    //   return NextResponse.json(
    //     { error: "Insufficient vehicle admin balance", status: false },
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
            v_amount:  parseFloat(vehicle.totaldollers),
            amount: parseFloat(amount),
            tenPercentAdd: parseFloat(tenPercentAdd),
            totalamount: parseFloat(totalamount),
            totaldollers: parseFloat(totaldollers),
            imagePath: imagePath || "",
            vehicleNo: vehicle.id.toString(),
            admin_id: parseInt(admin_id),
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt),
          },
        })
      );

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

    // Update Admin balance (using vehicle's admin_id)
    operations.push(
      prisma.admin.update({
        where: { id: vehicleAdminId },
        data: { balance: newBalance },
      })
    );

    // Create a single Ledger entry for the total transaction
    operations.push(
      prisma.ledger.create({
        data: {
          admin_id: vehicleAdminId,
          debit: totalTransactionAmount,
          credit: 0,
          balance: newBalance,
          description: `Transport booking for ${vehicleIds.length} vehicles - Total: ${totalTransactionAmount} Yen`,
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
        message: "Transports created successfully, vehicle admin balance updated, and ledger entry added",
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