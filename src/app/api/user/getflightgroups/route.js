import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const groups = await prisma.flightGroups.findMany();
        if (groups) {
            return NextResponse.json(groups);
        }
        return NextResponse.json({ message: "No flight groups found", status: false }, { status: 404 });

    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error", status: false }, {status: 500})

    }
}