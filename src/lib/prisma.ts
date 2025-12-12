/* eslint-disable @typescript-eslint/no-require-imports */
// Import type only; does not load runtime
import type { PrismaClient as PrismaClientType } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClientType | undefined };

// Configure Prisma to use WASM engine for Vercel/serverless environments
// Only set if not already configured - let Prisma handle runtime resolution automatically
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
	// Use WASM engine for better compatibility with serverless/Vercel
	process.env.PRISMA_CLIENT_ENGINE_TYPE = 'wasm';
}
// Don't manually set PRISMA_WASM_QUERY_ENGINE_BASE_URL - let Prisma resolve it automatically
// This avoids build-time resolution issues in Vercel

function getOrCreatePrismaSync(): PrismaClientType {
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
			// Require synchronously after env is configured
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (...args: any[]) => PrismaClientType };
			globalForPrisma.prisma = new PrismaClient({
				log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
			});
			console.log('[Prisma] Client created successfully');
		} catch (error) {
			console.error('[Prisma] Failed to create client:', error);
			throw error;
		}
	}
	return globalForPrisma.prisma!;
}

// Export a proxy that initializes Prisma on first property access synchronously
export const prisma = new Proxy({} as PrismaClientType, {
	get(_target, prop) {
		const client = getOrCreatePrismaSync() as any;
		const value = client[prop as keyof PrismaClientType];
		if (typeof value === 'function') {
			return value.bind(client);
		}
		return value;
	},
}) as unknown as PrismaClientType;

// Also export an explicit initializer for places that prefer calling once
export function getPrisma(): PrismaClientType {
	return getOrCreatePrismaSync();
}

