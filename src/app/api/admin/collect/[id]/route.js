import { NextResponse } from "next/server";
import prisma from "@/utils/prisma"; // Adjust path to your Prisma client

export async function GET(request, { params }) {
    const { slug } = params; // Extract slug from URL
  
    try {
      // Fetch PortCollect record by invoiceno (slug)
      const collectRecord = await prisma.portCollect.findFirst({
        where: { invoiceno: slug },
      });
  
      if (!collectRecord) {
        return NextResponse.json(
          { status: false, error: `Collect record with invoice ${slug} not found` },
          { status: 404 }
        );
      }
  
      // Parse vehicleNos from the vehicleNo field (assuming it's a comma-separated string)
      const vehicleNos = collectRecord.vehicleNo
        .split(",")
        .map((no) => parseInt(no.trim()));
  
      // Fetch associated vehicles
      const vehicles = await prisma.addVehicle.findMany({
        where: {
          id: { in: vehicleNos }, // Assuming vehicleNo matches AddVehicle.id
        },
        select: {
          id: true,
          chassisNo: true,
          maker: true,
          year: true,
          color: true,
          status: true,
        },
      });
  
      // Combine data into a single response
      const responseData = {
        collect: {
          id: collectRecord.id,
          invoiceno: collectRecord.invoiceno,
          date: collectRecord.date,
          freight_amount: collectRecord.freight_amount,
          port_charges: collectRecord.port_charges,
          clearingcharges: collectRecord.clearingcharges,
          othercharges: collectRecord.othercharges,
          totalAmount: collectRecord.totalAmount,
          vamount: collectRecord.vamount,
          imagePath: collectRecord.imagePath,
          admin_id: collectRecord.admin_id,
          createdAt: collectRecord.createdAt,
          updatedAt: collectRecord.updatedAt,
        },
        vehicles: vehicles,
      };
  
      return NextResponse.json({ status: true, data: responseData });
    } catch (error) {
      console.error("GET collect by slug error:", error);
      return NextResponse.json(
        { status: false, error: "Internal Server Error: " + error.message },
        { status: 500 }
      );
    }
  }