import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Force dynamic rendering - prevent caching in Vercel
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/members/next-code
 * 
 * Generates the next available unique member code in the format M### (e.g., M001, M002, M003).
 * 
 * Optimized Algorithm:
 * 1. Use database query to find max number directly (no need to fetch all members)
 * 2. Generate next code by incrementing the highest number
 * 3. Verify uniqueness (handles race conditions and gaps in sequence)
 * 
 * @returns {Promise<NextResponse>} JSON response with the next available code
 */
export async function GET() {
  try {
    // Step 1: Use optimized database query to find max number directly
    // This is much faster than fetching all members and processing in JavaScript
    // SQLite query: Find max numeric value from codes matching pattern M###
    // Try multiple approaches for reliability
    let maxNumber = 0;
    
    try {
      // Approach 1: Use CAST with INTEGER conversion
      const result = await prisma.$queryRaw<Array<{ max_num: number | null }>>`
        SELECT MAX(CAST(SUBSTR(code, 2) AS INTEGER)) as max_num
        FROM "Member"
        WHERE code LIKE 'M%'
          AND LENGTH(code) >= 2
          AND SUBSTR(code, 2) GLOB '[0-9]*'
      `;
      
      const maxNum = result[0]?.max_num;
      if (maxNum !== null && maxNum !== undefined && !isNaN(maxNum)) {
        maxNumber = maxNum;
      } else {
        // Fallback: If query returns null, fetch codes and process in JS
        logger.debug('Raw query returned null, using fallback approach');
        const members = await prisma.member.findMany({
          select: { code: true },
          where: {
            code: {
              startsWith: 'M',
            },
          },
        });
        
        const existingNumbers = members
          .map(m => m.code)
          .filter(code => /^M\d+$/.test(code))
          .map(code => parseInt(code.substring(1), 10))
          .filter(num => !isNaN(num));
        
        maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
      }
    } catch (queryError) {
      // Fallback to JavaScript processing if raw query fails
      logger.warn('Raw query failed, using fallback', { error: queryError });
      const members = await prisma.member.findMany({
        select: { code: true },
        where: {
          code: {
            startsWith: 'M',
          },
        },
      });
      
      const existingNumbers = members
        .map(m => m.code)
        .filter(code => /^M\d+$/.test(code))
        .map(code => parseInt(code.substring(1), 10))
        .filter(num => !isNaN(num));
      
      maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    }
    
    logger.debug('Max number determined', { maxNumber });
    
    // Step 3: Generate the next code candidate
    // Increment the highest number and format with zero-padding (3 digits)
    // Example: maxNumber = 5 -> nextNumber = 6 -> nextCode = "M006"
    let nextNumber = maxNumber + 1;
    let nextCode = `M${String(nextNumber).padStart(3, '0')}`;
    
    // Step 4: Verify uniqueness and handle race conditions
    // This loop handles two scenarios:
    // - Race conditions: Multiple requests generating codes simultaneously
    // - Gaps in sequence: If M003 was deleted, we still want to use M004, not M003 again
    let attempts = 0;
    const maxAttempts = 100; // Reduced from 1000 since we're starting from max, not 0
    
    while (attempts < maxAttempts) {
      // Check if the generated code already exists in database
      const existing = await prisma.member.findUnique({
        where: { code: nextCode },
        select: { id: true }, // Only select id for faster query
      });
      
      if (!existing) {
        // Code is unique and available
        logger.debug('Generated unique member code', { code: nextCode, attempts: attempts + 1, maxNumber });
        const response = NextResponse.json({ code: nextCode });
        // Disable HTTP caching - we use our own cache instead
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
      }
      
      // Code already exists (race condition or gap scenario)
      // Increment and try the next number
      nextNumber++;
      nextCode = `M${String(nextNumber).padStart(3, '0')}`;
      attempts++;
    }
    
    // Step 5: Error handling - if we've tried too many times, something is wrong
    // This should never happen in normal operation, but provides safety
    logger.error('Failed to generate unique member code after max attempts', { maxAttempts });
    const errorResponse = NextResponse.json(
      { error: 'ไม่สามารถสร้างรหัสสมาชิกใหม่ได้ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return errorResponse;
  } catch (error) {
    // Handle any unexpected errors (database connection, etc.)
    logger.error('Failed to generate next member code', error);
    const errorResponse = NextResponse.json(
      { error: 'ไม่สามารถสร้างรหัสสมาชิกใหม่ได้' },
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return errorResponse;
  }
}
