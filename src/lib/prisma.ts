import './prisma-env';
import { PrismaClient } from '@prisma/client';

function logDatabaseUrl(): void {
	if (process.env.DATABASE_URL) {
		const dbUrl = process.env.DATABASE_URL;
		const maskedUrl = dbUrl.replace(/\/[^/]+$/, '/***');
		console.log('[Prisma] Initializing client with DATABASE_URL:', maskedUrl);
	} else {
		console.warn('[Prisma] ⚠️ DATABASE_URL not set! Using default from schema.prisma');
		console.warn(
			'[Prisma] This may cause issues in Electron builds. Ensure DATABASE_URL is set before Prisma client is initialized.',
		);
	}
}

const globalForPrisma = globalThis as typeof globalThis & {
	prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
	logDatabaseUrl();
	const client = new PrismaClient({
		log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
	});
	console.log('[Prisma] Client created successfully');
	if (process.env.NODE_ENV !== 'production') {
		globalForPrisma.prisma = client;
	}
	return client;
}

function getActivePrisma(): PrismaClient {
	if (!globalForPrisma.prisma) {
		globalForPrisma.prisma = createPrismaClient();
	}
	return globalForPrisma.prisma;
}

/** Routes through the global singleton so backup restore can swap the client. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
	get(_target, prop) {
		const client = getActivePrisma();
		const value = Reflect.get(client, prop, client) as unknown;
		if (typeof value === 'function') {
			return (value as (...args: unknown[]) => unknown).bind(client);
		}
		return value;
	},
});

export function getPrisma(): PrismaClient {
	return getActivePrisma();
}

/** Disconnect and recreate the client after replacing the SQLite file (e.g. backup restore). */
export async function resetPrismaConnection(): Promise<void> {
	const current = globalForPrisma.prisma;
	if (current) {
		try {
			await current.$disconnect();
		} catch {
			// ignore disconnect errors during restore
		}
	}

	globalForPrisma.prisma = undefined;
	const client = createPrismaClient();
	await client.$connect();
}
