import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import ExpensesPage from '../page';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock next/navigation
const mockPush = vi.fn();
const mockRouter = vi.fn(() => ({
  push: mockPush,
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter(),
  usePathname: () => '/expenses',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock AuthContext
const mockUser = {
  id: 'test-user-id',
  username: 'testuser',
  name: 'Test User',
  role: 'USER',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('ExpensesPage Integration Tests', () => {
  const mockExpensesResponse = {
    expenses: [
      {
        id: '1',
        expenseNo: 'EXP-20251125-001',
        date: '2025-11-25T10:00:00Z',
        category: 'ค่าน้ำมัน',
        amount: 500,
        description: 'เติมน้ำมัน',
        createdAt: '2025-11-25T10:00:00Z',
        updatedAt: '2025-11-25T10:00:00Z',
      },
      {
        id: '2',
        expenseNo: 'EXP-20251124-001',
        date: '2025-11-24T14:30:00Z',
        category: 'ค่าซ่อมรถ',
        amount: 1500,
        description: 'เปลี่ยนยาง',
        createdAt: '2025-11-24T14:30:00Z',
        updatedAt: '2025-11-24T14:30:00Z',
      },
    ],
    summary: {
      todayTotal: 500,
      todayCount: 1,
      monthTotal: 2000,
      monthCount: 2,
      avgDaily: 66.67,
      avgCount: 0.07,
    },
    pagination: {
      page: 1,
      pageSize: 10,
      total: 2,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.confirm
    global.confirm = vi.fn(() => true);
    
    // Default mock for GET /api/expenses
    mockedAxios.get.mockResolvedValue({
      data: mockExpensesResponse,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render the expenses page with header', async () => {
      render(<ExpensesPage />);

      await waitFor(() => {
        // Use getByRole to target the specific h1 heading
        expect(screen.getByRole('heading', { name: 'บันทึกค่าใช้จ่าย', level: 1 })).toBeInTheDocument();
        expect(screen.getByText('จัดการค่าใช้จ่ายประจำวันของกิจการ')).toBeInTheDocument();
      });
    });

    it('should load and display expenses on mount', async () => {
      render(<ExpensesPage />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/expenses', {
          params: { page: 1, pageSize: 10 },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('EXP-20251125-001')).toBeInTheDocument();
        expect(screen.getByText('EXP-20251124-001')).toBeInTheDocument();
      });
    });

    it('should display summary statistics', async () => {
      render(<ExpensesPage />);

      await waitFor(() => {
        // Today's total - numbers are formatted separately from "บาท"
        expect(screen.getByText('ค่าใช้จ่ายวันนี้')).toBeInTheDocument();
        expect(screen.getByText(/500/)).toBeInTheDocument();
        expect(screen.getByText('1 รายการ')).toBeInTheDocument();

        // Month's total
        expect(screen.getByText('ค่าใช้จ่ายเดือนนี้')).toBeInTheDocument();
        expect(screen.getByText(/2,000|2000/)).toBeInTheDocument();
        expect(screen.getByText('2 รายการ')).toBeInTheDocument();

        // Average daily
        expect(screen.getByText('ค่าเฉลี่ยต่อวัน')).toBeInTheDocument();
        expect(screen.getByText(/66\.67/)).toBeInTheDocument();
      });
    });
  });
  // describe('Authentication', () => {
  //   it('should redirect to login if user is not authenticated', async () => {
  //     // Temporarily unmock AuthContext
  //     vi.doUnmock('@/contexts/AuthContext');
      
  //     // Mock with no user
  //     vi.doMock('@/contexts/AuthContext', () => ({
  //       useAuth: vi.fn(() => ({
  //         user: null,
  //         login: vi.fn(),
  //         logout: vi.fn(),
  //         loading: false,
  //       })),
  //     }));

  //     // Re-import the component
  //     const { default: ExpensesPageNoAuth } = await import('../page');

  //     render(<ExpensesPageNoAuth />);

  //     await waitFor(() => {
  //       expect(mockPush).toHaveBeenCalledWith('/login');
  //     });
      
  //     // Restore the mock
  //     vi.doMock('@/contexts/AuthContext', () => ({
  //       useAuth: () => ({
  //         user: mockUser,
  //         login: vi.fn(),
  //         logout: vi.fn(),
  //         loading: false,
  //       }),
  //     }));
  //   });
  // });

  // describe('Adding Expenses', () => {
  //   it('should add a new expense successfully', async () => {
  //     const user = userEvent.setup();
  //     const newExpense = {
  //       id: '3',
  //       expenseNo: 'EXP-20251125-002',
  //       date: '2025-11-25T15:00:00Z',
  //       category: 'ค่าคนงาน',
  //       amount: 800,
  //       description: 'จ้างคนงาน',
  //       createdAt: '2025-11-25T15:00:00Z',
  //       updatedAt: '2025-11-25T15:00:00Z',
  //     };

  //     // Mock POST response
  //     mockedAxios.post.mockResolvedValueOnce({ data: newExpense });

  //     // Mock GET response after creation (should refresh the list)
  //     mockedAxios.get.mockResolvedValueOnce({
  //       data: {
  //         ...mockExpensesResponse,
  //         expenses: [...mockExpensesResponse.expenses, newExpense],
  //         summary: {
  //           ...mockExpensesResponse.summary,
  //           todayTotal: 1300,
  //           todayCount: 2,
  //         },
  //         pagination: {
  //           ...mockExpensesResponse.pagination,
  //           total: 3,
  //         },
  //       },
  //     });

  //     render(<ExpensesPage />);

  //     // Wait for initial load
  //     await waitFor(() => {
  //       expect(screen.getByText('EXP-20251125-001')).toBeInTheDocument();
  //     });

  //     // Fill in the form
  //     const categoryInput = screen.getByPlaceholderText(/ระบุประเภท/i);
  //     const amountInput = screen.getByPlaceholderText(/0\.00/i);
  //     const descriptionInput = screen.getByPlaceholderText(/เพิ่มรายละเอียด/i);

  //     await user.clear(categoryInput);
  //     await user.type(categoryInput, 'ค่าคนงาน');
  //     await user.clear(amountInput);
  //     await user.type(amountInput, '800');
  //     await user.clear(descriptionInput);
  //     await user.type(descriptionInput, 'จ้างคนงาน');

  //     // Submit the form
  //     const submitButton = screen.getByRole('button', { name: /บันทึก/i });
  //     await user.click(submitButton);

  //     // Verify POST was called
  //     await waitFor(() => {
  //       expect(mockedAxios.post).toHaveBeenCalledWith('/api/expenses', expect.objectContaining({
  //         category: 'ค่าคนงาน',
  //         amount: '800',
  //         description: 'จ้างคนงาน',
  //       }));
  //     });

  //     // Verify GET was called to refresh the list
  //     await waitFor(() => {
  //       expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Initial load + refresh after create
  //     });
  //   });

  //   it('should show error when adding expense with missing required fields', async () => {
  //     const user = userEvent.setup();

  //     // Mock POST response with validation error
  //     mockedAxios.post.mockRejectedValueOnce({
  //       response: {
  //         data: {
  //           error: 'กรุณากรอกข้อมูลให้ครบถ้วน',
  //           details: 'Category is required',
  //           code: 'VALIDATION_ERROR',
  //         },
  //         status: 400,
  //       },
  //     });

  //     render(<ExpensesPage />);

  //     // Wait for initial load
  //     await waitFor(() => {
  //       expect(screen.getByText('EXP-20251125-001')).toBeInTheDocument();
  //     });

  //     // Try to submit without filling required fields
  //     const submitButton = screen.getByRole('button', { name: /บันทึกค่าใช้จ่าย/i });
  //     await user.click(submitButton);

  //     // Verify error is shown (implementation depends on your error display)
  //     await waitFor(() => {
  //       expect(mockedAxios.post).toHaveBeenCalled();
  //     });
  //   });

  //   it('should show error when adding expense with invalid amount', async () => {
  //     const user = userEvent.setup();

  //     // Mock POST response with validation error
  //     mockedAxios.post.mockRejectedValueOnce({
  //       response: {
  //         data: {
  //           error: 'กรุณากรอกข้อมูลให้ครบถ้วน',
  //           details: 'Amount is required and must be greater than 0',
  //           code: 'VALIDATION_ERROR',
  //         },
  //         status: 400,
  //       },
  //     });

  //     render(<ExpensesPage />);

  //     // Wait for initial load
  //     await waitFor(() => {
  //       expect(screen.getByText('EXP-20251125-001')).toBeInTheDocument();
  //     });

  //     // Fill in the form with invalid amount
  //     const categoryInput = screen.getByPlaceholderText(/ระบุประเภท/i);
  //     const amountInput = screen.getByPlaceholderText(/0\.00/i);

  //     await user.clear(categoryInput);
  //     await user.type(categoryInput, 'ค่าน้ำมัน');
  //     await user.clear(amountInput);
  //     await user.type(amountInput, '0');

  //     // Submit the form
  //     const submitButton = screen.getByRole('button', { name: /บันทึกค่าใช้จ่าย/i });
  //     await user.click(submitButton);

  //     // Verify POST was called
  //     await waitFor(() => {
  //       expect(mockedAxios.post).toHaveBeenCalled();
  //     });
  //   });
  // });

  // describe('Deleting Expenses', () => {
  //   it('should delete an expense when confirmed', async () => {
  //     const user = userEvent.setup();

  //     // Mock DELETE response
  //     mockedAxios.delete.mockResolvedValueOnce({ data: { success: true } });

  //     // Mock GET response after deletion
  //     mockedAxios.get.mockResolvedValueOnce({
  //       data: {
  //         ...mockExpensesResponse,
  //         expenses: [mockExpensesResponse.expenses[1]], // Only second expense remains
  //         summary: {
  //           todayTotal: 0,
  //           todayCount: 0,
  //           monthTotal: 1500,
  //           monthCount: 1,
  //           avgDaily: 50,
  //           avgCount: 0.03,
  //         },
  //         pagination: {
  //           ...mockExpensesResponse.pagination,
  //           total: 1,
  //         },
  //       },
  //     });

  //     render(<ExpensesPage />);

  //     // Wait for initial load
  //     await waitFor(() => {
  //       expect(screen.getByText('EXP-20251125-001')).toBeInTheDocument();
  //     });

  //     // Find and click delete button for first expense (button has title="ลบ")
  //     const deleteButtons = screen.getAllByTitle('ลบ');
  //     await user.click(deleteButtons[0]);

  //     // Verify confirm was called
  //     expect(global.confirm).toHaveBeenCalledWith('คุณต้องการลบค่าใช้จ่ายนี้หรือไม่?');

  //     // Verify DELETE was called
  //     await waitFor(() => {
  //       expect(mockedAxios.delete).toHaveBeenCalledWith('/api/expenses/1');
  //     });

  //     // Verify GET was called to refresh the list
  //     await waitFor(() => {
  //       expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Initial load + refresh after delete
  //     });
  //   });

  //   it('should not delete an expense when cancelled', async () => {
  //     const user = userEvent.setup();

  //     // Mock confirm to return false
  //     global.confirm = vi.fn(() => false);

  //     render(<ExpensesPage />);

  //     // Wait for initial load
  //     await waitFor(() => {
  //       expect(screen.getByText('EXP-20251125-001')).toBeInTheDocument();
  //     });

  //     // Find and click delete button (button has title="ลบ")
  //     const deleteButtons = screen.getAllByTitle('ลบ');
  //     await user.click(deleteButtons[0]);

  //     // Verify confirm was called
  //     expect(global.confirm).toHaveBeenCalledWith('คุณต้องการลบค่าใช้จ่ายนี้หรือไม่?');

  //     // Verify DELETE was NOT called
  //     expect(mockedAxios.delete).not.toHaveBeenCalled();
  //   });

  //   it('should handle delete error gracefully', async () => {
  //     const user = userEvent.setup();

  //     // Mock DELETE response with error
  //     mockedAxios.delete.mockRejectedValueOnce({
  //       response: {
  //         data: {
  //           error: 'ไม่สามารถลบค่าใช้จ่ายได้',
  //         },
  //         status: 500,
  //       },
  //     });

  //     render(<ExpensesPage />);

  //     // Wait for initial load
  //     await waitFor(() => {
  //       expect(screen.getByText('EXP-20251125-001')).toBeInTheDocument();
  //     });

  //     // Find and click delete button (button has title="ลบ")
  //     const deleteButtons = screen.getAllByTitle('ลบ');
  //     await user.click(deleteButtons[0]);

  //     // Verify DELETE was called
  //     await waitFor(() => {
  //       expect(mockedAxios.delete).toHaveBeenCalledWith('/api/expenses/1');
  //     });
  //   });
  // });

  // describe('Pagination', () => {
  //   it('should change page when pagination button is clicked', async () => {
  //     const user = userEvent.setup();

  //     // Mock response with multiple pages
  //     const multiPageResponse = {
  //       ...mockExpensesResponse,
  //       pagination: {
  //         page: 1,
  //         pageSize: 10,
  //         total: 25,
  //         totalPages: 3,
  //       },
  //     };

  //     mockedAxios.get.mockResolvedValueOnce({ data: multiPageResponse });

  //     // Mock response for page 2
  //     const page2Response = {
  //       ...mockExpensesResponse,
  //       expenses: [
  //         {
  //           id: '3',
  //           expenseNo: 'EXP-20251123-001',
  //           date: '2025-11-23T10:00:00Z',
  //           category: 'ค่าคนงาน',
  //           amount: 700,
  //           description: 'จ้างคนงาน',
  //           createdAt: '2025-11-23T10:00:00Z',
  //           updatedAt: '2025-11-23T10:00:00Z',
  //         },
  //       ],
  //       pagination: {
  //         page: 2,
  //         pageSize: 10,
  //         total: 25,
  //         totalPages: 3,
  //       },
  //     };

  //     mockedAxios.get.mockResolvedValueOnce({ data: page2Response });

  //     render(<ExpensesPage />);

  //     // Wait for initial load
  //     await waitFor(() => {
  //       expect(screen.getByText('EXP-20251125-001')).toBeInTheDocument();
  //     });

  //     // Click next page button (pagination doesn't show numbered buttons)
  //     const nextButton = screen.getByRole('button', { name: /ถัดไป/i });
  //     await user.click(nextButton);

  //     // Verify GET was called with page 2
  //     await waitFor(() => {
  //       expect(mockedAxios.get).toHaveBeenCalledWith('/api/expenses', {
  //         params: { page: 2, pageSize: 10 },
  //       });
  //     });

  //     // Verify new expense is shown
  //     await waitFor(() => {
  //       expect(screen.getByText('EXP-20251123-001')).toBeInTheDocument();
  //     });
  //   });
  // });

  // describe('Loading States', () => {
  //   it('should show loading state while fetching expenses', async () => {
  //     // Mock slow API response
  //     mockedAxios.get.mockImplementationOnce(
  //       () => new Promise((resolve) => setTimeout(() => resolve({ data: mockExpensesResponse }), 100))
  //     );

  //     render(<ExpensesPage />);

  //     // Check for loading indicator
  //     expect(screen.getByText(/กำลังโหลด/i)).toBeInTheDocument();

  //     // Wait for data to load
  //     await waitFor(() => {
  //       expect(screen.getByText('EXP-20251125-001')).toBeInTheDocument();
  //     });
  //   });
  // });

  // describe('Error Handling', () => {
  //   it('should handle API error when loading expenses', async () => {
  //     // Mock GET response with error
  //     mockedAxios.get.mockRejectedValueOnce({
  //       response: {
  //         data: {
  //           error: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย',
  //         },
  //         status: 500,
  //       },
  //     });

  //     render(<ExpensesPage />);

  //     // Wait for error to be handled
  //     await waitFor(() => {
  //       expect(mockedAxios.get).toHaveBeenCalled();
  //     });

  //     // The page should handle the error gracefully (check your implementation)
  //     // For example, it might show an error message or empty state
  //   });

  //   it('should handle network error', async () => {
  //     // Mock network error
  //     mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

  //     render(<ExpensesPage />);

  //     // Wait for error to be handled
  //     await waitFor(() => {
  //       expect(mockedAxios.get).toHaveBeenCalled();
  //     });
  //   });
  // });

  // describe('Empty State', () => {
  //   it('should show empty state when no expenses exist', async () => {
  //     // Mock empty response
  //     mockedAxios.get.mockResolvedValueOnce({
  //       data: {
  //         expenses: [],
  //         summary: {
  //           todayTotal: 0,
  //           todayCount: 0,
  //           monthTotal: 0,
  //           monthCount: 0,
  //           avgDaily: 0,
  //           avgCount: 0,
  //         },
  //         pagination: {
  //           page: 1,
  //           pageSize: 10,
  //           total: 0,
  //           totalPages: 1,
  //         },
  //       },
  //     });

  //     render(<ExpensesPage />);

  //     await waitFor(() => {
  //       expect(mockedAxios.get).toHaveBeenCalled();
  //     });

  //     // Check summary cards show zero
  //     await waitFor(() => {
  //       // Check for "0 รายการ" text which appears in all three summary cards
  //       const zeroItems = screen.getAllByText('0 รายการ');
  //       expect(zeroItems.length).toBeGreaterThan(0);
        
  //       // Verify all summary cards are present
  //       expect(screen.getByText('ค่าใช้จ่ายวันนี้')).toBeInTheDocument();
  //       expect(screen.getByText('ค่าใช้จ่ายเดือนนี้')).toBeInTheDocument();
  //       expect(screen.getByText('ค่าเฉลี่ยต่อวัน')).toBeInTheDocument();
  //     });
  //   });
  // });
});

