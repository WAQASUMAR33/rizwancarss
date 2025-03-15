// app/api/admin/cus-ledger/route.js
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function GET(request) {
  try {
    const ledgers = await prisma.cusLedger.findMany({
      include: {
        user: true, // Include related user data
      },
      orderBy: {
        id: 'desc', // Order by id in descending order
      },
    });
    return NextResponse.json(
      {
        message: 'CusLedger records fetched successfully',
        status: true,
        data: ledgers,
      },
      { status: 200 }
    );
  } catch (error) {
   
    return NextResponse.json(
      { message: 'Failed to fetch CusLedger records', status: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log('Received POST request to /api/admin/cus-ledger');
    const startTime = Date.now();
    const body = await request.json();
    const { user_id, type, amount, description, added_by } = body;

    console.log(`Time to parse request body: ${Date.now() - startTime}ms`);

    // Validate required fields
    if (!user_id || !type || !amount || !description || !added_by) {
      return NextResponse.json(
        { message: 'Missing required fields: user_id, type, amount, description, or added_by', status: false },
        { status: 400 }
      );
    }

    // Validate transaction type
    if (type !== 'IN' && type !== 'OUT') {
      return NextResponse.json(
        { message: 'Type must be IN or OUT', status: false },
        { status: 400 }
      );
    }

    // Validate amount
    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be a positive number', status: false },
        { status: 400 }
      );
    }

    console.log('Starting transaction...');
    const transactionStartTime = Date.now();
    // Start a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      console.log(`Time to start transaction: ${Date.now() - transactionStartTime}ms`);

      // Fetch the user's current balance with minimal fields
      const userFetchStart = Date.now();
      const user = await tx.user.findUnique({
        where: { id: parseInt(user_id) },
        select: { id: true, balance: true }, // Fetch only necessary fields
      });
      console.log(`Time to fetch user: ${Date.now() - userFetchStart}ms`);

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate the new balance based on the user's current balance
      const currentBalance = user.balance || 0.0;
      const balanceAdjustment = type === 'IN' ? transactionAmount : -transactionAmount;
      const newBalance = currentBalance + balanceAdjustment;

      // Validate sufficient balance for OUT transactions
      if (type === 'OUT' && newBalance < 0) {
        throw new Error('Insufficient balance for this transaction');
      }

      // Create CusLedger entry with the calculated balance
      const ledgerCreateStart = Date.now();
      const ledgerEntry = await tx.cusLedger.create({
        data: {
          user_id: parseInt(user_id),
          in_amount: type === 'IN' ? transactionAmount : 0.0, // Corrected field name
          out_amount: type === 'OUT' ? transactionAmount : 0.0,
          balance: newBalance, // Store the running balance
          description,
          added_by: parseInt(added_by),
        },
      });
      console.log(`Time to create ledger entry: ${Date.now() - ledgerCreateStart}ms`);

      // Update user balance
      const userUpdateStart = Date.now();
      const updatedUser = await tx.user.update({
        where: { id: parseInt(user_id) },
        data: {
          balance: {
            increment: balanceAdjustment,
          },
        },
        select: { id: true, balance: true }, // Fetch only necessary fields
      });
      console.log(`Time to update user balance: ${Date.now() - userUpdateStart}ms`);

      return { ledgerEntry, updatedUser };
    });

    console.log(`Total transaction time: ${Date.now() - transactionStartTime}ms`);

    return NextResponse.json(
      {
        message: 'Transaction recorded and balance updated successfully',
        status: true,
        data: { ledger: result.ledgerEntry, user: result.updatedUser },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing transaction:', error.message, error.stack);
    return NextResponse.json(
      { message: 'Failed to process transaction', status: false, error: error.message },
      { status: 500 }
    );
  }
}