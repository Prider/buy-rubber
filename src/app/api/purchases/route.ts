import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  calculateDryWeight, 
  calculateAdjustedPrice, 
  calculateSplit,
  generateDocumentNumber
} from '@/lib/utils';

// GET /api/purchases - ดึงรายการรับซื้อ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const memberId = searchParams.get('memberId');
    const isPaid = searchParams.get('isPaid');

    const where: any = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (memberId) {
      where.memberId = memberId;
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

// POST /api/purchases - บันทึกการรับซื้อ
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('[Purchase API] Received data:', data);

    // คำนวณน้ำหนักสุทธิ
    const netWeight = data.grossWeight - (data.containerWeight || 0);

    // คำนวณน้ำหนักแห้ง
    let dryWeight = netWeight;
    if (data.rubberPercent) {
      dryWeight = calculateDryWeight(netWeight, data.rubberPercent);
    }

    // ดึงราคาประกาศสำหรับประเภทสินค้านี้
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

    if (!productPrice) {
      return NextResponse.json(
        { error: 'ยังไม่มีราคาประกาศสำหรับประเภทสินค้านี้ในวันนี้' },
        { status: 400 }
      );
    }

    // คำนวณราคาที่ปรับแล้ว (สำหรับตอนนี้ใช้ราคาพื้นฐาน)
    let adjustedPrice = productPrice.price;
    // TODO: Add price adjustment logic based on rubber percent if needed

    // ราคาสุดท้าย
    const finalPrice = adjustedPrice + (data.bonusPrice || 0);
    const totalAmount = dryWeight * finalPrice;

    // ดึงข้อมูลสมาชิก
    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสมาชิก' },
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
      basePrice: productPrice.price,
      adjustedPrice,
      bonusPrice: data.bonusPrice || 0,
      finalPrice,
      totalAmount,
      ownerAmount,
      tapperAmount,
      notes: data.notes,
    });

    // บันทึกการรับซื้อ
    const purchase = await prisma.purchase.create({
      data: {
        purchaseNo,
        date: new Date(data.date),
        memberId: data.memberId,
        productTypeId: data.productTypeId,
        userId: data.userId,
        grossWeight: data.grossWeight,
        containerWeight: data.containerWeight || 0,
        netWeight,
        rubberPercent: data.rubberPercent,
        dryWeight,
        basePrice: productPrice.price,
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
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกการรับซื้อ' },
      { status: 500 }
    );
  }
}

