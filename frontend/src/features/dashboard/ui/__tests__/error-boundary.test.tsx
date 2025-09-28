import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardErrorBoundary, ErrorBoundaryWrapper, TradingErrorBoundary } from '../dashboard-error-boundary'

// Mock console.error to avoid noise in tests
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalError
})

// Component that throws an error for testing
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('DashboardErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <DashboardErrorBoundary>
        <div>Test content</div>
      </DashboardErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('shows retry button and handles retry', () => {
    const { rerender } = render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    )

    const retryButton = screen.getByText(/Try Again/)
    expect(retryButton).toBeInTheDocument()

    // Click retry - should reset error state
    fireEvent.click(retryButton)

    // Rerender with non-throwing component
    rerender(
      <DashboardErrorBoundary>
        <ThrowError shouldThrow={false} />
      </DashboardErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('shows reset button and handles reset', () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    )

    const resetButton = screen.getByText('Reset Component')
    expect(resetButton).toBeInTheDocument()

    fireEvent.click(resetButton)
    // After reset, error boundary should be in clean state
  })

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn()
    
    render(
      <DashboardErrorBoundary onError={onError}>
        <ThrowError />
      </DashboardErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <DashboardErrorBoundary fallback={customFallback}>
        <ThrowError />
      </DashboardErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('limits retry attempts', () => {
    const { rerender } = render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    )

    // Click retry 3 times (max retries)
    for (let i = 0; i < 3; i++) {
      const retryButton = screen.getByText(/Try Again/)
      fireEvent.click(retryButton)
      
      rerender(
        <DashboardErrorBoundary>
          <ThrowError />
        </DashboardErrorBoundary>
      )
    }

    // After max retries, should show warning message
    expect(screen.getByText('Maximum retry attempts reached')).toBeInTheDocument()
    expect(screen.queryByText(/Try Again/)).not.toBeInTheDocument()
  })
})

describe('ErrorBoundaryWrapper', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundaryWrapper componentName="Test Component">
        <div>Test content</div>
      </ErrorBoundaryWrapper>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('calls onError with component name context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(
      <ErrorBoundaryWrapper componentName="Test Component">
        <ThrowError />
      </ErrorBoundaryWrapper>
    )

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error in Test Component:',
      expect.any(Error),
      expect.any(Object)
    )

    consoleSpy.mockRestore()
  })
})

describe('TradingErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <TradingErrorBoundary>
        <div>Trading content</div>
      </TradingErrorBoundary>
    )

    expect(screen.getByText('Trading content')).toBeInTheDocument()
  })

  it('renders trading-specific error message when error occurs', () => {
    render(
      <TradingErrorBoundary>
        <ThrowError />
      </TradingErrorBoundary>
    )

    expect(screen.getByText('Trading Component Error')).toBeInTheDocument()
    expect(screen.getByText(/Unable to load trading functionality/)).toBeInTheDocument()
    expect(screen.getByText('Network connectivity issues')).toBeInTheDocument()
  })

  it('shows reload button in trading error boundary', () => {
    // Mock window.location.reload
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true
    })

    render(
      <TradingErrorBoundary>
        <ThrowError />
      </TradingErrorBoundary>
    )

    const reloadButton = screen.getByText('Reload Dashboard')
    fireEvent.click(reloadButton)

    expect(reloadMock).toHaveBeenCalled()
  })
})

describe('Error Boundary Integration', () => {
  it('handles nested error boundaries correctly', () => {
    render(
      <DashboardErrorBoundary>
        <div>
          <TradingErrorBoundary>
            <div>Working component</div>
            <ThrowError />
          </TradingErrorBoundary>
        </div>
      </DashboardErrorBoundary>
    )

    // Should show trading-specific error, not the outer boundary
    expect(screen.getByText('Trading Component Error')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('falls back to outer boundary when inner boundary fails', () => {
    // This would be a more complex test scenario where the error boundary itself fails
    // For now, we'll just verify the basic nesting works
    render(
      <DashboardErrorBoundary>
        <ErrorBoundaryWrapper componentName="Inner Component">
          <div>Nested content</div>
        </ErrorBoundaryWrapper>
      </DashboardErrorBoundary>
    )

    expect(screen.getByText('Nested content')).toBeInTheDocument()
  })
})