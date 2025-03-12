import prisma from '../../../../utils/prisma'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';


const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export async function POST(request) {
  const data = await request.json();
  const { username, password } = data;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({
        message: "User does not exist",
      }, { status: 404 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({
        message: "Please verify your email before logging in.",
      }, { status: 403 });
    }

    if (user.status != 1) {
      return NextResponse.json({
        message: "Your email has been deactivated",
      }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({
        message: "Invalid Password",
      }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign({ username: user.username, id: user.id, fullname:user.fullname, role: user.role}, SECRET_KEY, {
      expiresIn: '1h' // token will expire in 1 hour
    });

    return NextResponse.json({
      success: true,
      message: "Login Successfully",
      token,
      user: { username: user.username, id: user.id, fullname:user.fullname, role: user.role }, // Return the user details
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
