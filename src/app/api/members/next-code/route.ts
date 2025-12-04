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
 * Algorithm:
 * 1. Finds all existing member codes starting with 'M'
 * 2. Extracts numeric parts from codes matching pattern M### 
 * 3. Determines the highest existing number
 * 4. Generates next code by incrementing the highest number
 * 5. Verifies uniqueness (handles race conditions and gaps in sequence)
 * 
 * @returns {Promise<NextResponse>} JSON response with the next available code
 */
export async function GET() {
  try {
    // Step 1: Query all members with codes starting with 'M'
    // This includes both active and inactive members to avoid code conflicts
    const members = await prisma.member.findMany({
      select: { code: true },
      where: {
        code: {
          startsWith: 'M',
        },
      },
    });

    // Step 2: Extract numeric parts from existing codes
    // Filter codes that match the pattern M### (M followed by digits only)
    // Example: M001 -> 1, M002 -> 2, M123 -> 123
    const existingNumbers = members
      .map(m => m.code) // Get all code strings
      .filter(code => /^M\d+$/.test(code)) // Only keep codes matching M### pattern (excludes UUIDs or other formats)
      .map(code => parseInt(code.substring(1), 10)) // Extract number after 'M' prefix
      .filter(num => !isNaN(num)); // Remove any invalid numbers (safety check)

    // Step 3: Find the highest existing number
    // If no members exist, start from 0 (will become M001)
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    
    // Step 4: Generate the next code candidate
    // Increment the highest number and format with zero-padding (3 digits)
    // Example: maxNumber = 5 -> nextNumber = 6 -> nextCode = "M006"
    let nextNumber = maxNumber + 1;
    let nextCode = `M${String(nextNumber).padStart(3, '0')}`;
    
    // Step 5: Verify uniqueness and handle race conditions
    // This loop handles two scenarios:
    // - Race conditions: Multiple requests generating codes simultaneously
    // - Gaps in sequence: If M003 was deleted, we still want to use M004, not M003 again
    let attempts = 0;
    const maxAttempts = 1000; // Safety limit to prevent infinite loop
    
    while (attempts < maxAttempts) {
      // Check if the generated code already exists in database
      const existing = await prisma.member.findUnique({
        where: { code: nextCode },
      });
      
      if (!existing) {
        // Code is unique and available
        logger.debug('Generated unique member code', { code: nextCode, attempts: attempts + 1 });
        const response = NextResponse.json({ code: nextCode });
        // Disable caching for this endpoint - each request should generate a new code
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
    
    // Step 6: Error handling - if we've tried too many times, something is wrong
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
