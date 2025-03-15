// src/util/prisma.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    transactionOptions: {
        maxWait: 30000, // Increase to 30 seconds (from 15000ms)
        timeout: 30000, // Increase to 30 seconds (from 15000ms)
      },
});

export default prisma;

