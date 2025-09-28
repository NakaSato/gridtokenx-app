import { describe, it, expect } from 'vitest'
import { getExplorerUrl, formatTransactionSummary } from '../export-utils'
import { Transaction } from '../../data-access/types'

// Mock transaction data
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
    timestamp: new Date('2024-01-10').getTime(),
    status: 'pending',
    transactionHash: 'hash2',
    counterparty: 'Wind Farm B',
    gasUsed: 4500
  },
  {
    id: 'tx-3',
    type: 'buy',
    energyType: 'solar',
    quantity: 25,
    pricePerKwh: 0.12,
    totalAmount: 3.0,
    timestamp: new Date('2024-01-05').getTime(),
    status: 'failed',
    transactionHash: 'hash3',
    counterparty: 'Battery Storage C',
    gasUsed: 5200
  }
]

describe('Export Utils', () => {
  describe('getExplorerUrl', () => {
    it('should generate mainnet explorer URL by default', () => {
      const hash = 'test-hash-123'
      const url = getExplorerUrl(hash)
      expect(url).toBe('https://explorer.solana.com/tx/test-hash-123')
    })

    it('should generate devnet explorer URL', () => {
      const hash = 'test-hash-123'
      const url = getExplorerUrl(hash, 'devnet')
      expect(url).toBe('https://explorer.solana.com/tx/test-hash-123?cluster=devnet')
    })

    it('should generate testnet explorer URL', () => {
      const hash = 'test-hash-123'
      const url = getExplorerUrl(hash, 'testnet')
      expect(url).toBe('https://explorer.solana.com/tx/test-hash-123?cluster=testnet')
    })
  })

  // Note: copyToClipboard tests are skipped as they require browser environment

  describe('formatTransactionSummary', () => {
    it('should format transaction summary correctly', () => {
      const summary = formatTransactionSummary(mockTransactions)
      
      expect(summary).toContain('Total Transactions: 3')
      expect(summary).toContain('Total Volume: 14.000 SOL')
      expect(summary).toContain('Buy Orders: 2')
      expect(summary).toContain('Sell Orders: 1')
      expect(summary).toContain('solar: 2')
      expect(summary).toContain('wind: 1')
      expect(summary).toContain('confirmed: 1')
      expect(summary).toContain('pending: 1')
      expect(summary).toContain('failed: 1')
    })

    it('should handle empty transaction list', () => {
      const summary = formatTransactionSummary([])
      
      expect(summary).toContain('Total Transactions: 0')
      expect(summary).toContain('Total Volume: 0.000 SOL')
      expect(summary).toContain('Buy Orders: 0')
      expect(summary).toContain('Sell Orders: 0')
    })

    it('should calculate totals correctly', () => {
      const singleTransaction = [mockTransactions[0]]
      const summary = formatTransactionSummary(singleTransaction)
      
      expect(summary).toContain('Total Transactions: 1')
      expect(summary).toContain('Total Volume: 8.000 SOL')
      expect(summary).toContain('Buy Orders: 1')
      expect(summary).toContain('Sell Orders: 0')
    })
  })
})