import { describe, it, expect, vi } from 'vitest'
import { TradingOpportunity } from '../../data-access/types'

// Test utility functions for modal logic
function calculateBuyTotal(pricePerKwh: number, quantity: number, feeRate: number = 0.001) {
  const totalCost = quantity * pricePerKwh
  const estimatedFee = totalCost * feeRate
  return {
    totalCost,
    estimatedFee,
    totalWithFee: totalCost + estimatedFee
  }
}

function calculateSellRevenue(pricePerKwh: number, quantity: number, feeRate: number = 0.001) {
  const totalRevenue = quantity * pricePerKwh
  const estimatedFee = totalRevenue * feeRate
  return {
    totalRevenue,
    estimatedFee,
    netRevenue: totalRevenue - estimatedFee
  }
}

function validateBuyInput(quantity: number, maxQuantity: number) {
  if (quantity <= 0) return 'Quantity must be greater than 0'
  if (quantity > maxQuantity) return 'Quantity exceeds available amount'
  return null
}

function validateSellInput(quantity: number, pricePerKwh: number) {
  if (quantity <= 0) return 'Quantity must be greater than 0'
  if (pricePerKwh <= 0) return 'Price must be greater than 0'
  return null
}

describe('Trading Modals Logic', () => {
  describe('Buy Modal Calculations', () => {
    it('calculates buy total correctly', () => {
      const result = calculateBuyTotal(0.08, 100)
      
      expect(result.totalCost).toBe(8.0)
      expect(result.estimatedFee).toBe(0.008)
      expect(result.totalWithFee).toBe(8.008)
    })

    it('calculates buy total with custom fee rate', () => {
      const result = calculateBuyTotal(0.10, 50, 0.002)
      
      expect(result.totalCost).toBe(5.0)
      expect(result.estimatedFee).toBe(0.01)
      expect(result.totalWithFee).toBe(5.01)
    })

    it('handles zero quantity', () => {
      const result = calculateBuyTotal(0.08, 0)
      
      expect(result.totalCost).toBe(0)
      expect(result.estimatedFee).toBe(0)
      expect(result.totalWithFee).toBe(0)
    })

    it('handles fractional quantities', () => {
      const result = calculateBuyTotal(0.075, 33.5)
      
      expect(result.totalCost).toBeCloseTo(2.5125, 4)
      expect(result.estimatedFee).toBeCloseTo(0.0025125, 7)
      expect(result.totalWithFee).toBeCloseTo(2.5150125, 7)
    })
  })

  describe('Sell Modal Calculations', () => {
    it('calculates sell revenue correctly', () => {
      const result = calculateSellRevenue(0.08, 100)
      
      expect(result.totalRevenue).toBe(8.0)
      expect(result.estimatedFee).toBe(0.008)
      expect(result.netRevenue).toBe(7.992)
    })

    it('calculates sell revenue with custom fee rate', () => {
      const result = calculateSellRevenue(0.10, 50, 0.002)
      
      expect(result.totalRevenue).toBe(5.0)
      expect(result.estimatedFee).toBe(0.01)
      expect(result.netRevenue).toBe(4.99)
    })

    it('handles zero quantity', () => {
      const result = calculateSellRevenue(0.08, 0)
      
      expect(result.totalRevenue).toBe(0)
      expect(result.estimatedFee).toBe(0)
      expect(result.netRevenue).toBe(0)
    })

    it('handles high fee rates', () => {
      const result = calculateSellRevenue(1.0, 10, 0.1) // 10% fee
      
      expect(result.totalRevenue).toBe(10.0)
      expect(result.estimatedFee).toBe(1.0)
      expect(result.netRevenue).toBe(9.0)
    })
  })

  describe('Input Validation', () => {
    describe('Buy Input Validation', () => {
      it('validates valid buy input', () => {
        const error = validateBuyInput(50, 100)
        expect(error).toBeNull()
      })

      it('rejects zero quantity', () => {
        const error = validateBuyInput(0, 100)
        expect(error).toBe('Quantity must be greater than 0')
      })

      it('rejects negative quantity', () => {
        const error = validateBuyInput(-10, 100)
        expect(error).toBe('Quantity must be greater than 0')
      })

      it('rejects quantity exceeding maximum', () => {
        const error = validateBuyInput(150, 100)
        expect(error).toBe('Quantity exceeds available amount')
      })

      it('allows quantity equal to maximum', () => {
        const error = validateBuyInput(100, 100)
        expect(error).toBeNull()
      })
    })

    describe('Sell Input Validation', () => {
      it('validates valid sell input', () => {
        const error = validateSellInput(50, 0.08)
        expect(error).toBeNull()
      })

      it('rejects zero quantity', () => {
        const error = validateSellInput(0, 0.08)
        expect(error).toBe('Quantity must be greater than 0')
      })

      it('rejects negative quantity', () => {
        const error = validateSellInput(-10, 0.08)
        expect(error).toBe('Quantity must be greater than 0')
      })

      it('rejects zero price', () => {
        const error = validateSellInput(50, 0)
        expect(error).toBe('Price must be greater than 0')
      })

      it('rejects negative price', () => {
        const error = validateSellInput(50, -0.05)
        expect(error).toBe('Price must be greater than 0')
      })

      it('allows very small positive values', () => {
        const error = validateSellInput(1, 0.001)
        expect(error).toBeNull()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles very large numbers', () => {
      const buyResult = calculateBuyTotal(999.999, 1000000)
      expect(buyResult.totalCost).toBe(999999000)
      expect(buyResult.estimatedFee).toBe(999999)
      expect(buyResult.totalWithFee).toBe(1000998999)
    })

    it('handles very small numbers', () => {
      const sellResult = calculateSellRevenue(0.001, 0.1)
      expect(sellResult.totalRevenue).toBeCloseTo(0.0001, 10)
      expect(sellResult.estimatedFee).toBeCloseTo(0.0000001, 10)
      expect(sellResult.netRevenue).toBeCloseTo(0.0000999, 10)
    })

    it('handles precision with many decimal places', () => {
      const result = calculateBuyTotal(0.123456789, 7.654321)
      expect(result.totalCost).toBeCloseTo(0.944977892635269, 10)
      expect(result.estimatedFee).toBeCloseTo(0.000944977892635269, 12)
      expect(result.totalWithFee).toBeCloseTo(0.945922870527904, 10)
    })
  })
})