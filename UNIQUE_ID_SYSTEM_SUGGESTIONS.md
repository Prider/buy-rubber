# Unique ID Number System Suggestions

## Option 1: Database Sequence (Recommended for PostgreSQL) ⭐

**Best for**: Guaranteed uniqueness, no gaps, thread-safe, atomic operations

### Implementation:

1. **Create a sequence in PostgreSQL**:
```sql
CREATE SEQUENCE member_code_seq START 1;
```

2. **Update the API route**:
```typescript
// src/app/api/members/next-code/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // Get next sequence value atomically
    const result = await prisma.$queryRaw<Array<{ nextval: bigint }>>`
      SELECT nextval('member_code_seq') as nextval
    `;
    
    const nextNumber = Number(result[0].nextval);
    const nextCode = `M${String(nextNumber).padStart(6, '0')}`; // M000001, M000002, etc.
    
    logger.debug('Generated unique member code from sequence', { code: nextCode, number: nextNumber });
    return NextResponse.json({ code: nextCode });
  } catch (error) {
    logger.error('Failed to generate next member code', error);
    return NextResponse.json(
      { error: 'ไม่สามารถสร้างรหัสสมาชิกใหม่ได้' },
      { status: 500 }
    );
  }
}
```

**Pros:**
- ✅ Guaranteed unique (database-level)
- ✅ Thread-safe (handles concurrent requests)
- ✅ No gaps (unless sequence is reset)
- ✅ Atomic operation
- ✅ Fast and efficient

**Cons:**
- ❌ Requires database migration
- ❌ Less flexible if you need to change format

---

## Option 2: Hybrid - Prefix + Auto-incrementing Counter Table

**Best for**: More control, can reset counters, multiple prefixes

### Implementation:

1. **Create a counter table**:
```sql
CREATE TABLE code_sequences (
  prefix VARCHAR(10) PRIMARY KEY,
  current_value INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

2. **Update the API route**:
```typescript
// src/app/api/members/next-code/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const prefix = 'M';
    
    // Use transaction to atomically increment and get value
    const result = await prisma.$transaction(async (tx) => {
      // Try to get existing counter
      let counter = await tx.$queryRaw<Array<{ current_value: number }>>`
        SELECT current_value FROM code_sequences WHERE prefix = ${prefix}
      `;
      
      if (!counter || counter.length === 0) {
        // Create new counter
        await tx.$executeRaw`
          INSERT INTO code_sequences (prefix, current_value) 
          VALUES (${prefix}, 0)
        `;
        counter = [{ current_value: 0 }];
      }
      
      // Increment and get new value
      const updated = await tx.$queryRaw<Array<{ current_value: number }>>`
        UPDATE code_sequences 
        SET current_value = current_value + 1, updated_at = NOW()
        WHERE prefix = ${prefix}
        RETURNING current_value
      `;
      
      return updated[0].current_value;
    });
    
    const nextCode = `${prefix}${String(result).padStart(6, '0')}`;
    
    logger.debug('Generated unique member code', { code: nextCode });
    return NextResponse.json({ code: nextCode });
  } catch (error) {
    logger.error('Failed to generate next member code', error);
    return NextResponse.json(
      { error: 'ไม่สามารถสร้างรหัสสมาชิกใหม่ได้' },
      { status: 500 }
    );
  }
}
```

**Pros:**
- ✅ More control over format
- ✅ Can support multiple prefixes
- ✅ Can reset counters if needed
- ✅ Thread-safe with transactions

**Cons:**
- ❌ Requires additional table
- ❌ Slightly more complex

---

## Option 3: Short Alphanumeric Code (Base36)

**Best for**: Shorter codes, more compact, human-readable

### Implementation:

```typescript
// src/lib/codeGenerator.ts
export function generateShortCode(prefix: string, sequence: number): string {
  // Convert to base36 (0-9, a-z)
  const base36 = sequence.toString(36).toUpperCase();
  return `${prefix}${base36.padStart(4, '0')}`; // M0001, M0002, ..., M000A, M000B, etc.
}

// Usage in API:
export async function GET() {
  try {
    // Get max existing code
    const maxMember = await prisma.member.findFirst({
      where: { code: { startsWith: 'M' } },
      orderBy: { code: 'desc' },
    });
    
    let nextNumber = 1;
    if (maxMember?.code) {
      const match = maxMember.code.match(/^M([0-9A-Z]+)$/i);
      if (match) {
        nextNumber = parseInt(match[1], 36) + 1;
      }
    }
    
    const nextCode = generateShortCode('M', nextNumber);
    
    // Verify uniqueness
    const exists = await prisma.member.findUnique({ where: { code: nextCode } });
    if (exists) {
      nextNumber++;
      nextCode = generateShortCode('M', nextNumber);
    }
    
    return NextResponse.json({ code: nextCode });
  } catch (error) {
    // ...
  }
}
```

**Pros:**
- ✅ Shorter codes (M0001 vs M000001)
- ✅ More codes in same length
- ✅ Human-readable

**Cons:**
- ❌ Less intuitive (includes letters)
- ❌ Still needs uniqueness check

---

## Option 4: Timestamp-based with Sequence

**Best for**: Date information embedded, sortable by creation time

### Implementation:

```typescript
export async function GET() {
  try {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // Get count of members created this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const count = await prisma.member.count({
      where: {
        createdAt: { gte: startOfMonth },
        code: { startsWith: `M${year}${month}` }
      }
    });
    
    const sequence = count + 1;
    const nextCode = `M${year}${month}${String(sequence).padStart(4, '0')}`;
    // Example: M25010001 (M + 25 + 01 + 0001) = Member created in Jan 2025, #1
    
    return NextResponse.json({ code: nextCode });
  } catch (error) {
    // ...
  }
}
```

**Pros:**
- ✅ Date information in code
- ✅ Sortable by creation time
- ✅ Resets each month

**Cons:**
- ❌ Longer codes
- ❌ Can have duplicates if not careful

---

## Recommendation: Option 1 (Database Sequence)

For your use case, I recommend **Option 1 (Database Sequence)** because:
1. ✅ Guaranteed uniqueness at database level
2. ✅ Thread-safe for concurrent requests
3. ✅ Simple and reliable
4. ✅ No gaps (unless intentionally reset)
5. ✅ Best performance

### Migration Script:

```sql
-- Create sequence
CREATE SEQUENCE IF NOT EXISTS member_code_seq START 1;

-- Set current value to max existing code (if migrating existing data)
DO $$
DECLARE
  max_code INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 2) AS INTEGER)), 0)
  INTO max_code
  FROM "Member"
  WHERE code ~ '^M[0-9]+$';
  
  IF max_code > 0 THEN
    PERFORM setval('member_code_seq', max_code);
  END IF;
END $$;
```

