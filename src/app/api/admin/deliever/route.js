import { NextResponse } from "next/server";
import prisma from "@/utils/prisma"; // Adjust path to your Prisma client

export async function POST(req) {
  try {
    const vehicleData = await req.json();

    // Validate input
    if (!Array.isArray(vehicleData) || vehicleData.length === 0) {
      return NextResponse.json(
        { status: false, error: "Invalid or empty vehicle data" },
        { status: 400 }
      );
    }

    // Enforce admin_id as 1 for all vehicles
    const processedData = vehicleData.map((vehicle) => ({
      ...vehicle,
      admin_id: 1, // Override admin_id to 1
    }));

    // Start a transaction to ensure atomicity
    const result = await prisma.$transaction(
      async (tx) => {
        try {
          // 1. Calculate total charges
          const totalCharges = processedData.reduce(
            (sum, vehicle) => sum + (parseFloat(vehicle.totalAmount) || 0),
            0
          );
          console.log("Total charges to deduct:", totalCharges);

          // 2. Fetch admin balance for admin_id 1
          console.log("Fetching admin balance for admin_id 1...");
          const admin = await tx.admin.findUnique({
            where: { id: 1 },
            select: { balance: true },
          });
          if (!admin) {
            throw new Error("Admin with ID 1 not found");
          }

          const currentBalance = admin.balance || 0;
          console.log("Current admin balance:", currentBalance);

          // 3. Check if balance is sufficient
          const newBalance = currentBalance - totalCharges;
          if (newBalance < 0) {
            throw new Error(
              `Insufficient balance for admin 1. Current: ${currentBalance}, Required: ${totalCharges}`
            );
          }

          // 4. Create ShowRoom_Vehicle records
          console.log("Creating ShowRoom_Vehicle records...");
          const savedVehicles = await Promise.all(
            processedData.map(async (vehicle) => {
              // Validate required fields
              if (!vehicle.vehicleNo || !vehicle.date || !vehicle.admin_id) {
                throw new Error(
                  `Missing required fields for vehicleNo: ${vehicle.vehicleNo}`
                );
              }

              // Ensure numeric fields are valid
              const Transport_charges = parseFloat(vehicle.Transport_charges) || 0;
              const othercharges = parseFloat(vehicle.othercharges) || 0;
              const totalAmount = parseFloat(vehicle.totalAmount) || 0;
              const vRepair_charges = parseFloat(vehicle.vRepair_charges) || 0;
              const vamount = parseFloat(vehicle.vamount) || 0;
              const vtotalAmount = parseFloat(vehicle.vtotalAmount) || 0;

              return await tx.showRoom_Vehicle.create({
                data: {
                  vehicleNo: parseInt(vehicle.vehicleNo),
                  date: new Date(vehicle.date), // Convert to Date object
                  Transport_charges,
                  othercharges,
                  totalAmount,
                  vRepair_charges,
                  vamount,
                  vtotalAmount,
                  imagePath: vehicle.imagePath || "", // Default to empty string if not provided
                  admin_id: 1, // Enforce admin_id as 1
                },
              });
            })
          );
          console.log("ShowRoom_Vehicle records created:", savedVehicles);

          // 5. Update admin balance for admin_id 1
          console.log("Updating admin balance for admin_id 1...");
          await tx.admin.update({
            where: { id: 1 },
            data: { balance: newBalance },
          });
          console.log("Updated admin balance:", newBalance);

          // 6. Create a Ledger entry for the transaction
          console.log("Creating Ledger entry for admin_id 1...");
          await tx.ledger.create({
            data: {
              admin_id: 1,
              debit: 0.0, // Amount deducted
              credit: totalCharges, // No credit in this transaction
              balance: newBalance, // New balance after deduction
              description: `Showroom vehicle charges for ${savedVehicles.length} vehicles (Vehicle Nos: ${processedData
                .map((v) => v.vehicleNo)
                .join(", ")})`,
              transaction_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
          console.log("Ledger entry created");

          return savedVehicles;
        } catch (innerError) {
          console.error("Transaction inner error:", innerError.message, innerError.stack);
          throw innerError; // Re-throw to rollback transaction
        }
      },
      {
        maxWait: 10000, // 10 seconds to acquire a connection
        timeout: 20000, // 20 seconds for the transaction to complete
      }
    );

    return NextResponse.json(
      {
        status: true,
        message: `Saved ${result.length} vehicles, updated admin balance, and created ledger entry`,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    
    return NextResponse.json(
      { status: false, error: error.message || "Failed to save vehicles" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}





  export async function GET(req) {
    try {
      // Fetch all ShowRoom_Vehicle records
      const vehicles = await prisma.showRoom_Vehicle.findMany({
        include: {
          Admin: true, // Include Admin details if needed (optional)
        },
        orderBy: {
          createdAt: "desc", // Order by creation date, newest first
        },
      });
  
      return NextResponse.json({ status: true, data: vehicles }, { status: 200 });
    } catch (error) {
      console.error("Error fetching showroom vehicle records:", error);
      return NextResponse.json(
        { status: false, error: "Failed to fetch showroom vehicle records" },
        { status: 500 }
      );
    }
  } 