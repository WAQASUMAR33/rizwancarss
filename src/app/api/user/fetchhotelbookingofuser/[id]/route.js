import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const id = params.id;
  try {
    const response = await prisma.hotelBooking.findMany({
      where: {
        agent_id: parseInt(id),
      },
      include: {
        Hotel:true,
        Users:true,
        Hoteliers:true,
        RoomType:true,
      }
    });
    
    if (response) {
      return NextResponse.json(response);
    }
  } catch (e) {
    return NextResponse.json(
      {
        message: 'Failed to fetch Hotel bookings',
        status: false,
        error: e.message,
      },
      { status: 500 }
    );
  }
}
