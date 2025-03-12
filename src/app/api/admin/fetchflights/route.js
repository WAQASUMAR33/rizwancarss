import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
export async function GET(request){
    try {
        const flights = await prisma.flightDetails.findMany({
            include:{
                SingleFlight:true
            }
        })
        if(flights){
            return NextResponse.json({data:flights,message:"Data fetched Successfully!",status:200})
        }
        else{
            return NextResponse.json({data:[],message:"No data found!",status:404})
            }
        
    } catch (error) {
        return NextResponse.json({data:[],message:error,status:500})
    }
}