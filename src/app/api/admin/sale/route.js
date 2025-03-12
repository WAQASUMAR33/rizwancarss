import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";


export async function POST(request) {
  try {
    const data = await request.json();

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
    const admin = await prisma.admin.findUnique({
      where: { id: data.admin_id },
      select: { id: true, balance: true }, // Fetch balance along with ID
    });
    if (!admin) {
      return NextResponse.json(
        { message: "Admin not found", error: true },
        { status: 404 }
      );
    }

    // Ensure vehicle exists and is not already sold
    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicleNo: data.vehicleNo },
    });
    if (!vehicle) {
      return NextResponse.json(
        { message: `Vehicle with vehicleNo ${data.vehicleNo} not found`, error: true },
        { status: 404 }
      );
    }
    if (vehicle.status === "Sold") {
      return NextResponse.json(
        { message: `Vehicle ${data.vehicleNo} is already sold`, error: true },
        { status: 400 }
      );
    }

    // Calculate amounts
    const salePrice = parseFloat(data.sale_price) || 0;
    const commissionAmount = parseFloat(data.commission_amount) || 0;
    const otherCharges = parseFloat(data.othercharges) || 0;
    const totalExpenses = commissionAmount + otherCharges;

    // Get the old balance
    const oldBalance = parseFloat(admin.balance) || 0;

    // Calculate new balance: old balance + sale price - (commission + other charges)
    const newBalance = oldBalance + salePrice - totalExpenses;

    // Use a transaction to ensure all operations succeed or fail together
    const [saleVehicle, updatedVehicle, ledgerEntryCredit, ledgerEntryDebit, updatedAdmin] =
      await prisma.$transaction([
        // Create the sale vehicle record
        prisma.sale_Vehicle.create({
          data: {
            admin_id: data.admin_id,
            vehicleNo: data.vehicleNo,
            date: new Date(data.date),
            commission_amount: commissionAmount,
            othercharges: otherCharges,
            totalAmount: salePrice, // Assuming totalAmount is sale_price in this context
            mobileno: data.mobileno || "",
            passportNo: data.passportNo || "",
            fullname: data.fullname || "",
            details: data.details || "",
            sale_price: salePrice,
            imagePath: data.imagePath || "",
          },
        }),

        // Update the vehicle status to "Sold"
        prisma.vehicle.update({
          where: { vehicleNo: data.vehicleNo },
          data: { status: "Sold" },
        }),

        // Ledger Entry 1: Credit sale amount to balance
        prisma.ledger.create({
          data: {
            admin_id: data.admin_id,
            debit: 0,
            credit: salePrice,
            balance: oldBalance + salePrice, // Balance after crediting sale price
            description: `Sale amount credited for vehicle ${data.vehicleNo}`,
            transaction_at: new Date(),
          },
        }),

        // Ledger Entry 2: Debit commission + other charges from balance
        prisma.ledger.create({
          data: {
            admin_id: data.admin_id,
            debit: totalExpenses,
            credit: 0,
            balance: newBalance, // Final balance after debiting expenses
            description: `Expenses (Commission: ${commissionAmount}, Other: ${otherCharges}) for vehicle ${data.vehicleNo} - ${data.details || "No details"}`,
            transaction_at: new Date(),
          },
        }),

        // Update admin balance
        prisma.admin.update({
          where: { id: data.admin_id },
          data: { balance: newBalance },
        }),
      ]);

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
   
    return NextResponse.json(
      { message: "Failed to save sale vehicle", error: true, details: error.message },
      { status: 500 }
    );
  }
}

  export async function GET(request) {
    try {
        // Fetch all sale vehicles
        const saleVehicles = await prisma.sale_Vehicle.findMany({
            orderBy: { createdAt: 'desc' }, // Optional: latest first
        });

        return NextResponse.json(
            {
                message: "Sale vehicles retrieved successfully",
                data: saleVehicles,
                error: false,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to fetch sale vehicles", error: true },
            { status: 500 }
        );
    }
}