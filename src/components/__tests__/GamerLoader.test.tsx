import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import GamerLoader from '../GamerLoader'

describe('GamerLoader', () => {
  it('renders with default message', () => {
    const { container } = render(<GamerLoader />)
    // Check if the component renders and contains the default message
    expect(container.textContent).toContain('กำลังโหลด...')
    expect(container.textContent).toContain('Punsook')
  })

  it('renders with custom message', () => {
    const { container } = render(<GamerLoader message="Loading data..." />)
    // Check if the component renders with custom message
    expect(container.textContent).toContain('Loading data...')
    expect(container.textContent).toContain('Punsook')
  })

  it('applies custom className', () => {
    const { container } = render(<GamerLoader className="custom-class" />)
    const firstChild = container.firstChild as HTMLElement
    expect(firstChild).toHaveClass('custom-class')
  })

  it('shows loading animation bars', () => {
    const { container } = render(<GamerLoader />)
    // Check for animated color bars
    const animatedElements = container.querySelectorAll('[class*="animate-"]')
    expect(animatedElements.length).toBeGreaterThan(0)
  })

  it('renders company branding', () => {
    const { container } = render(<GamerLoader />)
    // Check for Punsook Innotech branding
    expect(container.textContent).toContain('Punsook')
    expect(container.textContent).toContain('Innotech')
  })
})

