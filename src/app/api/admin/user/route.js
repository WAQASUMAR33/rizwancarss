import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("payload for user", data);
    const { name, username, password, phoneno, city, address, bname, emailverification, status, role } = data;

    // Check if the username already exists
    const existingUser = await prisma.users.findFirst({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already taken. Please choose a different username.', status: false },
        { status: 400 }
      );
    }

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user in the database
    const newUser = await prisma.Users.create({
      data: {
        name,
        username,
        password: hashedPassword,
        phoneno,
        city,
        address,
        bname,
        emailverification,
        status,
        role,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      message: 'User registered successfully.',
      status: true,
      user: newUser,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        message: 'Failed to create user',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    const users = await prisma.Users.findMany();
    console.log('Fetched users:', users);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch users',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
