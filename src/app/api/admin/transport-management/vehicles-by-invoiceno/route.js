import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function GET(request) {
    try {
      const { searchParams } = new URL(request.url);
      const invoiceno = searchParams.get("invoiceno");
  
      if (!invoiceno) {
        return NextResponse.json(
          { error: "Invoice number is required", status: false },
          { status: 400 }
        );
      }
  
      console.log(`Fetching transports with invoiceno: ${invoiceno}`);
  
      // Raw SQL query
      const result = await prisma.$queryRaw`
        SELECT 
          Transport.v_amount,
          Transport.vehicleNo,
          Transport.paid_status,
          AddVehicle.chassisNo,
          AddVehicle.maker,
          AddVehicle.id,
          AddVehicle.year,
          AddVehicle.color
        
        FROM 
          Transport
        LEFT JOIN 
          AddVehicle
        ON 
         Transport.vehicleNo = AddVehicle.id
        WHERE 
          Transport.invoiceno = ${invoiceno};
      `;
  
      if (!result || result.length === 0) {
        return NextResponse.json(
          {
            message: "No transports found for this invoice number",
            status: true,
            data: [],
          },
          { status: 200 }
        );
      }
  
    
      return NextResponse.json(
        {
          message: "Vehicles fetched successfully",
          status: true,
          data: result,
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