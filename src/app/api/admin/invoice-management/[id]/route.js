import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function PUT(request, { params }) {
  const { id } = params;
  const { imagePath } = await request.json();

  try {
    const updatedInvoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: { imagePath },
    });

    return NextResponse.json({ status: true, data: updatedInvoice });
  } catch (error) {
    console.error("Error updating invoice image:", error);
    return NextResponse.json(
      { status: false, error: "Failed to update invoice image" },
      { status: 500 }
    );
  }
}