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
    // Start a transaction to ensure atomicity for User, CusLedger, Admin, and Ledger updates
    const result = await prisma.$transaction(async (tx) => {
      console.log(`Time to start transaction: ${Date.now() - transactionStartTime}ms`);

      // --- User and CusLedger Logic (Existing) ---
      // Fetch the user's current balance
      const userFetchStart = Date.now();
      const user = await tx.user.findUnique({
        where: { id: parseInt(user_id) },
        select: { id: true, balance: true },
      });
      console.log(`Time to fetch user: ${Date.now() - userFetchStart}ms`);

      if (!user) {
        throw new Error('User not found');
      }

      const currentBalance = user.balance || 0.0;
      const balanceAdjustment = type === 'IN' ? transactionAmount : -transactionAmount;
      const newUserBalance = currentBalance + balanceAdjustment;

      if (type === 'OUT' && newUserBalance < 0) {
        throw new Error('Insufficient balance for this transaction');
      }

      // Create CusLedger entry
      const ledgerCreateStart = Date.now();
      const cusLedgerEntry = await tx.cusLedger.create({
        data: {
          user_id: parseInt(user_id),
          in_amount: type === 'IN' ? transactionAmount : 0.0,
          out_amount: type === 'OUT' ? transactionAmount : 0.0,
          balance: newUserBalance,
          description,
          added_by: parseInt(added_by),
        },
      });
      console.log(`Time to create CusLedger entry: ${Date.now() - ledgerCreateStart}ms`);

      // Update user balance
      const userUpdateStart = Date.now();
      const updatedUser = await tx.user.update({
        where: { id: parseInt(user_id) },
        data: {
          balance: {
            increment: balanceAdjustment,
          },
        },
        select: { id: true, balance: true },
      });
      console.log(`Time to update user balance: ${Date.now() - userUpdateStart}ms`);

      // --- Admin and Ledger Logic (New) ---
      // Fetch Admin balance for admin_id = 1
      const adminFetchStart = Date.now();
      const admin = await tx.admin.findUnique({
        where: { id: 1 }, // Fixed admin_id = 1
        select: { id: true, balance: true },
      });
      console.log(`Time to fetch admin: ${Date.now() - adminFetchStart}ms`);

      if (!admin) {
        throw new Error('Admin with ID 1 not found');
      }

      const currentAdminBalance = admin.balance || 0.0;
      // Admin balance increases for OUT (money received), decreases for IN (money given)
      const adminBalanceAdjustment = type === 'OUT' ? transactionAmount : -transactionAmount;
      const newAdminBalance = currentAdminBalance + adminBalanceAdjustment;

      if (type === 'IN' && newAdminBalance < 0) {
        throw new Error('Insufficient admin balance for this transaction');
      }

      // Update Admin balance
      const adminUpdateStart = Date.now();
      const updatedAdmin = await tx.admin.update({
        where: { id: 1 },
        data: {
          balance: {
            increment: adminBalanceAdjustment,
          },
        },
        select: { id: true, balance: true },
      });
      console.log(`Time to update admin balance: ${Date.now() - adminUpdateStart}ms`);

      // Create Ledger entry for admin
      const adminLedgerCreateStart = Date.now();
      const adminLedgerEntry = await tx.ledger.create({
        data: {
          admin_id: 1, // Fixed admin_id = 1
          debit: type === 'IN' ? transactionAmount : 0.0,  // IN is debit for admin (money out)
          credit: type === 'OUT' ? transactionAmount : 0.0, // OUT is credit for admin (money in)
          balance: newAdminBalance,
          description: `Transaction for user ${user_id}: ${description}`,
        },
      });
      console.log(`Time to create admin Ledger entry: ${Date.now() - adminLedgerCreateStart}ms`);

      return {
        cusLedgerEntry,
        updatedUser,
        adminLedgerEntry,
        updatedAdmin,
      };
    });

    console.log(`Total transaction time: ${Date.now() - transactionStartTime}ms`);

    return NextResponse.json(
      {
        message: 'Transaction recorded and balances updated successfully',
        status: true,
        data: {
          customer: { ledger: result.cusLedgerEntry, user: result.updatedUser },
          admin: { ledger: result.adminLedgerEntry, admin: result.updatedAdmin },
        },
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