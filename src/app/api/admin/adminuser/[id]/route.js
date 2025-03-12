import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    const admin = await prisma.admin.findUnique({ where: { id } });
    if (admin) {
      return NextResponse.json(admin);
    } else {
      return NextResponse.json({ error: 'Admin not found' });
    }
  } catch (error) {
    console.error('Error fetching admin user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT request to update a specific admin user by ID
export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { fullname, username, password, role } = body;

    // Ensure at least one field is provided
    if (!fullname && !username && !role && !password) {
      return NextResponse.json({ error: 'At least one field (fullname, username, password, or role) is required to update' }, { status: 400 });
    }

    // Hash the password if provided
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    }

    // Update the admin with the provided fields
    const updatedAdmin = await prisma.admin.update({
      where: { id: id },
      data: {
        fullname,
        username,
        password: hashedPassword || undefined,  // Only update password if provided
        role,
      },
    });

    return NextResponse.json(updatedAdmin);
  } catch (error) {
    console.error('Error updating admin user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    await prisma.admin.delete({ where: { id } });
    return NextResponse.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
