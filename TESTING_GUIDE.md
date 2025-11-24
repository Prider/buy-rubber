# Testing Guide for Punsook Innotech

## 📦 Installation

```bash
# Install testing dependencies
yarn add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest @vitest/ui @vitejs/plugin-react jsdom msw
```

## 🔧 Configuration

### 1. Create `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'electron/',
        '**/*.config.{ts,js}',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 2. Create `vitest.setup.ts`

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

### 3. Update `package.json` scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## 📝 Test Examples

### 1. Component Test - `src/components/__tests__/GamerLoader.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GamerLoader from '../GamerLoader'

describe('GamerLoader', () => {
  it('renders with default message', () => {
    render(<GamerLoader />)
    expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<GamerLoader message="Loading data..." />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<GamerLoader className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('shows loading animation', () => {
    const { container } = render(<GamerLoader />)
    const loader = container.querySelector('.animate-bounce')
    expect(loader).toBeInTheDocument()
  })
})
```

### 2. Hook Test - `src/hooks/__tests__/useCart.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCart } from '../useCart'

// Mock fetch
global.fetch = vi.fn()

describe('useCart', () => {
  const mockMembers = [{ id: '1', name: 'Member 1', code: 'M001' }]
  const mockProductTypes = [{ id: '1', name: 'น้ำยาง', code: 'LATEX' }]
  const mockUser = { id: 'user1', username: 'admin' }
  const mockLoadPurchases = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() =>
      useCart({
        members: mockMembers,
        productTypes: mockProductTypes,
        user: mockUser,
        loadPurchases: mockLoadPurchases,
      })
    )

    expect(result.current.cart).toEqual([])
    expect(result.current.totalAmount).toBe(0)
  })

  it('should add item to cart', () => {
    const { result } = renderHook(() =>
      useCart({
        members: mockMembers,
        productTypes: mockProductTypes,
        user: mockUser,
        loadPurchases: mockLoadPurchases,
      })
    )

    const formData = {
      date: '2023-11-24',
      memberId: '1',
      productTypeId: '1',
      grossWeight: '100',
      containerWeight: '10',
      netWeight: '90',
      pricePerUnit: '50',
      bonusPrice: '0',
      notes: 'Test',
    }

    act(() => {
      result.current.addToCart(formData)
    })

    expect(result.current.cart).toHaveLength(1)
    expect(result.current.cart[0].type).toBe('purchase')
  })

  it('should remove item from cart', () => {
    const { result } = renderHook(() =>
      useCart({
        members: mockMembers,
        productTypes: mockProductTypes,
        user: mockUser,
        loadPurchases: mockLoadPurchases,
      })
    )

    const formData = {
      date: '2023-11-24',
      memberId: '1',
      productTypeId: '1',
      grossWeight: '100',
      containerWeight: '10',
      netWeight: '90',
      pricePerUnit: '50',
      bonusPrice: '0',
      notes: 'Test',
    }

    act(() => {
      result.current.addToCart(formData)
    })

    const itemId = result.current.cart[0].id

    act(() => {
      result.current.removeFromCart(itemId)
    })

    expect(result.current.cart).toHaveLength(0)
  })
})
```

### 3. API Route Test - `src/app/api/__tests__/purchases.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../purchases/route'
import { NextRequest } from 'next/server'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    purchase: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    member: {
      findUnique: vi.fn(),
    },
    productType: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe('POST /api/purchases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a single purchase', async () => {
    const mockPurchase = {
      id: '1',
      purchaseNo: 'PUR-20231124-001',
      memberId: '1',
      productTypeId: '1',
      userId: '1',
      grossWeight: 100,
      netWeight: 90,
      totalAmount: 4500,
    }

    const { prisma } = await import('@/lib/prisma')
    ;(prisma.member.findUnique as any).mockResolvedValue({ id: '1', name: 'Member 1' })
    ;(prisma.productType.findUnique as any).mockResolvedValue({ id: '1', name: 'น้ำยาง' })
    ;(prisma.user.findUnique as any).mockResolvedValue({ id: '1', username: 'admin' })
    ;(prisma.purchase.create as any).mockResolvedValue(mockPurchase)

    const request = new NextRequest('http://localhost:3000/api/purchases', {
      method: 'POST',
      body: JSON.stringify({
        memberId: '1',
        productTypeId: '1',
        userId: '1',
        date: '2023-11-24',
        grossWeight: 100,
        containerWeight: 10,
        pricePerUnit: 50,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.purchaseNo).toBe('PUR-20231124-001')
  })

  it('should return 400 if memberId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/purchases', {
      method: 'POST',
      body: JSON.stringify({
        productTypeId: '1',
        userId: '1',
        grossWeight: 100,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })
})
```

### 4. Utility Function Test - `src/lib/__tests__/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatNumber, calculateDryWeight } from '../utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('฿1,234.56')
    })

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-฿1,234.56')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('฿0.00')
    })
  })

  describe('calculateDryWeight', () => {
    it('should calculate dry weight correctly', () => {
      const netWeight = 100
      const rubberPercent = 60
      const dryWeight = calculateDryWeight(netWeight, rubberPercent)
      expect(dryWeight).toBe(60)
    })

    it('should return netWeight if rubberPercent is 100', () => {
      const netWeight = 100
      const rubberPercent = 100
      const dryWeight = calculateDryWeight(netWeight, rubberPercent)
      expect(dryWeight).toBe(100)
    })
  })
})
```

### 5. Integration Test - `src/__tests__/purchase-flow.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PurchasesPage from '../app/(authenticated)/purchases/page'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock Auth Context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'admin', role: 'admin' },
    logout: vi.fn(),
  }),
}))

describe('Purchase Flow Integration Test', () => {
  it('should complete a full purchase flow', async () => {
    const user = userEvent.setup()
    
    // Mock API responses
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/members')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: '1', name: 'Member 1', code: 'M001' }],
        })
      }
      if (url.includes('/api/product-types')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: '1', name: 'น้ำยาง', code: 'LATEX' }],
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    }) as any

    render(<PurchasesPage />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('รับซื้อยาง')).toBeInTheDocument()
    })

    // Fill in purchase form
    const memberInput = screen.getByLabelText('สมาชิก')
    await user.type(memberInput, 'M001')

    // Add more test steps...
  })
})
```

## 🎯 What to Test

### Priority 1: Core Business Logic
- ✅ Cart operations (add, remove, calculate totals)
- ✅ Price calculations (dry weight, splits, bonuses)
- ✅ Purchase number generation
- ✅ Payment calculations

### Priority 2: User Interactions
- ✅ Form validations
- ✅ Modal operations
- ✅ Table filtering and sorting
- ✅ Search functionality

### Priority 3: API Routes
- ✅ Purchase creation (single and batch)
- ✅ Member CRUD operations
- ✅ ServiceFee creation
- ✅ Authentication flow

### Priority 4: Edge Cases
- ✅ Empty states
- ✅ Error handling
- ✅ Loading states
- ✅ Network failures

## 🚀 Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test

# Run tests with UI
yarn test:ui

# Run tests once (CI mode)
yarn test:run

# Generate coverage report
yarn test:coverage
```

## 📊 Coverage Goals

- **Functions**: > 80%
- **Statements**: > 80%
- **Branches**: > 70%
- **Lines**: > 80%

## 🔍 Testing Best Practices

1. **Test User Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal state

2. **Use Descriptive Test Names**
   ```typescript
   it('should display error when member is not selected', () => {})
   ```

3. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should calculate total correctly', () => {
     // Arrange
     const items = [...]
     
     // Act
     const total = calculateTotal(items)
     
     // Assert
     expect(total).toBe(1000)
   })
   ```

4. **Mock External Dependencies**
   - Mock API calls with MSW
   - Mock database with Prisma mock
   - Mock browser APIs (localStorage, etc.)

5. **Keep Tests Independent**
   - Each test should run in isolation
   - Use `beforeEach` to reset state

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [MSW (API Mocking)](https://mswjs.io/)

## 🐛 Debugging Tests

```typescript
// Use screen.debug() to see rendered output
import { screen } from '@testing-library/react'

it('debugs correctly', () => {
  render(<Component />)
  screen.debug() // Prints the entire DOM
  screen.debug(screen.getByRole('button')) // Prints specific element
})
```

## 📝 Next Steps

1. Install testing dependencies
2. Set up configuration files
3. Write your first test for a utility function
4. Gradually add tests for components
5. Add integration tests for critical flows
6. Set up CI/CD to run tests automatically

