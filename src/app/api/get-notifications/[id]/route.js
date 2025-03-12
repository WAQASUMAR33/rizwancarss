import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function GET(request,{ params }) {
    const id = params.id; // Extract 'id' from dynamic route params

    console.log("The id is : ",id);
    if (!id) {
        return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    try {
        const notifications = await prisma.Notifications.findMany({
            where: {
                user_id: parseInt(id), // Use the extracted user ID
            },
        });

        if (notifications.length > 0) {
            return NextResponse.json({ success: true, data: notifications, status: 200 });
        } else {
            return NextResponse.json({ success: false, message: "No notifications found", status: 404 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: "Error fetching notifications", error: error.message }, { status: 500 });
    }
}
