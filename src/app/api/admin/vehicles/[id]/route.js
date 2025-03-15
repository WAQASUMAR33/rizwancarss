// app/api/admin/vehicles/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function GET(request, { params }) {
  const { id } = params;

  try {
    const vehicleId = parseInt(id, 10);
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { message: "Invalid vehicle ID", status: false },
        { status: 400 }
      );
    }

    const vehicle = await prisma.addVehicle.findUnique({
      where: { id: vehicleId },
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
            createdAt: true,
          },
        },
        invoice: {
          select: {
            id: true,
            date: true,
            number: true,
            status: true,
            auctionHouse: true,
            imagePath: true,
            amountYen: true,
            amount_doller: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        admin: {
          select: {
            id: true,
            fullname: true,
            username: true,
          },
        },
        containerItems: {
          select: {
            id: true,
            itemNo: true,
            chassisNo: true,
            year: true,
            color: true,
            cc: true,
            amount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found", status: false },
        { status: 404 }
      );
    }

    // Fetch only amount-related fields from other models using chassisNo
    const [transport, inspection, portCollect, showroom, sale] =
      await Promise.all([
        prisma.transport.findFirst({
          where: { vehicleNo: vehicle.id.toString() },
          select: {
            amount: true,
            tenPercentAdd: true,
            totalamount: true,
            totaldollers: true,
          },
        }),
        prisma.inspection.findFirst({
          where: { vehicleNo: vehicle.id.toString() },
          select: {
            invoice_amount: true,
            invoice_tax: true,
            invoice_total: true,
            invoice_amount_dollers: true,
            vamount_doller: true,
          },
        }),
        prisma.portCollect.findFirst({
          where: { vehicleNo: vehicle.id.toString() },
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
          where: { vehicleNo: vehicle.chassisNo },
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
          where: { vehicleNo: vehicle.chassisNo },
          select: {
            commission_amount: true,
            othercharges: true,
            totalAmount: true,
            sale_price: true,
          },
        }),
      ]);

    // Combine all data into a detailed vehicle object with totalAmounts
    const detailedVehicle = {
      ...vehicle,
      transport: null, // Explicitly set to null to avoid including non-amount details
      inspection: null,
      portCollect: null,
      showroom: null,
      sale: null,
      totalAmounts: {
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
        invoice: vehicle.invoice
          ? {
              amountYen: vehicle.invoice.amountYen,
              amount_doller: vehicle.invoice.amount_doller,
            }
          : {},
        transport: transport || {},
        inspection: inspection || {},
        portCollect: portCollect || {},
        showroom: showroom || {},
        sale: sale || {},
        containerItems: vehicle.containerItems.map(item => ({ amount: item.amount })) || [],
      },
    };

    return NextResponse.json(
      {
        message: "Vehicle details and amounts fetched successfully",
        status: true,
        data: detailedVehicle,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error("Error fetching vehicle details and amounts:", error);

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