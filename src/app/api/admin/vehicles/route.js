// app/api/admin/vehicles/route.js
import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function GET() {
  try {
    const vehicles = await prisma.addVehicle.findMany({
      include: {
        seaPort: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        vehicleImages: {
          select: {
            id: true,
            imagePath: true,
          },
        },
        invoice: {
          select: {
            id: true,
            amountYen: true,
            amount_doller: true,
          },
        },
        admin: {
          select: {
            id: true,
            fullname: true, // Changed from 'name' to 'fullname' based on available fields
            // You can add other fields like 'username' or 'role' if needed
          },
        },
        containerItems: {
          select: {
            amount: true,
          },
        },
      },
      where: {
        OR: [
          { id: { gte: 0 } }, // This ensures we get all vehicles
        ],
      },
    });

    // Fetch related data from other models
    const enhancedVehicles = await Promise.all(
      vehicles.map(async (vehicle) => {
        const [transport, inspection, portCollect, showroom, sale] =
          await Promise.all([
            prisma.transport.findFirst({
              where: { vehicleNo: vehicle.id },
              select: {
                amount: true,
                tenPercentAdd: true,
                totalamount: true,
                totaldollers: true,
                v_amount:true,
              },
            }),
            prisma.inspection.findFirst({
              where: { vehicleNo: vehicle.id },
              select: {
                invoice_amount: true,
                invoice_tax: true,
                invoice_total: true,
                invoice_amount_dollers: true,
                vamount_doller: true,
              },
            }),
            prisma.portCollect.findFirst({
              where: { vehicleNo: vehicle.id },
              select: {
                freight_amount: true,
                port_charges: true,
                clearingcharges: true,
                othercharges: true,
                totalAmount: true,
                vamount: true,
              },
            }),
            prisma.showRoom_Vehicle.findFirst({
              where: { vehicleNo: vehicle.id },
              select: {
                Transport_charges: true,
                othercharges: true,
                totalAmount: true,
                vRepair_charges: true,
                vamount: true,
                vtotalAmount: true,
              },
            }),
            prisma.sale_Vehicle.findFirst({
              where: { vehicleNo: vehicle.id },
              select: {
                commission_amount: true,
                othercharges: true,
                totalAmount: true,
                sale_price: true,
              },
            }),
          ]);

        // Calculate total amounts across all models
        const totalAmounts = {
          addVehicle: {
            auction_amount: vehicle.auction_amount,
            tenPercentAdd: vehicle.tenPercentAdd,
            recycleAmount: vehicle.recycleAmount,
            bidAmount: vehicle.bidAmount,
            commissionAmount: vehicle.commissionAmount,
            numberPlateTax: vehicle.numberPlateTax,
            repairCharges: vehicle.repairCharges,
            totalAmount_yen: vehicle.totalAmount_yen,
            totalAmount_dollers: vehicle.totalAmount_dollers,
            additionalAmount: vehicle.additionalAmount,
          },
          invoice: vehicle.invoice || {},
          transport: transport || {},
          inspection: inspection || {},
          portCollect: portCollect || {},
          showroom: showroom || {},
          sale: sale || {},
        };

        return {
          ...vehicle,
          totalAmounts,
        };
      })
    );

    if (!enhancedVehicles || enhancedVehicles.length === 0) {
      return NextResponse.json(
        {
          message: "No vehicles found",
          status: true,
          data: [],
        },
        { status: 200 }
      );
    }

    console.log(
      "Fetched enhanced vehicles:",
      JSON.stringify(enhancedVehicles, null, 2)
    );

    return NextResponse.json(
      {
        message: "Vehicles fetched successfully with all amounts",
        status: true,
        data: enhancedVehicles,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

 

    return NextResponse.json(
      {
        message: "Unexpected server error occurred",
        status: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}