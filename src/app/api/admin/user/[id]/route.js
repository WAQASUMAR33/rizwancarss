import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import bcrypt from 'bcryptjs';

// GET request to fetch a specific admin user by ID
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    const admin = await prisma.users.findUnique({ where: { id } });
    if (admin) {
      return NextResponse.json(admin);
    } else {
      return NextResponse.json({ error: 'Agent not found' });
    }
  } catch (error) {
    console.error('Error fetching agent user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT request to update a specific admin user by ID
export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, username, password, phoneno, city, address, bname , emailverification, status , role   } = body;

 
    // Hash the password if provided
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    }

    // Update the admin with the provided fields
    const updatedAdmin = await prisma.users.update({
      where: { id: id },
      data: {
        name, username, password, phoneno, city, address, bname, emailverification, status, role,
        password: hashedPassword || undefined,  // Only update password if provided
        
      },
    });

    return NextResponse.json(updatedAdmin);
  } catch (error) {
    console.error('Error updating admin user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE request to delete a specific admin user by ID
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    await prisma.users.delete({ where: { id } });
    return NextResponse.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
