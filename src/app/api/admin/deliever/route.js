import { NextResponse } from "next/server";
import prisma from "@/utils/prisma"; // Adjust path to your Prisma client

export async function POST(req) {
    try {
      const vehicleData = await req.json();
  
      if (!Array.isArray(vehicleData) || vehicleData.length === 0) {
        return NextResponse.json({ status: false, error: "Invalid or empty vehicle data" }, { status: 400 });
      }
  
      const savedVehicles = await Promise.all(
        vehicleData.map(async (vehicle) => {
          // Validate required fields
          if (!vehicle.vehicleNo || !vehicle.date || !vehicle.admin_id) {
            throw new Error(`Missing required fields for vehicleNo: ${vehicle.vehicleNo}`);
          }
  
          // Ensure numeric fields are valid
          const Transport_charges = parseFloat(vehicle.Transport_charges) || 0;
          const othercharges = parseFloat(vehicle.othercharges) || 0;
          const totalAmount = parseFloat(vehicle.totalAmount) || 0;
          const vRepair_charges = parseFloat(vehicle.vRepair_charges) || 0;
          const vamount = parseFloat(vehicle.vamount) || 0;
          const vtotalAmount = parseFloat(vehicle.vtotalAmount) || 0;
  
          return await prisma.showRoom_Vehicle.create({
            data: {
              vehicleNo: vehicle.vehicleNo,
              date: new Date(vehicle.date), // Convert to Date object
              Transport_charges,
              othercharges,
              totalAmount,
              vRepair_charges,
              vamount,
              vtotalAmount,
              imagePath: vehicle.imagePath || "", // Default to empty string if not provided
              admin_id: vehicle.admin_id,
            },
          });
        })
      );
  
      return NextResponse.json({ status: true, data: savedVehicles }, { status: 201 });
    } catch (error) {
     
      return NextResponse.json({ status: false, error: error.message || "Failed to save vehicles" }, { status: 500 });
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