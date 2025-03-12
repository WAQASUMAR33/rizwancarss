import prisma from '../../../../../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export async function POST(request) {
  console.log("[CHECKPOINT 1] Distributer login API is called...");

  // Checkpoint 1: Verify incoming request data
  const data = await request.json();
  console.log("[CHECKPOINT 2] Payload received:", JSON.stringify(data, null, 2));

  const { username, password } = data;

  // Checkpoint 2: Input validation
  if (!username || !password) {
    console.log("[CHECKPOINT 3] Validation failed: Missing username or password");
    return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
  }

  try {
    // Checkpoint 3: Fetch user from database
    console.log("[CHECKPOINT 4] Querying database for user with username:", username);
    const user = await prisma.users.findFirst({
      where: { username },
    });

    if (!user) {
      console.log("[CHECKPOINT 5] User not found in database");
      return NextResponse.json({ message: "User does not exist" }, { status: 404 });
    }
    console.log("[CHECKPOINT 6] User found:", JSON.stringify(user, null, 2));

    // Checkpoint 4: Validate password
    console.log("[CHECKPOINT 7] Comparing password for user:", username);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("[CHECKPOINT 8] Password validation failed");
      return NextResponse.json({ message: "Invalid Password" }, { status: 401 });
    }
    console.log("[CHECKPOINT 9] Password validated successfully");

    // Checkpoint 5: Check email verification
    if (user.emailverification === "False") {
      console.log("[CHECKPOINT 10] Email not verified for user:", username);
      return NextResponse.json({ message: "Your Email is not Verified" }, { status: 401 });
    }
    console.log("[CHECKPOINT 11] Email verification passed");

    // Checkpoint 6: Check user status
    if (user.status === "Inactive") {
      console.log("[CHECKPOINT 12] Account inactive for user:", username);
      return NextResponse.json({ message: "Your Account is Deactivated" }, { status: 401 });
    }
    if (user.status === "Pending") {
      console.log("[CHECKPOINT 13] Account pending approval for user:", username);
      return NextResponse.json({ message: "Your Request is pending for approval from Admin" }, { status: 401 });
    }
    console.log("[CHECKPOINT 14] User status check passed:", user.status);

    // Checkpoint 7: Generate and verify JWT token
    const payload = { username: user.username, id: user.id, fullname: user.fullname, role: user.role };
    console.log("[CHECKPOINT 15] JWT payload:", JSON.stringify(payload, null, 2));
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
    console.log("[CHECKPOINT 16] JWT token generated:", token);

    // Verify token contents
    const decodedToken = jwt.verify(token, SECRET_KEY);
    console.log("[CHECKPOINT 17] Decoded JWT token:", JSON.stringify(decodedToken, null, 2));

    // Checkpoint 8: Prepare response
    const responseData = {
      success: true,
      message: "Login Successful",
      token,
      user: { username: user.username, id: user.id, fullname: user.fullname, role: user.role },
    };
    console.log("[CHECKPOINT 18] Response data:", JSON.stringify(responseData, null, 2));

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("[CHECKPOINT 19] Error during login:", error.message, error.stack);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}