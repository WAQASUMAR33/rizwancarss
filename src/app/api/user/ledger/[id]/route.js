import prisma from '@/utils/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, {params}){
  const {id} = params;
  // console.log("-----The Id is -------",id)
  try {

    const ledgerEntries = await prisma.NewLedger.findMany({
      where:{
        agent_id: parseInt(id)
      },
      include: {
        Users: true,
        HotelBooking: {
          include:{
            Hotel:true,
            Hoteliers:true,
          }
        },
        FlightBookings: true,
        GroupFlightBookings: {
          include: {
            SingleGroupFlight: true,
            FlightGroups: true,
            FlightSector: true,
            FlightAirline: true,
            GroupPassengers: true,
            Users: true,
          },
        },
        PaymentRequests: true,
      },
      orderBy: {
        created_at: 'desc', 
      },
    });
    return NextResponse.json(ledgerEntries);
  } catch (error) {
   
    return NextResponse.json({
      message: 'Failed to fetch ledger entries',
      status: false,
      error: error.message,
    }, { status: 500 });
  }
}
