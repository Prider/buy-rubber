/**
 * Stock-related Prisma delegates. Some TS/IDE setups fail to expose `stockPosition` /
 * `stockLedgerEntry` on `PrismaClient` (symbol index on the generated class). Runtime
 * always has these after `npx prisma generate`.
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type StockPositionDelegate = {
	findMany<T extends Prisma.StockPositionFindManyArgs>(
		args?: Prisma.Subset<T, Prisma.StockPositionFindManyArgs>,
	): Prisma.PrismaPromise<Array<Prisma.StockPositionGetPayload<T>>>;
	findUnique<T extends Prisma.StockPositionFindUniqueArgs>(
		args: Prisma.Subset<T, Prisma.StockPositionFindUniqueArgs>,
	): Prisma.PrismaPromise<Prisma.StockPositionGetPayload<T> | null>;
	deleteMany(args?: Prisma.StockPositionDeleteManyArgs): Prisma.PrismaPromise<Prisma.BatchPayload>;
	createMany(args?: Prisma.StockPositionCreateManyArgs): Prisma.PrismaPromise<Prisma.BatchPayload>;
};

type StockLedgerDelegate = {
	findMany<T extends Prisma.StockLedgerEntryFindManyArgs>(
		args?: Prisma.Subset<T, Prisma.StockLedgerEntryFindManyArgs>,
	): Prisma.PrismaPromise<Array<Prisma.StockLedgerEntryGetPayload<T>>>;
	count(args?: Prisma.Subset<Prisma.StockLedgerEntryCountArgs, Prisma.StockLedgerEntryCountArgs>): Prisma.PrismaPromise<number>;
	deleteMany(args?: Prisma.StockLedgerEntryDeleteManyArgs): Prisma.PrismaPromise<Prisma.BatchPayload>;
	createMany(args?: Prisma.StockLedgerEntryCreateManyArgs): Prisma.PrismaPromise<Prisma.BatchPayload>;
};

const asStock = prisma as unknown as { stockPosition: StockPositionDelegate; stockLedgerEntry: StockLedgerDelegate };

export const stockPosition = asStock.stockPosition;
export const stockLedgerEntry = asStock.stockLedgerEntry;
