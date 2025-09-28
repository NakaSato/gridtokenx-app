import { describe, it, expect } from 'vitest'
import { TradingOpportunity, TradingFilters, EnergyType } from '../../data-access/types'

// Test utility functions for filtering and sorting logic
function filterOpportunities(
  opportunities: TradingOpportunity[], 
  filters: TradingFilters, 
  searchLocation: string = ''
): TradingOpportunity[] {
  return opportunities.filter(opportunity => {
    // Energy type filter
    if (filters.energyType && filters.energyType.length > 0) {
      if (!filters.energyType.includes(opportunity.energyType)) return false
    }
    
    // Price range filter
    if (filters.priceRange) {
      const [minPrice, maxPrice] = filters.priceRange
      if (opportunity.pricePerKwh < minPrice || opportunity.pricePerKwh > maxPrice) return false
    }
    
    // Quantity filter
    if (filters.minQuantity && opportunity.quantity < filters.minQuantity) return false
    if (filters.maxQuantity && opportunity.quantity > filters.maxQuantity) return false
    
    // Location search
    if (searchLocation && !opportunity.location.toLowerCase().includes(searchLocation.toLowerCase())) {
      return false
    }
    
    return true
  })
}

function sortOpportunities(
  opportunities: TradingOpportunity[], 
  sortField: 'price' | 'quantity' | 'availableUntil' | 'estimatedSavings', 
  sortDirection: 'asc' | 'desc'
): TradingOpportunity[] {
  return [...opportunities].sort((a, b) => {
    let aValue: number
    let bValue: number
    
    switch (sortField) {
      case 'price':
        aValue = a.pricePerKwh
        bValue = b.pricePerKwh
        break
      case 'quantity':
        aValue = a.quantity
        bValue = b.quantity
        break
      case 'availableUntil':
        aValue = a.availableUntil
        bValue = b.availableUntil
        break
      case 'estimatedSavings':
        aValue = a.estimatedSavings
        bValue = b.estimatedSavings
        break
      default:
        return 0
    }
    
    const result = aValue - bValue
    return sortDirection === 'asc' ? result : -result
  })
}

function formatTimeRemaining(timestamp: number): string {
  const now = Date.now()
  const remaining = timestamp - now
  
  if (remaining <= 0) return 'Expired'
  
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Mock data for testing
const mockOpportunities: TradingOpportunity[] = [
  {
    id: '1',
    energyType: 'solar',
    quantity: 100,
    pricePerKwh: 0.08,
    seller: 'Solar Farm A',
    location: 'California',
    availableUntil: Date.now() + 3600000, // 1 hour from now
    estimatedSavings: 12.5
  },
  {
    id: '2',
    energyType: 'wind',
    quantity: 250,
    pricePerKwh: 0.06,
    seller: 'Wind Farm B',
    location: 'Texas',
    availableUntil: Date.now() + 7200000, // 2 hours from now
    estimatedSavings: 35.0
  },
  {
    id: '3',
    energyType: 'battery',
    quantity: 50,
    pricePerKwh: 0.12,
    seller: 'Battery Storage C',
    location: 'Nevada',
    availableUntil: Date.now() + 1800000, // 30 minutes from now
    estimatedSavings: 8.0
  },
  {
    id: '4',
    energyType: 'solar',
    quantity: 75,
    pricePerKwh: 0.07,
    seller: 'Solar Farm D',
    location: 'Arizona',
    availableUntil: Date.now() + 5400000, // 1.5 hours from now
    estimatedSavings: 15.0
  }
]

describe('TradingSection Logic Tests', () => {
  describe('Filtering', () => {
    it('filters by energy type', () => {
      const filters: TradingFilters = {
        energyType: ['solar']
      }
      
      const filtered = filterOpportunities(mockOpportunities, filters)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(op => op.energyType === 'solar')).toBe(true)
      expect(filtered.map(op => op.seller)).toEqual(['Solar Farm A', 'Solar Farm D'])
    })

    it('filters by multiple energy types', () => {
      const filters: TradingFilters = {
        energyType: ['solar', 'wind']
      }
      
      const filtered = filterOpportunities(mockOpportunities, filters)
      
      expect(filtered).toHaveLength(3)
      expect(filtered.every(op => ['solar', 'wind'].includes(op.energyType))).toBe(true)
    })

    it('filters by location search', () => {
      const filters: TradingFilters = {}
      const searchLocation = 'California'
      
      const filtered = filterOpportunities(mockOpportunities, filters, searchLocation)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].location).toBe('California')
      expect(filtered[0].seller).toBe('Solar Farm A')
    })

    it('filters by location search case insensitive', () => {
      const filters: TradingFilters = {}
      const searchLocation = 'texas'
      
      const filtered = filterOpportunities(mockOpportunities, filters, searchLocation)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].location).toBe('Texas')
      expect(filtered[0].seller).toBe('Wind Farm B')
    })

    it('filters by price range', () => {
      const filters: TradingFilters = {
        priceRange: [0.07, 0.08]
      }
      
      const filtered = filterOpportunities(mockOpportunities, filters)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(op => op.pricePerKwh >= 0.07 && op.pricePerKwh <= 0.08)).toBe(true)
      expect(filtered.map(op => op.seller)).toEqual(['Solar Farm A', 'Solar Farm D'])
    })

    it('filters by minimum quantity', () => {
      const filters: TradingFilters = {
        minQuantity: 100
      }
      
      const filtered = filterOpportunities(mockOpportunities, filters)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(op => op.quantity >= 100)).toBe(true)
      expect(filtered.map(op => op.seller)).toEqual(['Solar Farm A', 'Wind Farm B'])
    })

    it('filters by maximum quantity', () => {
      const filters: TradingFilters = {
        maxQuantity: 100
      }
      
      const filtered = filterOpportunities(mockOpportunities, filters)
      
      expect(filtered).toHaveLength(3)
      expect(filtered.every(op => op.quantity <= 100)).toBe(true)
      expect(filtered.map(op => op.seller)).toEqual(['Solar Farm A', 'Battery Storage C', 'Solar Farm D'])
    })

    it('combines multiple filters', () => {
      const filters: TradingFilters = {
        energyType: ['solar'],
        priceRange: [0.07, 0.08],
        minQuantity: 100
      }
      
      const filtered = filterOpportunities(mockOpportunities, filters)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].seller).toBe('Solar Farm A')
      expect(filtered[0].energyType).toBe('solar')
      expect(filtered[0].pricePerKwh).toBe(0.08)
      expect(filtered[0].quantity).toBe(100)
    })

    it('returns empty array when no matches', () => {
      const filters: TradingFilters = {
        energyType: ['grid'] // No grid opportunities in mock data
      }
      
      const filtered = filterOpportunities(mockOpportunities, filters)
      
      expect(filtered).toHaveLength(0)
    })
  })

  describe('Sorting', () => {
    it('sorts by price ascending', () => {
      const sorted = sortOpportunities(mockOpportunities, 'price', 'asc')
      
      const prices = sorted.map(op => op.pricePerKwh)
      expect(prices).toEqual([0.06, 0.07, 0.08, 0.12])
      expect(sorted.map(op => op.seller)).toEqual([
        'Wind Farm B', 'Solar Farm D', 'Solar Farm A', 'Battery Storage C'
      ])
    })

    it('sorts by price descending', () => {
      const sorted = sortOpportunities(mockOpportunities, 'price', 'desc')
      
      const prices = sorted.map(op => op.pricePerKwh)
      expect(prices).toEqual([0.12, 0.08, 0.07, 0.06])
      expect(sorted.map(op => op.seller)).toEqual([
        'Battery Storage C', 'Solar Farm A', 'Solar Farm D', 'Wind Farm B'
      ])
    })

    it('sorts by quantity ascending', () => {
      const sorted = sortOpportunities(mockOpportunities, 'quantity', 'asc')
      
      const quantities = sorted.map(op => op.quantity)
      expect(quantities).toEqual([50, 75, 100, 250])
      expect(sorted.map(op => op.seller)).toEqual([
        'Battery Storage C', 'Solar Farm D', 'Solar Farm A', 'Wind Farm B'
      ])
    })

    it('sorts by quantity descending', () => {
      const sorted = sortOpportunities(mockOpportunities, 'quantity', 'desc')
      
      const quantities = sorted.map(op => op.quantity)
      expect(quantities).toEqual([250, 100, 75, 50])
      expect(sorted.map(op => op.seller)).toEqual([
        'Wind Farm B', 'Solar Farm A', 'Solar Farm D', 'Battery Storage C'
      ])
    })

    it('sorts by estimated savings ascending', () => {
      const sorted = sortOpportunities(mockOpportunities, 'estimatedSavings', 'asc')
      
      const savings = sorted.map(op => op.estimatedSavings)
      expect(savings).toEqual([8.0, 12.5, 15.0, 35.0])
      expect(sorted.map(op => op.seller)).toEqual([
        'Battery Storage C', 'Solar Farm A', 'Solar Farm D', 'Wind Farm B'
      ])
    })

    it('sorts by estimated savings descending', () => {
      const sorted = sortOpportunities(mockOpportunities, 'estimatedSavings', 'desc')
      
      const savings = sorted.map(op => op.estimatedSavings)
      expect(savings).toEqual([35.0, 15.0, 12.5, 8.0])
      expect(sorted.map(op => op.seller)).toEqual([
        'Wind Farm B', 'Solar Farm D', 'Solar Farm A', 'Battery Storage C'
      ])
    })

    it('does not mutate original array', () => {
      const original = [...mockOpportunities]
      const sorted = sortOpportunities(mockOpportunities, 'price', 'desc')
      
      expect(mockOpportunities).toEqual(original)
      expect(sorted).not.toBe(mockOpportunities)
    })
  })

  describe('Time formatting', () => {
    it('formats hours and minutes correctly', () => {
      const futureTime = Date.now() + (2 * 60 * 60 * 1000) + (30 * 60 * 1000) // 2h 30m from now
      expect(formatTimeRemaining(futureTime)).toBe('2h 30m')
    })

    it('formats only minutes when less than an hour', () => {
      const futureTime = Date.now() + (45 * 60 * 1000) // 45m from now
      expect(formatTimeRemaining(futureTime)).toBe('45m')
    })

    it('returns "Expired" for past timestamps', () => {
      const pastTime = Date.now() - 1000 // 1 second ago
      expect(formatTimeRemaining(pastTime)).toBe('Expired')
    })

    it('handles zero minutes correctly', () => {
      const futureTime = Date.now() + (1 * 60 * 60 * 1000) // exactly 1h from now
      expect(formatTimeRemaining(futureTime)).toBe('1h 0m')
    })
  })
})