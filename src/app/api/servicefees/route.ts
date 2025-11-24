import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDocumentNumber } from '@/lib/utils';
import { logger } from '@/lib/logger';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// GET /api/servicefees - Get service fees
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const purchaseNo = searchParams.get('purchaseNo');
    const category = searchParams.get('category');

    const where: any = {};
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (purchaseNo) {
      where.purchaseNo = purchaseNo;
    }

    if (category) {
      where.category = category;
    }

    const serviceFees = await prisma.serviceFee.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(serviceFees);
  } catch (error) {
    logger.error('Failed to get service fees', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าบริการ' },
      { status: 500 }
    );
  }
}

// POST /api/servicefees - Create service fee (single or batch)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    logger.debug('ServiceFee POST request data', data);

    // Check if this is a batch request (array of service fees)
    if (Array.isArray(data.items) && data.items.length > 0) {
      return handleBatchServiceFee(data);
    }

    // Single service fee (if needed in the future)
    const { category, amount, notes, date, purchaseNo } = data;

    // Validate required fields
    if (!category || category.trim() === '') {
      return NextResponse.json(
        { 
          error: 'กรุณากรอกข้อมูลให้ครบถ้วน',
          details: 'Category is required',
        },
        { status: 400 }
      );
    }

    if (!amount || amount === 0) {
      return NextResponse.json(
        { 
          error: 'กรุณากรอกข้อมูลให้ครบถ้วน',
          details: 'Amount is required and must be greater than 0',
        },
        { status: 400 }
      );
    }

    // Parse and validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { 
          error: 'กรุณากรอกข้อมูลให้ครบถ้วน',
          details: `Invalid amount: ${amount}`,
        },
        { status: 400 }
      );
    }

    // Generate service fee number
    const serviceFeeDate = date ? new Date(date) : new Date();
    const serviceFeeNo = await generateDocumentNumber('SVC', serviceFeeDate);

    logger.debug('Creating service fee', { serviceFeeNo, purchaseNo, category, amount: parsedAmount, date: serviceFeeDate });

    const serviceFee = await prisma.serviceFee.create({
      data: {
        serviceFeeNo,
        purchaseNo: purchaseNo || null,
        date: serviceFeeDate,
        category: category.trim(),
        amount: Math.abs(parsedAmount), // Ensure positive value
        notes: notes?.trim() || null,
      },
    });

    logger.debug('Service fee created successfully', { id: serviceFee.id });
    return NextResponse.json(serviceFee, { status: 201 });
  } catch (error: any) {
    logger.error('Failed to create service fee', error);
    
    const errorResponse: any = {
      error: 'เกิดข้อผิดพลาดในการบันทึกค่าบริการ',
      details: error?.message || 'Unknown error',
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error?.stack;
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle batch service fee creation
async function handleBatchServiceFee(data: { items: any[]; purchaseNo?: string; date?: string }) {
  try {
    const { items, purchaseNo, date } = data;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'ไม่มีรายการให้บันทึก', details: 'items array is required' },
        { status: 400 }
      );
    }

    logger.debug('Batch service fee - Processing items', { count: items.length, purchaseNo });

    // Validate all items and prepare service fee data
    const serviceFeeDataList = [];
    
    for (const item of items) {
      // Validate required fields
      if (!item.category || item.category.trim() === '') {
        return NextResponse.json(
          { error: 'กรุณากรอกข้อมูลให้ครบถ้วน', details: 'Category is required for all items' },
          { status: 400 }
        );
      }

      if (!item.amount || item.amount === 0) {
        return NextResponse.json(
          { error: 'กรุณากรอกข้อมูลให้ครบถ้วน', details: 'Amount is required for all items' },
          { status: 400 }
        );
      }

      // Parse and validate amount
      const parsedAmount = parseFloat(item.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json(
          { error: 'กรุณากรอกข้อมูลให้ครบถ้วน', details: `Invalid amount: ${item.amount}` },
          { status: 400 }
        );
      }

      // Generate service fee number for each item
      const itemDate = item.date ? new Date(item.date) : (date ? new Date(date) : new Date());
      const serviceFeeNo = await generateDocumentNumber('SVC', itemDate);

      serviceFeeDataList.push({
        serviceFeeNo,
        purchaseNo: purchaseNo || null, // Link to purchase transaction if provided
        date: itemDate,
        category: item.category.trim(),
        amount: Math.abs(parsedAmount),
        notes: item.notes?.trim() || null,
      });
    }

    // Save all service fees in a transaction
    const serviceFees = await prisma.$transaction(
      serviceFeeDataList.map(data => 
        prisma.serviceFee.create({
          data,
        })
      )
    );

    logger.debug('Batch service fee - Successfully created', serviceFees.length, 'service fees');
    return NextResponse.json({ serviceFees, purchaseNo }, { status: 201 });
  } catch (error: any) {
    logger.error('Batch service fee error', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: 'เกิดข้อผิดพลาดในการบันทึกค่าบริการแบบกลุ่ม',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

