import { NextResponse } from 'next/server';
import { sendVerificationEmail } from '../../../../../utils/sendverificationemail';
import prisma from '@/utils/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; // For generating secure tokens

// Function to generate a random token
function generaterandomtoken() {
    return crypto.randomBytes(32).toString('hex'); // Generates a 64-character random token
}

export async function POST(request) {
    try {
        const data = await request.json();
        console.log("Payload for user:", data);
        const { name, username, password, phoneno, city, address, bname,role } = data;

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

        // Generate a verification token
        const token = generaterandomtoken();

        // Send verification email
        const emailSent = await sendVerificationEmail(username, token);
        if (emailSent) {
            // Create the new user in the database
            const newUser = await prisma.users.create({
                data: {
                    name,
                    username,
                    password: hashedPassword,
                    phoneno,
                    city,
                    address,
                    bname,
                    emailverification: "False",
                    status: "Pending",
                    token,
                    role,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            return NextResponse.json({
                message: 'User registered successfully. Please verify your email.',
                status: true,
                user: newUser,
            });
        } else {
            return NextResponse.json(
                { message: 'Failed to send email verification.', status: false },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in user registration:', error);
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
