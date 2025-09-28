import { describe, it, expect } from 'vitest'
import { TokenBalance } from '../../data-access/types'

// Helper functions extracted for testing
export function calculateAllocation(balances: TokenBalance[], totalValue: number) {
  const CHART_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ]
  
  return balances
    .map((balance, index) => ({
      symbol: balance.symbol,
      name: balance.tokenName,
      value: balance.usdValue,
      percentage: totalValue > 0 ? (balance.usdValue / totalValue) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))
    .sort((a, b) => b.value - a.value)
}

export function calculatePerformanceMetrics(balances: TokenBalance[], totalValue: number) {
  return balances
    .map(balance => ({
      symbol: balance.symbol,
      name: balance.tokenName,
      value: balance.usdValue,
      change24h: balance.priceChange24h,
      allocation: totalValue > 0 ? (balance.usdValue / totalValue) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value)
}

export function calculateDiversificationScore(allocationData: Array<{ percentage: number }>, balanceCount: number) {
  if (balanceCount === 0) return 0
  
  const idealPercentage = 100 / balanceCount
  const variance = allocationData.reduce((sum, item) => {
    return sum + Math.pow(item.percentage - idealPercentage, 2)
  }, 0) / balanceCount
  
  return Math.max(0, 100 - (variance / 10))
}

export function calculatePortfolioTotalChange(balances: TokenBalance[]) {
  const totalValue = balances.reduce((sum, balance) => sum + balance.usdValue, 0)
  const totalChange24h = balances.reduce((sum, balance) => {
    const changeValue = (balance.usdValue * balance.priceChange24h) / 100
    return sum + changeValue
  }, 0)
  
  return {
    totalValue,
    totalChange24h: totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0
  }
}

describe('Portfolio Calculation Functions', () => {
  const mockBalances: TokenBalance[] = [
    {
      tokenName: 'Solar Energy Token',
      symbol: 'SOLAR',
      balance: 100,
      usdValue: 1000,
      priceChange24h: 5.0,
      contractAddress: '11111111111111111111111111111112',
      decimals: 9
    },
    {
      tokenName: 'Wind Energy Token',
      symbol: 'WIND',
      balance: 50,
      usdValue: 500,
      priceChange24h: -2.0,
      contractAddress: '22222222222222222222222222222223',
      decimals: 9
    },
    {
      tokenName: 'Battery Storage Token',
      symbol: 'BATTERY',
      balance: 25,
      usdValue: 250,
      priceChange24h: 10.0,
      contractAddress: '33333333333333333333333333333334',
      decimals: 9
    }
  ]

  describe('calculateAllocation', () => {
    it('should calculate correct allocation percentages', () => {
      const totalValue = 1750 // 1000 + 500 + 250
      const allocation = calculateAllocation(mockBalances, totalValue)

      expect(allocation).toHaveLength(3)
      expect(allocation[0].symbol).toBe('SOLAR')
      expect(allocation[0].percentage).toBeCloseTo(57.14, 2) // 1000/1750 * 100
      expect(allocation[1].symbol).toBe('WIND')
      expect(allocation[1].percentage).toBeCloseTo(28.57, 2) // 500/1750 * 100
      expect(allocation[2].symbol).toBe('BATTERY')
      expect(allocation[2].percentage).toBeCloseTo(14.29, 2) // 250/1750 * 100
    })

    it('should sort by value descending', () => {
      const totalValue = 1750
      const allocation = calculateAllocation(mockBalances, totalValue)

      expect(allocation[0].value).toBe(1000)
      expect(allocation[1].value).toBe(500)
      expect(allocation[2].value).toBe(250)
    })

    it('should handle zero total value', () => {
      const allocation = calculateAllocation(mockBalances, 0)

      allocation.forEach(item => {
        expect(item.percentage).toBe(0)
      })
    })

    it('should assign colors correctly', () => {
      const totalValue = 1750
      const allocation = calculateAllocation(mockBalances, totalValue)

      expect(allocation[0].color).toBe('#3b82f6')
      expect(allocation[1].color).toBe('#10b981')
      expect(allocation[2].color).toBe('#f59e0b')
    })
  })

  describe('calculatePerformanceMetrics', () => {
    it('should calculate performance metrics correctly', () => {
      const totalValue = 1750
      const metrics = calculatePerformanceMetrics(mockBalances, totalValue)

      expect(metrics).toHaveLength(3)
      expect(metrics[0].symbol).toBe('SOLAR')
      expect(metrics[0].allocation).toBeCloseTo(57.14, 2)
      expect(metrics[0].change24h).toBe(5.0)
    })

    it('should sort by value descending', () => {
      const totalValue = 1750
      const metrics = calculatePerformanceMetrics(mockBalances, totalValue)

      expect(metrics[0].value).toBe(1000)
      expect(metrics[1].value).toBe(500)
      expect(metrics[2].value).toBe(250)
    })

    it('should handle zero total value for allocation', () => {
      const metrics = calculatePerformanceMetrics(mockBalances, 0)

      metrics.forEach(metric => {
        expect(metric.allocation).toBe(0)
      })
    })
  })

  describe('calculateDiversificationScore', () => {
    it('should calculate perfect diversification score', () => {
      // Perfectly balanced portfolio (33.33% each)
      const perfectAllocation = [
        { percentage: 33.33 },
        { percentage: 33.33 },
        { percentage: 33.34 }
      ]
      const score = calculateDiversificationScore(perfectAllocation, 3)
      expect(score).toBeGreaterThan(99) // Should be close to 100
    })

    it('should calculate poor diversification score', () => {
      // Poorly balanced portfolio (90%, 5%, 5%)
      const poorAllocation = [
        { percentage: 90 },
        { percentage: 5 },
        { percentage: 5 }
      ]
      const score = calculateDiversificationScore(poorAllocation, 3)
      expect(score).toBeLessThan(50) // Should be much lower
    })

    it('should handle empty portfolio', () => {
      const score = calculateDiversificationScore([], 0)
      expect(score).toBe(0)
    })

    it('should handle single asset portfolio', () => {
      const singleAllocation = [{ percentage: 100 }]
      const score = calculateDiversificationScore(singleAllocation, 1)
      expect(score).toBe(100) // Single asset is perfectly diversified for its size
    })
  })

  describe('calculatePortfolioTotalChange', () => {
    it('should calculate total portfolio change correctly', () => {
      const result = calculatePortfolioTotalChange(mockBalances)

      expect(result.totalValue).toBe(1750)
      
      // Expected calculation:
      // SOLAR: 1000 * 5% = 50
      // WIND: 500 * -2% = -10
      // BATTERY: 250 * 10% = 25
      // Total change: 50 - 10 + 25 = 65
      // Percentage: 65 / 1750 * 100 = 3.71%
      expect(result.totalChange24h).toBeCloseTo(3.71, 2)
    })

    it('should handle empty portfolio', () => {
      const result = calculatePortfolioTotalChange([])

      expect(result.totalValue).toBe(0)
      expect(result.totalChange24h).toBe(0)
    })

    it('should handle negative total change', () => {
      const negativeBalances: TokenBalance[] = [
        {
          ...mockBalances[0],
          priceChange24h: -10.0
        },
        {
          ...mockBalances[1],
          priceChange24h: -5.0
        }
      ]

      const result = calculatePortfolioTotalChange(negativeBalances)
      expect(result.totalChange24h).toBeLessThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle balances with zero USD value', () => {
      const zeroValueBalances: TokenBalance[] = [
        {
          ...mockBalances[0],
          usdValue: 0
        },
        ...mockBalances.slice(1)
      ]

      const totalValue = 750 // 500 + 250
      const allocation = calculateAllocation(zeroValueBalances, totalValue)
      
      // After sorting by value, the zero value item should be last
      expect(allocation[0].percentage).toBeCloseTo(66.67, 2) // 500/750 (WIND)
      expect(allocation[1].percentage).toBeCloseTo(33.33, 2) // 250/750 (BATTERY)
      expect(allocation[2].percentage).toBe(0) // Zero value should have 0% (SOLAR)
    })

    it('should handle extreme price changes', () => {
      const extremeBalances: TokenBalance[] = [
        {
          ...mockBalances[0],
          priceChange24h: 1000.0 // 1000% gain
        },
        {
          ...mockBalances[1],
          priceChange24h: -99.9 // 99.9% loss
        }
      ]

      const result = calculatePortfolioTotalChange(extremeBalances)
      expect(result.totalChange24h).toBeGreaterThan(0) // Should still be positive due to large gain
    })

    it('should handle very small numbers', () => {
      const smallBalances: TokenBalance[] = [
        {
          ...mockBalances[0],
          usdValue: 0.001,
          priceChange24h: 0.01
        }
      ]

      const result = calculatePortfolioTotalChange(smallBalances)
      expect(result.totalValue).toBe(0.001)
      expect(result.totalChange24h).toBe(0.01)
    })
  })
})