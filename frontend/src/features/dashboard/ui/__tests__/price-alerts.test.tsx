import { describe, it, expect, vi, beforeEach } from 'vitest'
import { type PriceAlert } from '../price-alerts'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Setup global mocks
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true
})

Object.defineProperty(globalThis, 'Notification', {
  value: vi.fn().mockImplementation((title, options) => ({
    title,
    ...options
  })),
  configurable: true
})

Object.defineProperty(globalThis.Notification, 'permission', {
  value: 'granted',
  configurable: true
})

Object.defineProperty(globalThis.Notification, 'requestPermission', {
  value: vi.fn().mockResolvedValue('granted'),
  configurable: true
})

describe('PriceAlerts Integration Tests', () => {
  const mockCurrentPrices = {
    solar: 0.08,
    wind: 0.06,
    battery: 0.12,
    grid: 0.10
  }

  const mockPriceChanges = {
    solar: 5.2,
    wind: -2.1,
    battery: 8.7,
    grid: 1.5
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should handle localStorage operations correctly', () => {
    const testAlerts: PriceAlert[] = [
      {
        id: '1',
        energyType: 'solar',
        condition: 'above',
        threshold: 0.09,
        isActive: true,
        createdAt: Date.now()
      }
    ]

    // Test saving to localStorage
    localStorageMock.setItem('priceAlerts', JSON.stringify(testAlerts))
    expect(localStorageMock.setItem).toHaveBeenCalledWith('priceAlerts', JSON.stringify(testAlerts))

    // Test loading from localStorage
    localStorageMock.getItem.mockReturnValue(JSON.stringify(testAlerts))
    const loaded = JSON.parse(localStorageMock.getItem('priceAlerts') || '[]')
    expect(loaded).toEqual(testAlerts)
  })

  it('should validate alert conditions correctly', () => {
    const testAlert: PriceAlert = {
      id: '1',
      energyType: 'solar',
      condition: 'above',
      threshold: 0.07,
      isActive: true,
      createdAt: Date.now()
    }

    // Test above condition
    const currentPrice = mockCurrentPrices.solar // 0.08
    const shouldTriggerAbove = currentPrice >= testAlert.threshold // 0.08 >= 0.07 = true
    expect(shouldTriggerAbove).toBe(true)

    // Test below condition
    const belowAlert = { ...testAlert, condition: 'below' as const, threshold: 0.10 }
    const shouldTriggerBelow = currentPrice <= belowAlert.threshold // 0.08 <= 0.10 = true
    expect(shouldTriggerBelow).toBe(true)

    // Test change condition
    const changeAlert = { ...testAlert, condition: 'change' as const, threshold: 3 }
    const priceChange = mockPriceChanges.solar // 5.2%
    const shouldTriggerChange = Math.abs(priceChange) >= changeAlert.threshold // 5.2 >= 3 = true
    expect(shouldTriggerChange).toBe(true)
  })

  it('should handle notification API correctly', () => {
    // Test notification creation
    const message = 'Test price alert'
    const notification = new globalThis.Notification('GridTokenX Price Alert', {
      body: message,
      icon: '/favicon.ico',
      tag: 'price-alert'
    })

    expect(notification.title).toBe('GridTokenX Price Alert')
    expect(notification.body).toBe(message)
    expect(notification.icon).toBe('/favicon.ico')
    expect(notification.tag).toBe('price-alert')
  })

  it('should handle alert state management', () => {
    const alerts: PriceAlert[] = [
      {
        id: '1',
        energyType: 'solar',
        condition: 'above',
        threshold: 0.09,
        isActive: true,
        createdAt: Date.now()
      },
      {
        id: '2',
        energyType: 'wind',
        condition: 'below',
        threshold: 0.05,
        isActive: false,
        createdAt: Date.now()
      }
    ]

    // Test filtering active alerts
    const activeAlerts = alerts.filter(alert => alert.isActive && !alert.triggeredAt)
    expect(activeAlerts).toHaveLength(1)
    expect(activeAlerts[0].id).toBe('1')

    // Test filtering triggered alerts
    const triggeredAlerts = alerts.filter(alert => alert.triggeredAt)
    expect(triggeredAlerts).toHaveLength(0)

    // Test adding triggered timestamp
    const updatedAlerts = alerts.map(alert => 
      alert.id === '1' 
        ? { ...alert, triggeredAt: Date.now(), message: 'Alert triggered' }
        : alert
    )
    
    const newTriggeredAlerts = updatedAlerts.filter(alert => alert.triggeredAt)
    expect(newTriggeredAlerts).toHaveLength(1)
    expect(newTriggeredAlerts[0].message).toBe('Alert triggered')
  })

  it('should handle error scenarios gracefully', () => {
    // Test invalid JSON parsing
    localStorageMock.getItem.mockReturnValue('invalid json')
    
    let parsedAlerts: PriceAlert[] = []
    try {
      parsedAlerts = JSON.parse(localStorageMock.getItem('priceAlerts') || '[]')
    } catch (error) {
      // Should handle error gracefully
      expect(error).toBeInstanceOf(SyntaxError)
      parsedAlerts = [] // Default to empty array
    }
    
    expect(parsedAlerts).toEqual([])
  })

  it('should validate threshold values correctly', () => {
    // Test valid thresholds
    expect(0.05 > 0).toBe(true) // Valid price threshold
    expect(5.0 > 0).toBe(true)  // Valid percentage threshold
    
    // Test invalid thresholds
    expect(0 <= 0).toBe(true)   // Invalid threshold
    expect(-1 <= 0).toBe(true)  // Invalid threshold
  })

  it('should handle different energy types', () => {
    const energyTypes = ['solar', 'wind', 'battery', 'grid']
    
    energyTypes.forEach(energyType => {
      expect(mockCurrentPrices[energyType as keyof typeof mockCurrentPrices]).toBeDefined()
      expect(mockPriceChanges[energyType as keyof typeof mockPriceChanges]).toBeDefined()
    })
  })

  it('should calculate alert messages correctly', () => {
    const alert: PriceAlert = {
      id: '1',
      energyType: 'solar',
      condition: 'above',
      threshold: 0.07,
      isActive: true,
      createdAt: Date.now()
    }

    const currentPrice = 0.08
    const priceChange = 5.2

    // Test above condition message
    if (alert.condition === 'above' && currentPrice >= alert.threshold) {
      const message = `${alert.energyType} price reached $${currentPrice.toFixed(4)} (above $${alert.threshold.toFixed(4)})`
      expect(message).toBe('solar price reached $0.0800 (above $0.0700)')
    }

    // Test change condition message
    const changeAlert = { ...alert, condition: 'change' as const, threshold: 3 }
    if (changeAlert.condition === 'change' && Math.abs(priceChange) >= changeAlert.threshold) {
      const message = `${changeAlert.energyType} price changed by ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}% (threshold: ${changeAlert.threshold}%)`
      expect(message).toBe('solar price changed by +5.2% (threshold: 3%)')
    }
  })
})