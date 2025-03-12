import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    const { id } = params;
    const admin = await prisma.admin.findUnique({
        where: { id: parseInt(id) }
    });
    
    if (!admin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }
    
    return NextResponse.json(admin.balance, { status: 200 });
}