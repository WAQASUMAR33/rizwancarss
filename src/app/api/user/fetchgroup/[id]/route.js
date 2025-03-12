import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    const id = params.id;

    if (!id || isNaN(id)) {
        return NextResponse.json({
            success: false,
            message: "Invalid ID parameter",
            status: 400
        });
    }

    try {
        const group = await prisma.FlightGroups.findUnique({
            where: {
                id: parseInt(id)
            }
        });

        if (group) {
            return NextResponse.json({
                success: true,
                message: "Group fetched successfully",
                status: 200,
                data: group
            });
        } else {
            return NextResponse.json({
                success: false,
                message: "Group not found",
                status: 404
            });
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "An error occurred while fetching the group",
            status: 500,
            error: error.message
        });
    }
}