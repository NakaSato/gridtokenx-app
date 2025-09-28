import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TransactionHistory } from '../transaction-history'
import * as useTransactionHistoryModule from '../../data-access/use-transaction-history'
import { Transaction } from '../../data-access/types'

// Mock the Solana hook
vi.mock('@/components/solana/use-solana', () => ({
  useSolana: () => ({
    account: {
      publicKey: {
        toString: () => 'mock-public-key'
      }
    }
  })
}))

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'buy',
    energyType: 'solar',
    quantity: 100,
    pricePerKwh: 0.08,
    totalAmount: 8.0,
    timestamp: Date.now() - 3600000,
    status: 'confirmed',
    transactionHash: '5KJp7KqprzMcBsgWMBoUvL2D5sJ8oTdoAN5LgCEW8szqeqKpjUjFn3s4yhANTgSa7w2TBpAqNVE4',
    counterparty: 'Solar Farm A',
    blockHeight: 245678901,
    gasUsed: 5000
  },
  {
    id: 'tx-2',
    type: 'sell',
    energyType: 'wind',
    quantity: 50,
    pricePerKwh: 0.06,
    totalAmount: 3.0,
    timestamp: Date.now() - 7200000,
    status: 'pending',
    transactionHash: '3NJp9KqprzMcBsgWMBoUvL2D5sJ8oTdoAN5LgCEW8szqeqKpjUjFn3s4yhANTgSa7w2TBpAqNVE4',
    counterparty: 'Energy Buyer B',
    gasUsed: 4500
  }
]

const mockTransactionHistoryData = {
  transactions: mockTransactions,
  totalCount: 2,
  totalPages: 1,
  currentPage: 1
}

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('TransactionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders transaction history table with data', async () => {
    vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
      data: mockTransactionHistoryData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success'
    } as any)

    renderWithQueryClient(<TransactionHistory />)

    expect(screen.getByText('Transaction History')).toBeInTheDocument()
    expect(screen.getByText('Solar Farm A')).toBeInTheDocument()
    expect(screen.getByText('Energy Buyer B')).toBeInTheDocument()
    expect(screen.getByText('100 kWh')).toBeInTheDocument()
    expect(screen.getByText('50 kWh')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: false,
      status: 'loading'
    } as any)

    renderWithQueryClient(<TransactionHistory />)

    expect(screen.getByText('Transaction History')).toBeInTheDocument()
    // Check for loading skeletons
    const loadingElements = document.querySelectorAll('.animate-pulse')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('shows error state', () => {
    vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
      isError: true,
      isSuccess: false,
      status: 'error'
    } as any)

    renderWithQueryClient(<TransactionHistory />)

    expect(screen.getByText('Failed to load transaction history')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('filters transactions by type', async () => {
    vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
      data: mockTransactionHistoryData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success'
    } as any)

    renderWithQueryClient(<TransactionHistory />)

    // Open type filter dropdown
    const typeFilter = screen.getByText('Type: All')
    fireEvent.click(typeFilter)

    // Select 'Buy' filter
    const buyOption = screen.getByText('Buy')
    fireEvent.click(buyOption)

    // Verify filter is applied
    expect(screen.getByText('Type: buy')).toBeInTheDocument()
  })

  it('searches transactions', async () => {
    vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
      data: mockTransactionHistoryData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success'
    } as any)

    renderWithQueryClient(<TransactionHistory />)

    const searchInput = screen.getByPlaceholderText('Search by hash, counterparty, or energy type...')
    fireEvent.change(searchInput, { target: { value: 'Solar Farm' } })

    await waitFor(() => {
      expect(screen.getByText('Solar Farm A')).toBeInTheDocument()
      expect(screen.queryByText('Energy Buyer B')).not.toBeInTheDocument()
    })
  })

  it('sorts transactions by clicking column headers', async () => {
    vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
      data: mockTransactionHistoryData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success'
    } as any)

    renderWithQueryClient(<TransactionHistory />)

    // Click on Total column to sort
    const totalHeader = screen.getByText('Total')
    fireEvent.click(totalHeader)

    // Verify sort icon appears
    await waitFor(() => {
      const sortIcon = totalHeader.parentElement?.querySelector('svg')
      expect(sortIcon).toBeInTheDocument()
    })
  })

  it('clears all filters', async () => {
    vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
      data: mockTransactionHistoryData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success'
    } as any)

    renderWithQueryClient(<TransactionHistory />)

    // Apply a filter first
    const typeFilter = screen.getByText('Type: All')
    fireEvent.click(typeFilter)
    const buyOption = screen.getByText('Buy')
    fireEvent.click(buyOption)

    // Clear filters
    const clearButton = screen.getByText('Clear')
    fireEvent.click(clearButton)

    // Verify filters are cleared
    expect(screen.getByText('Type: All')).toBeInTheDocument()
  })

  it('opens blockchain explorer when hash link is clicked', () => {
    vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
      data: mockTransactionHistoryData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success'
    } as any)

    // Mock window.open
    const mockOpen = vi.fn()
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true
    })

    renderWithQueryClient(<TransactionHistory />)

    // Click on external link icon
    const externalLinks = screen.getAllByRole('button')
    const hashLinkButton = externalLinks.find(button => 
      button.querySelector('svg') && button.className.includes('h-6 w-6')
    )
    
    if (hashLinkButton) {
      fireEvent.click(hashLinkButton)
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://explorer.solana.com/tx/'),
        '_blank'
      )
    }
  })

  it('handles pagination', () => {
    const multiPageData = {
      ...mockTransactionHistoryData,
      totalCount: 25,
      totalPages: 3,
      currentPage: 1
    }

    vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
      data: multiPageData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success'
    } as any)

    renderWithQueryClient(<TransactionHistory />)

    expect(screen.getByText('Showing 1 to 10 of 25 transactions')).toBeInTheDocument()
    expect(screen.getByText('of 3')).toBeInTheDocument()
  })

  it('shows empty state when no transactions match filters', () => {
    vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
      data: {
        transactions: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success'
    } as any)

    renderWithQueryClient(<TransactionHistory />)

    expect(screen.getByText('No transactions found')).toBeInTheDocument()
  })
})