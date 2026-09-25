import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    act(() => {
      rerender({ value: 'updated', delay: 300 });
    });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by 299ms (just before delay)
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // Fast-forward time by 1ms more (after delay)
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should use custom delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    act(() => {
      rerender({ value: 'updated', delay: 500 });
    });

    // Value should not change before delay
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');

    // Value should change after delay
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should use default delay of 300ms when not provided', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      {
        initialProps: { value: 'initial' },
      }
    );

    act(() => {
      rerender({ value: 'updated' });
    });

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout when value changes rapidly', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 'initial' },
      }
    );

    // Rapid value changes
    act(() => {
      rerender({ value: 'value1' });
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      rerender({ value: 'value2' });
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      rerender({ value: 'value3' });
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should still be initial value
    expect(result.current).toBe('initial');

    // After full delay from last change
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('value3');
  });

  it('should handle number values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 0 },
      }
    );

    act(() => {
      rerender({ value: 100 });
    });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(100);
  });

  it('should handle object values', async () => {
    const initialObj = { name: 'test', count: 0 };
    const updatedObj = { name: 'test', count: 1 };

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: initialObj },
      }
    );

    act(() => {
      rerender({ value: updatedObj });
    });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toEqual(updatedObj);
  });

  it('should handle array values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: [1, 2, 3] },
      }
    );

    act(() => {
      rerender({ value: [4, 5, 6] });
    });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toEqual([4, 5, 6]);
  });

  it('should handle boolean values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: false },
      }
    );

    act(() => {
      rerender({ value: true });
    });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);
  });

  it('should handle null and undefined values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: null },
      }
    );

    act(() => {
      rerender({ value: undefined });
    });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBeUndefined();
  });

  it('should update when delay changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    act(() => {
      rerender({ value: 'updated', delay: 100 });
    });
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('updated');
  });
});

