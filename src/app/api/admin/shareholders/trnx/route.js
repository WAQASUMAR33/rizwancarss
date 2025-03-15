// app/api/admin/shareholders/trnx/route.js
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// ✅ GET: Fetch all ShareHoldersLedger records
export async function GET(request) {
  try {
    const ledgers = await prisma.shareHoldersLedger.findMany({
      include: {
        shareholder: true, // Include related ShareHolders data
      },
      orderBy: {
        id: 'desc', // Order by id in descending order
      },
    });
    return NextResponse.json(
      {
        message: 'ShareHoldersLedger records fetched successfully',
        status: true,
        data: ledgers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching ShareHoldersLedger records:', error);
    return NextResponse.json(
      { message: 'Failed to fetch ShareHoldersLedger records', status: false, error: error.message },
      { status: 500 }
    );
  }
}

// ✅ POST: Create a new ShareHoldersLedger entry
// app/api/admin/shareholders/trnx/route.js


// POST: Create a new ShareHoldersLedger entry and update Admin balance/Ledger
export async function POST(request) {
  try {
    console.log('Received POST request to /api/admin/shareholders/trnx');
    const startTime = Date.now();
    const body = await request.json();
    const { shareholder_id, type, amount, description, added_by } = body;

    console.log(`Time to parse request body: ${Date.now() - startTime}ms`);

    // Validate required fields
    if (!shareholder_id || !type || !amount || !description || !added_by) {
      return NextResponse.json(
        { message: 'Missing required fields: shareholder_id, type, amount, description, or added_by', status: false },
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

      // Fetch the shareholder's current balance with minimal fields
      const shareholderFetchStart = Date.now();
      const shareholder = await tx.shareHolders.findUnique({
        where: { id: parseInt(shareholder_id) },
        select: { id: true, balance: true }, // Fetch only necessary fields
      });
      console.log(`Time to fetch shareholder: ${Date.now() - shareholderFetchStart}ms`);

      if (!shareholder) {
        throw new Error('ShareHolder not found');
      }

      // Calculate the new balance based on the shareholder's current balance
      const currentBalance = shareholder.balance || 0.0;
      const balanceAdjustment = type === 'IN' ? transactionAmount : -transactionAmount;
      const newBalance = currentBalance + balanceAdjustment;

      // Validate sufficient balance for OUT transactions
      if (type === 'OUT' && newBalance < 0) {
        throw new Error('Insufficient balance for this transaction');
      }

      // Create ShareHoldersLedger entry with the calculated balance
      const ledgerCreateStart = Date.now();
      const ledgerEntry = await tx.shareHoldersLedger.create({
        data: {
          shareholder_id: parseInt(shareholder_id),
          in_amount: type === 'IN' ? transactionAmount : 0.0,
          out_amount: type === 'OUT' ? transactionAmount : 0.0,
          balance: newBalance, // Store the running balance
          description,
          added_by: parseInt(added_by),
          transaction_at: new Date(), // Explicitly set transaction_at
        },
      });
      console.log(`Time to create ledger entry: ${Date.now() - ledgerCreateStart}ms`);

      // Update shareholder balance
      const shareholderUpdateStart = Date.now();
      const updatedShareholder = await tx.shareHolders.update({
        where: { id: parseInt(shareholder_id) },
        data: {
          balance: {
            increment: balanceAdjustment,
          },
        },
        select: { id: true, balance: true }, // Fetch only necessary fields
      });
      console.log(`Time to update shareholder balance: ${Date.now() - shareholderUpdateStart}ms`);

      // Fetch Admin with ID 1
      const adminFetchStart = Date.now();
      const admin = await tx.admin.findUnique({
        where: { id: 1 },
        select: { id: true, balance: true }, // Fetch only necessary fields
      });
      console.log(`Time to fetch admin: ${Date.now() - adminFetchStart}ms`);

      if (!admin) {
        throw new Error('Admin with ID 1 not found');
      }

      // Calculate Admin's new balance (only for IN transactions)
      const adminCurrentBalance = admin.balance || 0.0;
      let adminNewBalance = adminCurrentBalance;
      if (type === 'IN') {
        adminNewBalance = adminCurrentBalance + transactionAmount;
      }

      // Update Admin balance if type is IN
      let updatedAdmin = admin;
      if (type === 'IN') {
        const adminUpdateStart = Date.now();
        updatedAdmin = await tx.admin.update({
          where: { id: 1 },
          data: {
            balance: adminNewBalance,
          },
          select: { id: true, balance: true },
        });
        console.log(`Time to update admin balance: ${Date.now() - adminUpdateStart}ms`);
      }

      // Create Admin Ledger entry
      const adminLedgerCreateStart = Date.now();
      const adminLedgerEntry = await tx.ledger.create({
        data: {
          admin_id: 1, // Admin with ID 1
          debit: type === 'OUT' ? transactionAmount : 0.0, // Debit for OUT (admin pays out)
          credit: type === 'IN' ? transactionAmount : 0.0, // Credit for IN (admin receives)
          balance: adminNewBalance, // Store the running balance
          description: `ShareHolder Transaction (${type}): ${description}`, // Include transaction type and description
          transaction_at: new Date(), // Explicitly set transaction_at
        },
      });
      console.log(`Time to create admin ledger entry: ${Date.now() - adminLedgerCreateStart}ms`);

      return { ledgerEntry, updatedShareholder, adminLedgerEntry, updatedAdmin };
    });

    console.log(`Total transaction time: ${Date.now() - transactionStartTime}ms`);

    return NextResponse.json(
      {
        message: 'Transaction recorded, balances updated, and admin ledger entry created successfully',
        status: true,
        data: {
          ledger: result.ledgerEntry,
          shareholder: result.updatedShareholder,
          adminLedger: result.adminLedgerEntry,
          admin: result.updatedAdmin,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    
    return NextResponse.json(
      { message: 'Failed to process transaction', status: false, error: error.message },
      { status: 500 }
    );
  }
}