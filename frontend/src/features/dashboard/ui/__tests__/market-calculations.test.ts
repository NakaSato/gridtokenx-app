import { describe, it, expect } from 'vitest'
import { 
  calculateMarketTrend, 
  calculateSupportResistance, 
  calculateRSI 
} from '../price-indicators'

describe('Market Calculation Functions', () => {
  describe('calculateMarketTrend', () => {
    it('should return neutral for insufficient data', () => {
      const priceHistory = [{ close: 100, timestamp: Date.now() }]
      expect(calculateMarketTrend(priceHistory)).toBe('neutral')
    })

    it('should return bullish for upward trend', () => {
      const priceHistory = Array.from({ length: 10 }, (_, i) => ({
        close: 100 + i * 2, // Increasing prices
        timestamp: Date.now() - (10 - i) * 60000
      }))
      expect(calculateMarketTrend(priceHistory)).toBe('bullish')
    })

    it('should return bearish for downward trend', () => {
      const priceHistory = Array.from({ length: 10 }, (_, i) => ({
        close: 120 - i * 2, // Decreasing prices
        timestamp: Date.now() - (10 - i) * 60000
      }))
      expect(calculateMarketTrend(priceHistory)).toBe('bearish')
    })

    it('should return neutral for sideways movement', () => {
      const priceHistory = Array.from({ length: 10 }, (_, i) => ({
        close: 100 + (Math.random() - 0.5) * 0.5, // Small random variations
        timestamp: Date.now() - (10 - i) * 60000
      }))
      expect(calculateMarketTrend(priceHistory)).toBe('neutral')
    })
  })

  describe('calculateSupportResistance', () => {
    it('should return zero values for insufficient data', () => {
      const priceHistory = [{ high: 105, low: 95 }]
      const result = calculateSupportResistance(priceHistory)
      expect(result.support).toBe(0)
      expect(result.resistance).toBe(0)
    })

    it('should calculate support and resistance levels', () => {
      const priceHistory = Array.from({ length: 15 }, (_, i) => ({
        high: 100 + Math.random() * 10,
        low: 90 + Math.random() * 5
      }))
      
      const result = calculateSupportResistance(priceHistory)
      expect(result.support).toBeGreaterThan(90)
      expect(result.support).toBeLessThan(100)
      expect(result.resistance).toBeGreaterThan(100)
      expect(result.resistance).toBeLessThan(115)
      expect(result.resistance).toBeGreaterThan(result.support)
    })

    it('should handle edge case with identical prices', () => {
      const priceHistory = Array.from({ length: 15 }, () => ({
        high: 100,
        low: 100
      }))
      
      const result = calculateSupportResistance(priceHistory)
      expect(result.support).toBe(100)
      expect(result.resistance).toBe(100)
    })
  })

  describe('calculateRSI', () => {
    it('should return neutral RSI for insufficient data', () => {
      const priceHistory = [{ close: 100 }]
      expect(calculateRSI(priceHistory)).toBe(50)
    })

    it('should calculate RSI for trending up prices', () => {
      const priceHistory = Array.from({ length: 20 }, (_, i) => ({
        close: 100 + i * 2 // Consistently increasing
      }))
      
      const rsi = calculateRSI(priceHistory)
      expect(rsi).toBeGreaterThan(70) // Should be overbought
      expect(rsi).toBeLessThanOrEqual(100)
    })

    it('should calculate RSI for trending down prices', () => {
      const priceHistory = Array.from({ length: 20 }, (_, i) => ({
        close: 140 - i * 2 // Consistently decreasing
      }))
      
      const rsi = calculateRSI(priceHistory)
      expect(rsi).toBeLessThan(30) // Should be oversold
      expect(rsi).toBeGreaterThanOrEqual(0)
    })

    it('should handle all gains scenario', () => {
      const priceHistory = Array.from({ length: 20 }, (_, i) => ({
        close: 100 + i * 5 // Large consistent gains
      }))
      
      const rsi = calculateRSI(priceHistory)
      expect(rsi).toBe(100)
    })

    it('should calculate RSI with custom period', () => {
      const priceHistory = Array.from({ length: 30 }, (_, i) => ({
        close: 100 + Math.sin(i * 0.1) * 10 // Oscillating prices
      }))
      
      const rsi7 = calculateRSI(priceHistory, 7)
      const rsi21 = calculateRSI(priceHistory, 21)
      
      expect(rsi7).toBeGreaterThanOrEqual(0)
      expect(rsi7).toBeLessThanOrEqual(100)
      expect(rsi21).toBeGreaterThanOrEqual(0)
      expect(rsi21).toBeLessThanOrEqual(100)
    })

    it('should handle sideways market', () => {
      const priceHistory = Array.from({ length: 20 }, () => ({
        close: 100 + (Math.random() - 0.5) * 2 // Small random variations around 100
      }))
      
      const rsi = calculateRSI(priceHistory)
      expect(rsi).toBeGreaterThan(30)
      expect(rsi).toBeLessThan(70) // Should be in neutral range
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty arrays gracefully', () => {
      expect(calculateMarketTrend([])).toBe('neutral')
      expect(calculateSupportResistance([])).toEqual({ support: 0, resistance: 0 })
      expect(calculateRSI([])).toBe(50)
    })

    it('should handle negative prices', () => {
      const priceHistory = Array.from({ length: 15 }, (_, i) => ({
        close: -10 + i,
        high: -5 + i,
        low: -15 + i,
        timestamp: Date.now() - (15 - i) * 60000
      }))
      
      expect(() => calculateMarketTrend(priceHistory)).not.toThrow()
      expect(() => calculateSupportResistance(priceHistory)).not.toThrow()
      expect(() => calculateRSI(priceHistory)).not.toThrow()
    })

    it('should handle very large numbers', () => {
      const priceHistory = Array.from({ length: 15 }, (_, i) => ({
        close: 1000000 + i * 50000, // Larger increment to ensure bullish trend
        high: 1005000 + i * 50000,
        low: 995000 + i * 50000,
        timestamp: Date.now() - (15 - i) * 60000
      }))
      
      const trend = calculateMarketTrend(priceHistory)
      const sr = calculateSupportResistance(priceHistory)
      const rsi = calculateRSI(priceHistory)
      
      expect(trend).toBe('bullish')
      expect(sr.resistance).toBeGreaterThan(sr.support)
      expect(rsi).toBeGreaterThanOrEqual(0)
      expect(rsi).toBeLessThanOrEqual(100)
    })
  })
})