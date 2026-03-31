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

export const prisma = (() => {
	if (globalForPrisma.prisma) {
		return globalForPrisma.prisma;
	}
	logDatabaseUrl();
	const client = new PrismaClient({
		log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
	});
	console.log('[Prisma] Client created successfully');
	if (process.env.NODE_ENV !== 'production') {
		globalForPrisma.prisma = client;
	}
	return client;
})();

export function getPrisma() {
	return prisma;
}
