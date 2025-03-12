import prisma from '@/utils/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const id =  parseInt(params.id);
  try {
    const user = await prisma.Users.findUnique({
      where: { id },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.log("Error fetching user:", error);
    return NextResponse.json(
      { message: "Internal Server Error", status: false },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const id = parseInt(params.id);
  try {
    const data = await request.json();
    const { action } = data;

    let status;
    if (action === 'activate') {
      status = 1;
    } else if (action === 'deactivate') {
      status = 0;
    } else {
      return NextResponse.json(
        { message: "Invalid action", status: false },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.log("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error", status: false },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const id = parseInt(params.id);
  try {
    const deleteUser = await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json(deleteUser);
  } catch (error) {
    console.log("Error deleting user:", error);
    return NextResponse.json(
      { message: "Internal Server Error", status: false },
      { status: 500 }
    );
  }
}
