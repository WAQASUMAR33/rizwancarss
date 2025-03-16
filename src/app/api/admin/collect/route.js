import { NextResponse } from "next/server";
import prisma from "@/utils/prisma"; // Adjust path to your Prisma client

export async function POST(request) {
  try {
    const portCollectData = await request.json();
    console.log("Received portCollectData:", JSON.stringify(portCollectData, null, 2));

    // Validate input
    if (!Array.isArray(portCollectData) || portCollectData.length === 0) {
      return NextResponse.json(
        { status: false, error: "Invalid or empty data" },
        { status: 400 }
      );
    }

    // Start a transaction with increased timeout
    const result = await prisma.$transaction(
      async (tx) => {
        try {
          // Enforce admin_id as 1 for all operations
          const processedData = portCollectData.map((item) => ({
            ...item,
            admin_id: 1, // Override admin_id to 1
          }));

          // 1. Create PortCollect records
          console.log("Step 1: Creating PortCollect records...");
          const portCollectResult = await tx.portCollect.createMany({
            data: processedData.map((item) => ({
              vehicleNo: parseInt(item.vehicleNo),
              date: new Date(item.date),
              freight_amount: item.freight_amount,
              port_charges: item.port_charges,
              clearingcharges: item.clearingcharges,
              othercharges: item.othercharges,
              totalAmount: item.totalAmount,
              vamount: item.vamount,
              invoiceno: item.invoiceno,
              imagePath: item.imagePath,
              admin_id: 1, // Ensure admin_id is 1
            })),
            skipDuplicates: true,
          });
          console.log("PortCollect records created:", portCollectResult.count);

          // 2. Update Admin balance and create Ledger entries for admin_id 1
          const totalNewBalance = processedData.reduce((sum, item) => sum + item.totalAmount, 0);

          // Fetch current admin balance for admin_id 1
          console.log("Step 2a: Fetching admin 1 balance...");
          const admin = await tx.admin.findUnique({
            where: { id: 1 },
          });
          if (!admin) {
            throw new Error("Admin with ID 1 not found");
          }

          const currentBalance = admin.balance || 0;
          const newBalance = currentBalance - totalNewBalance;

          // Check for sufficient balance
          if (newBalance < 0) {
            throw new Error(`Insufficient balance for admin 1. Current: ${currentBalance}, Required: ${totalNewBalance}`);
          }

          // Update Admin balance for admin_id 1
          console.log("Step 2b: Updating balance for admin 1...");
          await tx.admin.update({
            where: { id: 1 },
            data: { balance: newBalance },
          });
          console.log("Updated balance for admin 1:", newBalance);

          // Create Ledger entries for admin_id 1
          console.log("Step 2c: Creating Ledger entries for admin 1...");
          const ledgerEntries = processedData.map((item) => ({
            admin_id: 1,
            debit: 0.0,
            credit: item.totalAmount,
            balance: newBalance,
            description: `Collected charges for vehicle ${item.vehicleNo} (Invoice: ${item.invoiceno})`,
            transaction_at: new Date(),
          }));
          await tx.ledger.createMany({
            data: ledgerEntries,
            skipDuplicates: true,
          });
          console.log("Ledger entries created for admin 1");

          // 3. Update AddVehicle status to "Collect"
          const vehicleNos = processedData.map((item) => parseInt(item.vehicleNo, 10));
          console.log("Step 3: Updating AddVehicle status...", vehicleNos);
          const vehicleUpdateResult = await tx.addVehicle.updateMany({
            where: {
              id: { in: vehicleNos }, // Assuming vehicleNo matches AddVehicle.id
            },
            data: {
              status: "Collect",
            },
          });
          console.log("Vehicles updated to Collect:", vehicleUpdateResult.count);

          return portCollectResult;
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

    return NextResponse.json({
      status: true,
      message: `Saved ${result.count} records, updated balance for admin 1, added ledger entries, and set vehicle status to Collect`,
    });
  } catch (error) {
   
    return NextResponse.json(
      { status: false, error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}


export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      // Fetch single PortCollect record
      const record = await prisma.portCollect.findUnique({
        where: { id: parseInt(id) },
      });
      if (!record) {
        return NextResponse.json(
          { status: false, error: "Record not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ status: true, data: record });
    } else {
      // Fetch all PortCollect records
      const records = await prisma.portCollect.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ status: true, data: records });
    }
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { status: false, error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
