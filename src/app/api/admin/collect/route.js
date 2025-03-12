import { NextResponse } from "next/server";
import prisma from "@/utils/prisma"; // Adjust path to your Prisma client

export async function POST(request) {
  try {
    const portCollectData = await request.json();
    console.log("Received portCollectData:", JSON.stringify(portCollectData, null, 2));

    // Validate input
    if (!Array.isArray(portCollectData) || portCollectData.length === 0) {
      return NextResponse.json(
        { status: false, error: "Invalid or empty data erat" },
        { status: 400 }
      );
    }

    // Start a transaction with increased timeout
    const result = await prisma.$transaction(
      async (tx) => {
        try {
          // 1. Create PortCollect records
          console.log("Step 1: Creating PortCollect records...");
          const portCollectResult = await tx.portCollect.createMany({
            data: portCollectData.map((item) => ({
              vehicleNo: item.vehicleNo,
              date: new Date(item.date),
              freight_amount: item.freight_amount,
              port_charges: item.port_charges,
              clearingcharges: item.clearingcharges,
              othercharges: item.othercharges,
              totalAmount: item.totalAmount,
              vamount: item.vamount,
              invoiceno: item.invoiceno,
              imagePath: item.imagePath,
              admin_id: item.admin_id,
            })),
            skipDuplicates: true,
          });
          console.log("PortCollect records created:", portCollectResult.count);

          // 2. Update Admin balance and create Ledger entries
          const adminIds = [...new Set(portCollectData.map((item) => item.admin_id))];
          for (const adminId of adminIds) {
            const totalNewBalance = portCollectData
              .filter((item) => item.admin_id === adminId)
              .reduce((sum, item) => sum + item.totalAmount, 0);

            // Fetch current admin balance
            console.log(`Step 2a: Fetching admin ${adminId}...`);
            const admin = await tx.admin.findUnique({
              where: { id: adminId },
            });
            if (!admin) {
              throw new Error(`Admin with ID ${adminId} not found`);
            }

            const currentBalance = admin.balance || 0;
            const newBalance = currentBalance + totalNewBalance;

            // Update Admin balance
            console.log(`Step 2b: Updating balance for admin ${adminId}...`);
            await tx.admin.update({
              where: { id: adminId },
              data: { balance: newBalance },
            });
            console.log(`Updated balance for admin ${adminId}: ${newBalance}`);

            // Create Ledger entries
            console.log(`Step 2c: Creating Ledger entries for admin ${adminId}...`);
            const ledgerEntries = portCollectData
              .filter((item) => item.admin_id === adminId)
              .map((item) => ({
                admin_id: item.admin_id,
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
            console.log(`Ledger entries created for admin ${adminId}`);
          }

          // 3. Update AddVehicle status to "Collect"
          const vehicleNos = portCollectData.map((item) => item.vehicleNo);
          console.log("Step 3: Updating AddVehicle status...", vehicleNos);
          const vehicleUpdateResult = await tx.addVehicle.updateMany({
            where: {
              id: { in: vehicleNos.map((no) => parseInt(no, 10)) }, // Assuming vehicleNo matches AddVehicle.id
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
      message: `Saved ${result.count} records, updated balances, added ledger entries, and set vehicle status to Collect`,
    });
  } catch (error) {
    console.error("Error saving port collect data:", error.message, error.stack);
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
