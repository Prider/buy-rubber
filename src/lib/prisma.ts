import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Function to get Prisma client (lazy initialization)
function getPrismaClient(): PrismaClient {
  // Log DATABASE_URL for debugging (without exposing full path in production)
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    const maskedUrl = dbUrl.replace(/\/[^\/]+$/, '/***');
    console.log('[Prisma] Initializing client with DATABASE_URL:', maskedUrl);
  } else {
    console.warn('[Prisma] ⚠️ DATABASE_URL not set! Using default from schema.prisma');
    console.warn('[Prisma] This may cause issues in Electron builds. Ensure DATABASE_URL is set before Prisma client is initialized.');
  }

  if (!globalForPrisma.prisma) {
    try {
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
      console.log('[Prisma] Client created successfully');
    } catch (error) {
      console.error('[Prisma] Failed to create client:', error);
      throw error;
    }
  }
  
  return globalForPrisma.prisma;
}

// Create a proxy that lazily initializes Prisma Client only when accessed
const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    // If it's a function, bind it to the client
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

export const prisma = prismaProxy as PrismaClient;

if (process.env.NODE_ENV !== 'production') {
  // Don't initialize here, let it be lazy
}

