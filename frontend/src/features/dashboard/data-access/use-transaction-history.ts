import { useQuery } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { tradingQueryKeys } from './query-keys'
import { Transaction, TransactionFilters, TransactionHistoryData } from './types'

// Mock transaction data for development
const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'buy',
    energyType: 'solar',
    quantity: 100,
    pricePerKwh: 0.08,
    totalAmount: 8.0,
    timestamp: Date.now() - 3600000, // 1 hour ago
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
    timestamp: Date.now() - 7200000, // 2 hours ago
    status: 'confirmed',
    transactionHash: '3NJp9KqprzMcBsgWMBoUvL2D5sJ8oTdoAN5LgCEW8szqeqKpjUjFn3s4yhANTgSa7w2TBpAqNVE4',
    counterparty: 'Energy Buyer B',
    blockHeight: 245678850,
    gasUsed: 4500
  },
  {
    id: 'tx-3',
    type: 'buy',
    energyType: 'battery',
    quantity: 25,
    pricePerKwh: 0.12,
    totalAmount: 3.0,
    timestamp: Date.now() - 10800000, // 3 hours ago
    status: 'pending',
    transactionHash: '7MJp2KqprzMcBsgWMBoUvL2D5sJ8oTdoAN5LgCEW8szqeqKpjUjFn3s4yhANTgSa7w2TBpAqNVE4',
    counterparty: 'Battery Storage C',
    gasUsed: 5200
  },
  {
    id: 'tx-4',
    type: 'sell',
    energyType: 'solar',
    quantity: 75,
    pricePerKwh: 0.085,
    totalAmount: 6.375,
    timestamp: Date.now() - 86400000, // 1 day ago
    status: 'confirmed',
    transactionHash: '9LJp4KqprzMcBsgWMBoUvL2D5sJ8oTdoAN5LgCEW8szqeqKpjUjFn3s4yhANTgSa7w2TBpAqNVE4',
    counterparty: 'Grid Operator D',
    blockHeight: 245675200,
    gasUsed: 4800
  },
  {
    id: 'tx-5',
    type: 'buy',
    energyType: 'grid',
    quantity: 200,
    pricePerKwh: 0.10,
    totalAmount: 20.0,
    timestamp: Date.now() - 172800000, // 2 days ago
    status: 'failed',
    transactionHash: '1KJp6KqprzMcBsgWMBoUvL2D5sJ8oTdoAN5LgCEW8szqeqKpjUjFn3s4yhANTgSa7w2TBpAqNVE4',
    counterparty: 'Grid Provider E',
    gasUsed: 3000
  }
]

function filterTransactions(
  transactions: Transaction[], 
  filters: TransactionFilters
): Transaction[] {
  return transactions.filter(tx => {
    // Date range filter
    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange
      const txDate = new Date(tx.timestamp)
      if (txDate < startDate || txDate > endDate) {
        return false
      }
    }

    // Type filter
    if (filters.type && filters.type !== 'all' && tx.type !== filters.type) {
      return false
    }

    // Energy type filter
    if (filters.energyType && filters.energyType.length > 0 && !filters.energyType.includes(tx.energyType)) {
      return false
    }

    // Status filter
    if (filters.status && filters.status !== 'all' && tx.status !== filters.status) {
      return false
    }

    return true
  })
}

async function fetchTransactionHistory(
  publicKey: string,
  page: number = 1,
  pageSize: number = 10,
  filters: TransactionFilters = {}
): Promise<TransactionHistoryData> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 400))
  
  // In production, this would fetch from Solana blockchain
  const filteredTransactions = filterTransactions(mockTransactions, filters)
  const totalCount = filteredTransactions.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const transactions = filteredTransactions.slice(startIndex, endIndex)
  
  return {
    transactions,
    totalCount,
    totalPages,
    currentPage: page
  }
}

export function useTransactionHistory(
  page: number = 1,
  pageSize: number = 10,
  filters: TransactionFilters = {}
) {
  const { account } = useSolana()
  
  return useQuery({
    queryKey: tradingQueryKeys.transactionHistoryByUser(
      account?.publicKey?.toString() || '', 
      page, 
      pageSize, 
      filters
    ),
    queryFn: () => fetchTransactionHistory(account?.publicKey?.toString() || '', page, pageSize, filters),
    enabled: !!account?.publicKey,
    staleTime: 60000, // Consider data stale after 1 minute
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  })
}

export function useTransactionHistoryQueryKey(
  page: number = 1,
  pageSize: number = 10,
  filters: TransactionFilters = {}
) {
  const { account } = useSolana()
  return tradingQueryKeys.transactionHistoryByUser(
    account?.publicKey?.toString() || '', 
    page, 
    pageSize, 
    filters
  )
}