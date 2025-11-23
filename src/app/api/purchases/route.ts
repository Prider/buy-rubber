import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  calculateDryWeight, 
  calculateAdjustedPrice, 
  calculateSplit,
  generateDocumentNumber
} from '@/lib/utils';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// GET /api/purchases - ดึงรายการรับซื้อ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const memberId = searchParams.get('memberId');
    const productTypeId = searchParams.get('productTypeId');
    const isPaid = searchParams.get('isPaid');
    const limit = searchParams.get('limit');

    const where: any = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.date = { ...(where.date || {}), gte: start };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date = { ...(where.date || {}), lte: end };
    }

    if (memberId) {
      where.memberId = memberId;
    }

    if (productTypeId) {
      where.productTypeId = productTypeId;
    }

    if (isPaid !== null) {
      where.isPaid = isPaid === 'true';
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        member: true,
        productType: true,
        user: true,
      },
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Get purchases error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการรับซื้อ' },
      { status: 500 }
    );
  }
}

// POST /api/purchases - บันทึกการรับซื้อ (single or batch)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('[Purchase API] Received data:', data);

    // Check if this is a batch request (array of purchases)
    if (Array.isArray(data.items) && data.items.length > 0) {
      return handleBatchPurchase(data);
    }

    // Single purchase (existing logic)

    // Validate required fields
    if (!data.memberId) {
      return NextResponse.json(
        { error: 'กรุณาเลือกสมาชิก', details: 'memberId is required' },
        { status: 400 }
      );
    }
    if (!data.productTypeId) {
      return NextResponse.json(
        { error: 'กรุณาเลือกประเภทสินค้า', details: 'productTypeId is required' },
        { status: 400 }
      );
    }
    if (!data.userId) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้', details: 'userId is required' },
        { status: 400 }
      );
    }
    if (!data.date) {
      return NextResponse.json(
        { error: 'กรุณาระบุวันที่', details: 'date is required' },
        { status: 400 }
      );
    }
    if (!data.grossWeight || data.grossWeight <= 0) {
      return NextResponse.json(
        { error: 'กรุณาระบุน้ำหนักรวมภาชนะ', details: 'grossWeight must be greater than 0' },
        { status: 400 }
      );
    }

    // คำนวณน้ำหนักสุทธิ (ใช้ค่าที่ส่งมา หรือคำนวณใหม่)
    const netWeight = data.netWeight || (data.grossWeight - (data.containerWeight || 0));

    // คำนวณน้ำหนักแห้ง
    let dryWeight = netWeight;
    if (data.rubberPercent) {
      dryWeight = calculateDryWeight(netWeight, data.rubberPercent);
    }

    // ดึงราคาประกาศสำหรับประเภทสินค้านี้ (ถ้ามี)
    console.log('[Purchase API] Looking for product price:', {
      date: data.date,
      productTypeId: data.productTypeId,
      dateRange: {
        gte: new Date(data.date + 'T00:00:00'),
        lte: new Date(data.date + 'T23:59:59'),
      }
    });
    
    const productPrice = await prisma.productPrice.findFirst({
      where: {
        date: {
          gte: new Date(data.date + 'T00:00:00'),
          lte: new Date(data.date + 'T23:59:59'),
        },
        productTypeId: data.productTypeId,
      },
    });

    console.log('[Purchase API] Found product price:', productPrice);

    // ใช้ราคาจากฟอร์ม หรือราคาประกาศ (ถ้ามี)
    const basePrice = data.pricePerUnit || productPrice?.price || 0;
    
    if (basePrice === 0) {
      return NextResponse.json(
        { error: 'กรุณาระบุราคาต่อหน่วย' },
        { status: 400 }
      );
    }

    // คำนวณราคาที่ปรับแล้ว (สำหรับตอนนี้ใช้ราคาพื้นฐาน)
    let adjustedPrice = basePrice;
    // TODO: Add price adjustment logic based on rubber percent if needed

    // ราคาสุดท้าย
    const finalPrice = adjustedPrice + (data.bonusPrice || 0);
    const totalAmount = netWeight * finalPrice;

    // Validate all foreign keys exist
    console.log('[Purchase API] Validating foreign keys:', {
      memberId: data.memberId,
      productTypeId: data.productTypeId,
      userId: data.userId,
    });

    const [member, productType, user] = await Promise.all([
      prisma.member.findUnique({ where: { id: data.memberId } }),
      prisma.productType.findUnique({ where: { id: data.productTypeId } }),
      prisma.user.findUnique({ where: { id: data.userId } }),
    ]);

    console.log('[Purchase API] Foreign key validation results:', {
      member: member ? 'found' : 'NOT FOUND',
      productType: productType ? 'found' : 'NOT FOUND',
      user: user ? 'found' : 'NOT FOUND',
    });

    if (!member) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสมาชิก', details: `Member with id ${data.memberId} not found` },
        { status: 404 }
      );
    }

    if (!productType) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลประเภทสินค้า', details: `ProductType with id ${data.productTypeId} not found` },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้', details: `User with id ${data.userId} not found. Please log out and log in again.` },
        { status: 404 }
      );
    }

    // คำนวณการแบ่งเงิน
    const { ownerAmount, tapperAmount } = calculateSplit(
      totalAmount,
      member.ownerPercent,
      member.tapperPercent
    );

    // สร้างเลขที่รับซื้อ
    const purchaseNo = await generateDocumentNumber('PUR', new Date(data.date));

    console.log('[Purchase API] Creating purchase with data:', {
      purchaseNo,
      date: new Date(data.date),
      memberId: data.memberId,
      productTypeId: data.productTypeId,
      userId: data.userId,
      grossWeight: data.grossWeight,
      containerWeight: data.containerWeight || 0,
      netWeight,
      dryWeight,
      basePrice,
      adjustedPrice,
      bonusPrice: data.bonusPrice || 0,
      finalPrice,
      totalAmount,
      ownerAmount,
      tapperAmount,
      notes: data.notes,
    });

    // บันทึกการรับซื้อ
    // Use current time when creating purchase to preserve the exact creation time
    // If date string includes time, use it; otherwise combine the date with current time
    let purchaseDate: Date;
    if (typeof data.date === 'string') {
      const dateOnly = new Date(data.date);
      // Check if the date string includes time (has 'T' or time components like HH:MM)
      if (data.date.includes('T') || /:\d{2}/.test(data.date)) {
        // Date includes time, use it as-is
        purchaseDate = new Date(data.date);
      } else {
        // Date only, combine with current time
        const now = new Date();
        purchaseDate = new Date(
          dateOnly.getFullYear(),
          dateOnly.getMonth(),
          dateOnly.getDate(),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds()
        );
      }
    } else {
      // Already a Date object or use current time
      purchaseDate = data.date instanceof Date ? data.date : new Date();
    }
    
    const purchase = await prisma.purchase.create({
      data: {
        purchaseNo,
        date: purchaseDate,
        memberId: data.memberId,
        productTypeId: data.productTypeId,
        userId: data.userId,
        grossWeight: data.grossWeight,
        containerWeight: data.containerWeight || 0,
        netWeight,
        rubberPercent: data.rubberPercent,
        dryWeight,
        basePrice,
        adjustedPrice,
        bonusPrice: data.bonusPrice || 0,
        finalPrice,
        totalAmount,
        ownerAmount,
        tapperAmount,
        notes: data.notes,
      },
      include: {
        member: true,
        productType: true,
        user: true,
      },
    });

    console.log('[Purchase API] Successfully created purchase:', purchase.id);
    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error('Create purchase error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      code: (error as any)?.code,
    });
    
    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCode = (error as any)?.code;
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการบันทึกการรับซื้อ',
        details: errorMessage,
        code: errorCode,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

// Handle batch purchase creation with same purchaseNo
async function handleBatchPurchase(data: { items: any[]; userId: string; date?: string }) {
  try {
    const { items, userId, date } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้', details: 'userId is required' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'ไม่มีรายการให้บันทึก', details: 'items array is required' },
        { status: 400 }
      );
    }

    // Use the first item's date or provided date
    const purchaseDate = date || items[0]?.date || new Date().toISOString().split('T')[0];
    
    // Generate a base purchase number for all items (will add sequence suffix)
    const basePurchaseNo = await generateDocumentNumber('PUR', new Date(purchaseDate));
    console.log('[Purchase API] Batch purchase - Generated base purchaseNo:', basePurchaseNo);

    // Validate all items and prepare purchase data
    const purchaseDataList = [];
    
    for (const item of items) {
      // Validate required fields
      if (!item.memberId) {
        return NextResponse.json(
          { error: 'กรุณาเลือกสมาชิก', details: 'memberId is required for all items' },
          { status: 400 }
        );
      }
      if (!item.productTypeId) {
        return NextResponse.json(
          { error: 'กรุณาเลือกประเภทสินค้า', details: 'productTypeId is required for all items' },
          { status: 400 }
        );
      }
      if (!item.grossWeight || item.grossWeight <= 0) {
        return NextResponse.json(
          { error: 'กรุณาระบุน้ำหนักรวมภาชนะ', details: 'grossWeight must be greater than 0' },
          { status: 400 }
        );
      }

      // Calculate net weight
      const netWeight = item.netWeight || (item.grossWeight - (item.containerWeight || 0));

      // Calculate dry weight
      let dryWeight = netWeight;
      if (item.rubberPercent) {
        dryWeight = calculateDryWeight(netWeight, item.rubberPercent);
      }

      // Get product price
      const productPrice = await prisma.productPrice.findFirst({
        where: {
          date: {
            gte: new Date(purchaseDate + 'T00:00:00'),
            lte: new Date(purchaseDate + 'T23:59:59'),
          },
          productTypeId: item.productTypeId,
        },
      });

      // Use price from form or product price
      // Allow negative prices for service fees (COST product type)
      const basePrice = item.pricePerUnit !== undefined ? item.pricePerUnit : (productPrice?.price || 0);
      
      if (basePrice === 0) {
        return NextResponse.json(
          { error: 'กรุณาระบุราคาต่อหน่วย', details: `Price is required for product type ${item.productTypeId}` },
          { status: 400 }
        );
      }

      // Calculate prices
      let adjustedPrice = basePrice;
      const finalPrice = adjustedPrice + (item.bonusPrice || 0);
      const totalAmount = netWeight * finalPrice;

      // Validate foreign keys
      const [member, productType] = await Promise.all([
        prisma.member.findUnique({ where: { id: item.memberId } }),
        prisma.productType.findUnique({ where: { id: item.productTypeId } }),
      ]);

      if (!member) {
        return NextResponse.json(
          { error: 'ไม่พบข้อมูลสมาชิก', details: `Member with id ${item.memberId} not found` },
          { status: 404 }
        );
      }

      if (!productType) {
        return NextResponse.json(
          { error: 'ไม่พบข้อมูลประเภทสินค้า', details: `ProductType with id ${item.productTypeId} not found` },
          { status: 404 }
        );
      }

      // Calculate split
      const { ownerAmount, tapperAmount } = calculateSplit(
        totalAmount,
        member.ownerPercent,
        member.tapperPercent
      );

      // Prepare purchase date
      let itemPurchaseDate: Date;
      if (typeof item.date === 'string') {
        const dateOnly = new Date(item.date);
        if (item.date.includes('T') || /:\d{2}/.test(item.date)) {
          itemPurchaseDate = new Date(item.date);
        } else {
          const now = new Date();
          itemPurchaseDate = new Date(
            dateOnly.getFullYear(),
            dateOnly.getMonth(),
            dateOnly.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
          );
        }
      } else {
        itemPurchaseDate = item.date instanceof Date ? item.date : new Date();
      }

      // Add sequence number to make purchaseNo unique (001, 002, 003, etc.)
      const sequence: string = String(purchaseDataList.length + 1).padStart(3, '0');
      const itemPurchaseNo: string = `${basePurchaseNo}-${sequence}`;
      
      purchaseDataList.push({
        purchaseNo: itemPurchaseNo, // Base purchaseNo + sequence for uniqueness
        date: itemPurchaseDate,
        memberId: item.memberId,
        productTypeId: item.productTypeId,
        userId: userId,
        grossWeight: item.grossWeight,
        containerWeight: item.containerWeight || 0,
        netWeight,
        rubberPercent: item.rubberPercent || null,
        dryWeight,
        basePrice,
        adjustedPrice,
        bonusPrice: item.bonusPrice || 0,
        finalPrice,
        totalAmount,
        ownerAmount,
        tapperAmount,
        notes: item.notes || null,
      });
    }

    // Validate user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้', details: `User with id ${userId} not found` },
        { status: 404 }
      );
    }

    // Save all purchases in a transaction with the same purchaseNo
    const purchases = await prisma.$transaction(
      purchaseDataList.map(data => 
        prisma.purchase.create({
          data,
          include: {
            member: true,
            productType: true,
            user: true,
          },
        })
      )
    );

    console.log('[Purchase API] Batch purchase - Successfully created', purchases.length, 'purchases with base purchaseNo:', basePurchaseNo);
    return NextResponse.json({ purchases, purchaseNo: basePurchaseNo }, { status: 201 });
  } catch (error) {
    console.error('Batch purchase error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCode = (error as any)?.code;

    return NextResponse.json(
      {
        error: 'เกิดข้อผิดพลาดในการบันทึกการรับซื้อแบบกลุ่ม',
        details: errorMessage,
        code: errorCode,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

