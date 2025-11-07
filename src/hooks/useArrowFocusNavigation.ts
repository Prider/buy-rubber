'use client';

import { useEffect } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]',
  '[role="link"]',
].join(', ');

const isEditableElement = (element: Element | null): boolean => {
  if (!element) return false;
  if (!(element instanceof HTMLElement)) return false;

  const tagName = element.tagName;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) {
    return true;
  }

  if (element.isContentEditable) {
    return true;
  }

  const type = (element as HTMLInputElement).type;
  return [
    'text',
    'search',
    'number',
    'email',
    'tel',
    'url',
    'password',
  ].includes(type);
};

const isFocusable = (element: HTMLElement): boolean => {
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  if (element.tabIndex < 0) return false;

  const rect = element.getBoundingClientRect();
  const isVisible = rect.width > 0 && rect.height > 0;
  if (!isVisible) return false;

  const style = window.getComputedStyle(element);
  if (style.visibility === 'hidden' || style.display === 'none') return false;

  return true;
};

const getFocusableElements = (): HTMLElement[] => {
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(isFocusable);
};

const getNextIndex = (currentIndex: number, direction: 'forward' | 'backward', total: number): number => {
  if (total === 0) return -1;

  if (currentIndex === -1) {
    return direction === 'forward' ? 0 : total - 1;
  }

  if (direction === 'forward') {
    return (currentIndex + 1) % total;
  }

  return (currentIndex - 1 + total) % total;
};

export const useArrowFocusNavigation = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        return;
      }

      if (event.defaultPrevented) return;

      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;

      if (isEditableElement(activeElement)) {
        if (!activeElement || activeElement.tagName !== 'INPUT') {
          return;
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          return;
        }
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        return;
      }

      const currentIndex = activeElement ? focusableElements.indexOf(activeElement) : -1;

      const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 'forward' : 'backward';
      const nextIndex = getNextIndex(currentIndex, direction, focusableElements.length);

      if (nextIndex === -1) {
        return;
      }

      const nextElement = focusableElements[nextIndex];
      if (!nextElement || nextElement === activeElement) {
        return;
      }

      event.preventDefault();
      nextElement.focus();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
};

export default useArrowFocusNavigation;

