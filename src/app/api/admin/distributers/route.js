// app/api/distributors/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, location, username, password, balance, status } = body;

    if (!name || !location || !username || !password || balance === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields: name, location, username, password, or balance', status: false },
        { status: 400 }
      );
    }

    const createdDistributor = await prisma.Distributor.create({
      data: {
        name,
        location,
        username,
        password,
        balance: parseFloat(balance),
        status: status || 'ACTIVE',
      },
    });

    return NextResponse.json(
      { message: 'Distributor created successfully', status: true, data: createdDistributor },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return NextResponse.json(
        { message: 'Username already exists', status: false },
        { status: 400 }
      );
    }
    console.error('Error creating distributor:', error.message);
    return NextResponse.json(
      { message: 'Failed to create distributor', status: false, error: error.message },
      { status: 500 }
    );
  }
}

// ✅ GET: Fetch all distributors
export async function GET() {
  try {
    const distributors = await prisma.Distributor.findMany({
      orderBy: { createdAt: 'desc' }, // Optional: sort by creation date
    });

    return NextResponse.json(distributors); // Keep as array per your original code
  } catch (error) {
    console.error('Error fetching distributors:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch distributors',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}