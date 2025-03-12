import prisma from '../../../../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export async function POST(request) {
  const data = await request.json();
  console.log("Payload is ", data);

  const { username, password } = data;

  // Input validation
  if (!username || !password) {
    return NextResponse.json({
      message: "Username and password are required",
    }, { status: 400 });
  }

  try {
    const user = await prisma.admin.findFirst({
      where: { username },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json({
        message: "User does not exist",
      }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({
        message: "Invalid Password",
      }, { status: 401 });
    }

    if(user.emailverification === "False"){
      return NextResponse.json({
        message: "Your Email is not Verified",
      }, { status: 401 });
    }

    if(user.status === "Inactive"){
      return NextResponse.json({
        message: "Your Account is Deactivated",
      }, { status: 401 });
    }

    if(user.status === "Pending"){
      return NextResponse.json({
        message: "Your Request is Pending",
      }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: user.username, id: user.id, fullname: user.fullname, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' } 
    );

    return NextResponse.json({
      success: true,
      message: "Login Successful",
      token,
      user: { username: user.username, id: user.id, fullname: user.fullname, role: user.role },
    });

  } catch (error) {
    console.error('Error during login:', error);

    // Return detailed error response
    return NextResponse.json({
      message: 'Internal server error',
      error: error.message,
    }, { status: 500 });
  }
}
