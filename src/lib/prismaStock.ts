/**
 * Stock-related Prisma delegates. Some TS/IDE setups fail to expose `stockPosition` /
 * `stockLedgerEntry` / `stockGang` on `PrismaClient` (symbol index on the generated class).
 * Runtime always has these after `npx prisma generate`.
 */
import { prisma } from '@/lib/prisma';

type StockPositionDelegate = {
	findMany(args?: unknown): Promise<unknown[]>;
	findUnique(args: unknown): Promise<unknown | null>;
	deleteMany(args?: unknown): Promise<unknown>;
	createMany(args?: unknown): Promise<unknown>;
};

type StockLedgerDelegate = {
	findMany(args?: unknown): Promise<unknown[]>;
	count(args?: unknown): Promise<number>;
	deleteMany(args?: unknown): Promise<unknown>;
	createMany(args?: unknown): Promise<unknown>;
};

type StockGangDelegate = {
	findMany(args?: unknown): Promise<unknown[]>;
	findFirst(args?: unknown): Promise<unknown | null>;
	count(args?: unknown): Promise<number>;
	deleteMany(args?: unknown): Promise<unknown>;
	createMany(args?: unknown): Promise<unknown>;
	create(args?: unknown): Promise<unknown>;
	update(args?: unknown): Promise<unknown>;
};

const asStock = prisma as unknown as {
	stockPosition: StockPositionDelegate;
	stockLedgerEntry: StockLedgerDelegate;
	stockGang: StockGangDelegate;
};

export const stockPosition = asStock.stockPosition;
export const stockLedgerEntry = asStock.stockLedgerEntry;
export const stockGang = asStock.stockGang;
