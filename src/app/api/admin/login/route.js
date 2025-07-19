import prisma from '../../../../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export async function POST(request) {
  try {
    // Log headers
    console.log("Request headers:", Object.fromEntries(request.headers));

    // Read raw body as text
    const rawBody = await request.text();
    console.log("Raw request body:", rawBody);

    // Attempt to parse JSON
    let data;
    try {
      data = JSON.parse(rawBody);
      console.log("Parsed payload:", data);
    } catch (error) {
      console.error("JSON parse error:", error.message);
      return NextResponse.json({
        message: "Invalid JSON payload",
      }, { status: 400 });
    }

    const { username, password } = data;

    // Rest of your existing code...
    if (!username || !password) {
      return NextResponse.json({
        message: "Username and password are required",
      }, { status: 400 });
    }

    const user = await prisma.admin.findFirst({
      where: { username },
    });

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

    if (user.emailverification === "False") {
      return NextResponse.json({
        message: "Your Email is not Verified",
      }, { status: 401 });
    }

    if (user.status === "Inactive") {
      return NextResponse.json({
        message: "Your Account is Deactivated",
      }, { status: 401 });
    }

    if (user.status === "Pending") {
      return NextResponse.json({
        message: "Your Request is Pending",
      }, { status: 401 });
    }

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
    console.error("Error in login route:", error);
    return NextResponse.json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    }, { status: 500 });
  }
}