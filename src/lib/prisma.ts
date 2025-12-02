/* eslint-disable @typescript-eslint/no-require-imports */
import path from 'path';
// Import type only; does not load runtime
import type { PrismaClient as PrismaClientType } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClientType | undefined };

// Configure Prisma to use WASM engine BEFORE requiring @prisma/client
try {
	if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
		process.env.PRISMA_CLIENT_ENGINE_TYPE = 'wasm';
	}
	if (!process.env.PRISMA_WASM_QUERY_ENGINE_BASE_URL) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const runtimeIndexPath = require.resolve('@prisma/client/runtime/index.js');
		const runtimeDir = path.dirname(runtimeIndexPath);
		process.env.PRISMA_WASM_QUERY_ENGINE_BASE_URL = `file://${runtimeDir}/`;
	}
} catch (e) {
	console.warn('[Prisma] Could not configure WASM engine base URL:', (e as Error).message);
}

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

