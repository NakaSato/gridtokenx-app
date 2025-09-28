import { describe, it, expect } from 'vitest'
import { tradingQueryKeys } from '../query-keys'

describe('Trading Query Keys', () => {
  const mockPublicKey = '11111111111111111111111111111112'
  const mockTimeframe = '24h'
  const mockFilters = { type: 'buy' as const }

  describe('Base keys', () => {
    it('should generate correct base key', () => {
      expect(tradingQueryKeys.all).toEqual(['trading'])
    })
  })

  describe('Trading data keys', () => {
    it('should generate correct trading data key', () => {
      expect(tradingQueryKeys.tradingData()).toEqual(['trading', 'data'])
    })

    it('should generate correct trading data by user key', () => {
      expect(tradingQueryKeys.tradingDataByUser(mockPublicKey)).toEqual([
        'trading', 'data', mockPublicKey
      ])
    })
  })

  describe('Market data keys', () => {
    it('should generate correct market data key', () => {
      expect(tradingQueryKeys.marketData()).toEqual(['trading', 'market'])
    })

    it('should generate correct market data by timeframe key', () => {
      expect(tradingQueryKeys.marketDataByTimeframe(mockTimeframe)).toEqual([
        'trading', 'market', mockTimeframe
      ])
    })
  })

  describe('Transaction history keys', () => {
    it('should generate correct transaction history key', () => {
      expect(tradingQueryKeys.transactionHistory()).toEqual(['trading', 'transactions'])
    })

    it('should generate correct transaction history by user key', () => {
      const page = 1
      const pageSize = 10
      
      expect(tradingQueryKeys.transactionHistoryByUser(mockPublicKey, page, pageSize, mockFilters)).toEqual([
        'trading', 'transactions', mockPublicKey, page, pageSize, mockFilters
      ])
    })
  })

  describe('Network status keys', () => {
    it('should generate correct network status key', () => {
      expect(tradingQueryKeys.networkStatus()).toEqual(['trading', 'network'])
    })
  })

  describe('Token balance keys', () => {
    it('should generate correct token balances key', () => {
      expect(tradingQueryKeys.tokenBalances()).toEqual(['trading', 'balances'])
    })

    it('should generate correct token balances by user key', () => {
      expect(tradingQueryKeys.tokenBalancesByUser(mockPublicKey)).toEqual([
        'trading', 'balances', mockPublicKey
      ])
    })
  })

  describe('Order keys', () => {
    it('should generate correct orders key', () => {
      expect(tradingQueryKeys.orders()).toEqual(['trading', 'orders'])
    })

    it('should generate correct orders by user key', () => {
      expect(tradingQueryKeys.ordersByUser(mockPublicKey)).toEqual([
        'trading', 'orders', mockPublicKey
      ])
    })
  })

  describe('Price data keys', () => {
    it('should generate correct price data key', () => {
      expect(tradingQueryKeys.priceData()).toEqual(['trading', 'prices'])
    })

    it('should generate correct price data by token key', () => {
      const tokenSymbol = 'SOLAR'
      expect(tradingQueryKeys.priceDataByToken(tokenSymbol)).toEqual([
        'trading', 'prices', tokenSymbol
      ])
    })
  })

  describe('Key consistency', () => {
    it('should maintain consistent key structure', () => {
      // All keys should start with the base 'trading' key
      const allKeys = [
        tradingQueryKeys.tradingData(),
        tradingQueryKeys.marketData(),
        tradingQueryKeys.transactionHistory(),
        tradingQueryKeys.networkStatus(),
        tradingQueryKeys.tokenBalances(),
        tradingQueryKeys.orders(),
        tradingQueryKeys.priceData()
      ]

      allKeys.forEach(key => {
        expect(key[0]).toBe('trading')
      })
    })

    it('should generate unique keys for different parameters', () => {
      const key1 = tradingQueryKeys.tradingDataByUser('user1')
      const key2 = tradingQueryKeys.tradingDataByUser('user2')
      
      expect(key1).not.toEqual(key2)
    })
  })
})