import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prisma';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("Received data:", JSON.stringify(data, null, 2));

    const {
      date,
      deliveryDate,
      port,
      company,
      amount,
      tenPercentAdd,
      totalamount,
      totaldollers,
      imagePath,
      vehicleNo,
      admin_id, // This will still be used for the Transport record
      createdAt,
      updatedAt,
      vehicles,
    } = data;

    // Validation for required fields
    if (!date || !deliveryDate || !port || !company || !vehicleNo || !admin_id || !vehicles || vehicles.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields", status: false },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (isNaN(amount) || isNaN(tenPercentAdd) || isNaN(totalamount) || isNaN(totaldollers)) {
      return NextResponse.json(
        { error: "Invalid numeric fields", status: false },
        { status: 400 }
      );
    }

    // Validate vehicle data
    vehicles.forEach((vehicle, index) => {
      if (!vehicle.vehicleNo || !vehicle.amount || vehicle.totaldollers === undefined) {
        throw new Error(`Missing required vehicle fields at index ${index}`);
      }
      if (!vehicle.id) {
        throw new Error(`Vehicle at index ${index} is missing an ID`);
      }
    });

    // Fetch admin data for the vehicles' admin_id
    const vehicleIds = vehicles.map(v => parseInt(v.id));
    console.log("Fetching AddVehicle records for IDs:", vehicleIds);
    const vehicleRecords = await prisma.addVehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, admin_id: true },
    });

    if (vehicleRecords.length !== vehicles.length) {
      console.log("Some vehicle IDs not found:", vehicleIds);
      return NextResponse.json(
        { error: "One or more vehicle IDs not found", status: false },
        { status: 404 }
      );
    }

    // Assume all vehicles belong to the same admin for simplicity
    const vehicleAdminIds = [...new Set(vehicleRecords.map(v => v.admin_id))];
    if (vehicleAdminIds.length > 1) {
      console.log("Vehicles belong to multiple admins:", vehicleAdminIds);
      return NextResponse.json(
        { error: "Vehicles belong to multiple admins, not supported yet", status: false },
        { status: 400 }
      );
    }

    const vehicleAdminId = vehicleAdminIds[0];
    console.log("Using admin_id from vehicle records:", vehicleAdminId);

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
    const newBalance = currentBalance - totalamount;

    // if (newBalance < 0) {
    //   console.log("Insufficient balance. Current:", currentBalance, "Required:", totalamount);
    //   return NextResponse.json(
    //     { error: "Insufficient vehicle admin balance", status: false },
    //     { status: 400 }
    //   );
    // }

    // Prepare Prisma operations
    const operations = [];

    // Create Transport record (still using the provided admin_id)
    operations.push(
      prisma.transport.create({
        data: {
          date: new Date(date),
          deliveryDate: new Date(deliveryDate),
          port,
          company,
          amount: parseFloat(amount),
          tenPercentAdd: parseFloat(tenPercentAdd),
          totalamount: parseFloat(totalamount),
          totaldollers: parseFloat(totaldollers),
          imagePath: imagePath || "",
          vehicleNo,
          admin_id: parseInt(admin_id), // Transport record uses the submitted admin_id
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
      })
    );

    // Update AddVehicle statuses
    for (const vehicle of vehicles) {
      console.log("Updating AddVehicle with ID:", vehicle.id);
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

    // Create Ledger entry (using vehicle's admin_id)
    operations.push(
      prisma.ledger.create({
        data: {
          admin_id: vehicleAdminId, // Use vehicle's admin_id
          debit: parseFloat(totalamount),
          credit: 0,
          balance: newBalance,
          description: `Transport booking for ${vehicleNo} - Amount: ${totalamount} Yen`,
          transaction_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      })
    );

    console.log("Executing transaction with", operations.length, "operations");
    const results = await prisma.$transaction(operations);
    console.log("Transaction completed successfully");

    const createdTransport = results.find((result) => result.hasOwnProperty("vehicleNo"));

    return NextResponse.json(
      {
        message: "Transport created successfully, vehicle admin balance updated, and ledger entry added",
        status: true,
        data: createdTransport,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST transport:", error);
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
// GET: Fetch all transport records

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