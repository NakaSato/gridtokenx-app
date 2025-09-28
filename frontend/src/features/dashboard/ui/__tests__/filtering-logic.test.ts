import { describe, it, expect } from 'vitest'
import { Transaction, TransactionFilters } from '../../data-access/types'

// Mock transaction data for testing
const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'buy',
    energyType: 'solar',
    quantity: 100,
    pricePerKwh: 0.08,
    totalAmount: 8.0,
    timestamp: new Date('2024-01-15').getTime(),
    status: 'confirmed',
    transactionHash: 'hash1',
    counterparty: 'Solar Farm A',
  },
  {
    id: 'tx-2',
    type: 'sell',
    energyType: 'wind',
    quantity: 50,
    pricePerKwh: 0.06,
    totalAmount: 3.0,
    timestamp: new Date('2024-01-10').getTime(),
    status: 'pending',
    transactionHash: 'hash2',
    counterparty: 'Wind Farm B',
  },
  {
    id: 'tx-3',
    type: 'buy',
    energyType: 'battery',
    quantity: 25,
    pricePerKwh: 0.12,
    totalAmount: 3.0,
    timestamp: new Date('2024-01-05').getTime(),
    status: 'failed',
    transactionHash: 'hash3',
    counterparty: 'Battery Storage C',
  }
]

// Filter function extracted from the component logic
function filterTransactions(
  transactions: Transaction[], 
  filters: TransactionFilters,
  searchTerm: string = ''
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

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        tx.transactionHash.toLowerCase().includes(searchLower) ||
        tx.counterparty.toLowerCase().includes(searchLower) ||
        tx.energyType.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) {
        return false
      }
    }

    return true
  })
}

describe('Transaction Filtering Logic', () => {
  it('should return all transactions when no filters are applied', () => {
    const filters: TransactionFilters = {
      type: 'all',
      status: 'all',
      energyType: [],
    }
    
    const result = filterTransactions(mockTransactions, filters)
    expect(result).toHaveLength(3)
    expect(result).toEqual(mockTransactions)
  })

  it('should filter by transaction type', () => {
    const filters: TransactionFilters = {
      type: 'buy',
      status: 'all',
      energyType: [],
    }
    
    const result = filterTransactions(mockTransactions, filters)
    expect(result).toHaveLength(2)
    expect(result.every(tx => tx.type === 'buy')).toBe(true)
  })

  it('should filter by energy type', () => {
    const filters: TransactionFilters = {
      type: 'all',
      status: 'all',
      energyType: ['solar', 'wind'],
    }
    
    const result = filterTransactions(mockTransactions, filters)
    expect(result).toHaveLength(2)
    expect(result.every(tx => ['solar', 'wind'].includes(tx.energyType))).toBe(true)
  })

  it('should filter by status', () => {
    const filters: TransactionFilters = {
      type: 'all',
      status: 'confirmed',
      energyType: [],
    }
    
    const result = filterTransactions(mockTransactions, filters)
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('confirmed')
  })

  it('should filter by date range', () => {
    const startDate = new Date('2024-01-08')
    const endDate = new Date('2024-01-20')
    
    const filters: TransactionFilters = {
      type: 'all',
      status: 'all',
      energyType: [],
      dateRange: [startDate, endDate],
    }
    
    const result = filterTransactions(mockTransactions, filters)
    expect(result).toHaveLength(2) // tx-1 and tx-2 fall within range
    expect(result.every(tx => {
      const txDate = new Date(tx.timestamp)
      return txDate >= startDate && txDate <= endDate
    })).toBe(true)
  })

  it('should filter by search term - counterparty', () => {
    const result = filterTransactions(mockTransactions, {
      type: 'all',
      status: 'all',
      energyType: [],
    }, 'Solar Farm')
    
    expect(result).toHaveLength(1)
    expect(result[0].counterparty).toBe('Solar Farm A')
  })

  it('should filter by search term - energy type', () => {
    const result = filterTransactions(mockTransactions, {
      type: 'all',
      status: 'all',
      energyType: [],
    }, 'wind')
    
    expect(result).toHaveLength(1)
    expect(result[0].energyType).toBe('wind')
  })

  it('should filter by search term - transaction hash', () => {
    const result = filterTransactions(mockTransactions, {
      type: 'all',
      status: 'all',
      energyType: [],
    }, 'hash2')
    
    expect(result).toHaveLength(1)
    expect(result[0].transactionHash).toBe('hash2')
  })

  it('should apply multiple filters simultaneously', () => {
    const filters: TransactionFilters = {
      type: 'buy',
      status: 'confirmed',
      energyType: ['solar'],
    }
    
    const result = filterTransactions(mockTransactions, filters)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('tx-1')
    expect(result[0].type).toBe('buy')
    expect(result[0].status).toBe('confirmed')
    expect(result[0].energyType).toBe('solar')
  })

  it('should return empty array when no transactions match filters', () => {
    const filters: TransactionFilters = {
      type: 'sell',
      status: 'confirmed',
      energyType: ['battery'],
    }
    
    const result = filterTransactions(mockTransactions, filters)
    expect(result).toHaveLength(0)
  })

  it('should handle case-insensitive search', () => {
    const result = filterTransactions(mockTransactions, {
      type: 'all',
      status: 'all',
      energyType: [],
    }, 'SOLAR FARM')
    
    expect(result).toHaveLength(1)
    expect(result[0].counterparty).toBe('Solar Farm A')
  })
})