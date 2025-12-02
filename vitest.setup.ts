import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
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

// Mock window.alert
global.alert = vi.fn()
global.confirm = vi.fn(() => true)

// Suppress unhandled rejections for expected error scenarios in tests
// These occur when testing error handling where we intentionally throw errors
const originalUnhandledRejection = process.listeners('unhandledRejection');
process.removeAllListeners('unhandledRejection');
process.on('unhandledRejection', (reason, promise) => {
  // Suppress expected database/transaction errors in error handling tests
  if (reason instanceof Error) {
    const errorMessage = reason.message.toLowerCase();
    if (
      errorMessage.includes('database connection failed') ||
      errorMessage.includes('transaction failed') ||
      errorMessage.includes('service fee')
    ) {
      // These are expected in error handling tests, suppress them
      return;
    }
  }
  // Re-throw other unhandled rejections
  if (originalUnhandledRejection.length > 0) {
    originalUnhandledRejection.forEach(listener => listener(reason, promise));
  } else {
    console.error('Unhandled Rejection:', reason);
  }
});

