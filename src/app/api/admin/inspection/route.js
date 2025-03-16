import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("Received inspection data:", JSON.stringify(data, null, 2));

    const {
      date,
      company,
      invoiceno,
      invoice_amount = 0,
      invoice_tax = 0,
      invoice_total = 0,
      invoice_amount_dollers = 0,
      vamount_doller = 0,
      imagePath = "",
      admin_id,
      vehicles,
      createdAt,
      updatedAt,
    } = data;

    // Validation
    const missingFields = [];
    if (!date) missingFields.push("date");
    if (!company) missingFields.push("company");
    if (!admin_id) missingFields.push("admin_id");
    if (!vehicles || vehicles.length === 0) missingFields.push("vehicles");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}`, status: false },
        { status: 400 }
      );
    }

    // Fetch vehicle data including admin_id
    const vehicleIds = vehicles.map((v) => parseInt(v.id));
    const vehicleData = await prisma.addVehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, chassisNo: true, admin_id: true },
    });

    // Check for missing vehicles
    const foundVehicleIds = vehicleData.map((v) => v.id);
    const missingVehicleIds = vehicleIds.filter((id) => !foundVehicleIds.includes(id));
    if (missingVehicleIds.length > 0) {
      return NextResponse.json(
        {
          error: `Vehicle(s) not found: ${missingVehicleIds.join(', ')}`,
          status: false,
        },
        { status: 404 }
      );
    }

    // Map vehicle IDs to chassisNos and admin_ids
    const vehicleMap = vehicleData.reduce((map, vehicle) => {
      map[vehicle.id] = { chassisNo: vehicle.chassisNo, admin_id: vehicle.admin_id };
      return map;
    }, {});

    // Fetch admin balances for each unique admin_id
    const uniqueAdminIds = [...new Set(vehicleData.map((v) => v.admin_id))];
    const adminData = await prisma.admin.findMany({
      where: { id: 1 },
      select: { id: true, balance: true },
    });

    const adminBalanceMap = adminData.reduce((map, admin) => {
      map[admin.id] = admin.balance;
      return map;
    }, {});

    // Transaction to create inspection records, update vehicle statuses, admin balances, and ledger
    const operations = [];

    // Create an Inspection record for each vehicle
    for (const vehicle of vehicles) {
      const { chassisNo, admin_id: vehicleAdminId } = vehicleMap[vehicle.id];
      if (!vehicleAdminId) {
        throw new Error(`No admin_id found for vehicle ID ${vehicle.id}`);
      }

      operations.push(
        prisma.inspection.create({
          data: {
            vehicleNo: vehicle.id, // Changed from chassisNo to vehicle.id
            company,
            date: new Date(date),
            invoice_amount: parseFloat(invoice_amount),
            invoice_tax: parseFloat(invoice_tax),
            invoice_total: parseFloat(invoice_total),
            invoice_amount_dollers: parseFloat(invoice_amount_dollers),
            vamount_doller: parseFloat(vamount_doller),
            invoiceno: invoiceno || `INS-${Date.now()}-${vehicle.id}`,
            imagePath,
            admin_id: parseInt(admin_id),
            createdAt: new Date(createdAt || Date.now()),
            updatedAt: new Date(updatedAt || Date.now()),
          },
        })
      );

      // Update vehicle status to "Inspection"
      operations.push(
        prisma.addVehicle.update({
          where: { id: parseInt(vehicle.id) },
          data: { status: "Inspection", updatedAt: new Date() },
        })
      );
    }

    // Update admin balances and create ledger entries for each unique admin
    for (const vehicleAdminId of uniqueAdminIds) {
      const currentBalance = adminBalanceMap[vehicleAdminId] || 0;
      const vehiclesForAdmin = vehicleData.filter((v) => v.admin_id === vehicleAdminId).length;
      const totalInvoiceDollersForAdmin = invoice_amount_dollers * vehiclesForAdmin;
      const newBalance = currentBalance + totalInvoiceDollersForAdmin;

      // Update admin balance
      operations.push(
        prisma.admin.update({
          where: { id: 1 },
          data: { balance: newBalance },
        })
      );

      // Create ledger entry
      operations.push(
        prisma.ledger.create({
          data: {
            admin_id: vehicleAdminId,
            debit: 0,
            credit: totalInvoiceDollersForAdmin,
            balance: newBalance,
            description: `Inspection booking credited ${totalInvoiceDollersForAdmin} USD for ${vehiclesForAdmin} vehicle(s)`,
            transaction_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        })
      );
    }

    const results = await prisma.$transaction(operations);
    const createdInspections = results.filter((result) => result.hasOwnProperty("vehicleNo"));

    return NextResponse.json(
      {
        message: "Inspections created successfully",
        status: true,
        data: createdInspections,
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
    console.log("Fetching inspections from API...");
    const inspections = await prisma.inspection.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Join with AddVehicle based on vehicleNo matching id (now an integer)
    const inspectionsWithVehicles = await Promise.all(
      inspections.map(async (inspection) => {
        const vehicle = await prisma.addVehicle.findFirst({
          where: {
            id: parseInt(inspection.vehicleNo), // Changed from chassisNo to id
          },
        });

        return {
          ...inspection,
          vehicle: vehicle || null,
        };
      })
    );

    console.log("Fetched inspections with vehicles:", inspectionsWithVehicles);

    return NextResponse.json(
      {
        message: "Inspections fetched successfully",
        status: true,
        data: inspectionsWithVehicles,
      },
      { status: 200 }
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