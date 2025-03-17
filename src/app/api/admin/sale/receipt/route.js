import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function GET(request, { params }) {
  const { id } = params;

  try {
    const sale = await prisma.sale_Vehicle.findUnique({
      where: { id: parseInt(id) },
      include: {
        vehicle: true, // Include related AddVehicle data
      },
    });

    if (!sale) {
      return NextResponse.json(
        { status: false, error: `Sale record with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: true, data: sale });
  } catch (error) {
    console.error("Error fetching sale record:", error);
    return NextResponse.json(
      { status: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}