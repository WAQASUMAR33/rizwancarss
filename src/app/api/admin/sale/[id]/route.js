import { NextResponse } from "next/server";
import prisma from "@/utils/prisma"; // Adjust path to your Prisma client



export async function GET(req, { params }) {
    console.log("Params before resolving:", params); // Debug log
  
    // If params is a Promise, await it (workaround for Next.js issue)
    const resolvedParams = params instanceof Promise ? await params : params;
    console.log("Resolved Params:", resolvedParams);
  
    const { id } = resolvedParams; // Destructure 'id', not 'slug'
  
    try {
      if (!id) {
        return NextResponse.json(
          { status: false, error: "ID parameter is required" },
          { status: 400 }
        );
      }
  
      // Convert the ID to an integer
      const vehicleId = parseInt(id);
      if (isNaN(vehicleId)) {
        return NextResponse.json(
          { status: false, error: "ID must be a valid numeric value" },
          { status: 400 }
        );
      }
  
      // Fetch the ShowRoom_Vehicle record by ID, including all dependent data
      const vehicle = await prisma.Sale_Vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          Admin: true, // Include the related Admin data
        },
      });
  
      if (!vehicle) {
        return NextResponse.json(
          { status: false, error: `No vehicle record found for ID: ${vehicleId}` },
          { status: 404 }
        );
      }
  
      return NextResponse.json({ status: true, data: vehicle }, { status: 200 });
    } catch (error) {
      console.error("Error fetching showroom vehicle record:", error);
      return NextResponse.json(
        { status: false, error: "Failed to fetch showroom vehicle record" },
        { status: 500 }
      );
    }
  }