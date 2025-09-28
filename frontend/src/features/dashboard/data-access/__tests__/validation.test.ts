import { describe, it, expect } from 'vitest'
import {
  validateTradingOpportunity,
  validateTransaction,
  validateTokenBalance,
  validateOrder,
  validateMarketData,
  validateNetworkInfo,
  isValidEnergyType,
  isValidTransactionType,
  isValidPrice,
  isValidQuantity,
  isValidAddress,
  isValidTradingData
} from '../validation'

describe('Validation Utilities', () => {
  describe('isValidEnergyType', () => {
    it('should validate correct energy types', () => {
      expect(isValidEnergyType('solar')).toBe(true)
      expect(isValidEnergyType('wind')).toBe(true)
      expect(isValidEnergyType('battery')).toBe(true)
      expect(isValidEnergyType('grid')).toBe(true)
    })

    it('should reject invalid energy types', () => {
      expect(isValidEnergyType('nuclear')).toBe(false)
      expect(isValidEnergyType('')).toBe(false)
      expect(isValidEnergyType('SOLAR')).toBe(false)
    })
  })

  describe('isValidTransactionType', () => {
    it('should validate correct transaction types', () => {
      expect(isValidTransactionType('buy')).toBe(true)
      expect(isValidTransactionType('sell')).toBe(true)
    })

    it('should reject invalid transaction types', () => {
      expect(isValidTransactionType('trade')).toBe(false)
      expect(isValidTransactionType('')).toBe(false)
      expect(isValidTransactionType('BUY')).toBe(false)
    })
  })

  describe('isValidPrice', () => {
    it('should validate correct prices', () => {
      expect(isValidPrice(0.08)).toBe(true)
      expect(isValidPrice(1)).toBe(true)
      expect(isValidPrice(999.99)).toBe(true)
    })

    it('should reject invalid prices', () => {
      expect(isValidPrice(0)).toBe(false)
      expect(isValidPrice(-1)).toBe(false)
      expect(isValidPrice(1000)).toBe(false)
      expect(isValidPrice(NaN)).toBe(false)
    })
  })

  describe('isValidQuantity', () => {
    it('should validate correct quantities', () => {
      expect(isValidQuantity(1)).toBe(true)
      expect(isValidQuantity(100)).toBe(true)
      expect(isValidQuantity(1000000)).toBe(true)
    })

    it('should reject invalid quantities', () => {
      expect(isValidQuantity(0)).toBe(false)
      expect(isValidQuantity(-1)).toBe(false)
      expect(isValidQuantity(1000001)).toBe(false)
      expect(isValidQuantity(NaN)).toBe(false)
    })
  })

  describe('isValidAddress', () => {
    it('should validate correct Solana addresses', () => {
      expect(isValidAddress('11111111111111111111111111111112')).toBe(true)
      expect(isValidAddress('So11111111111111111111111111111111111111112')).toBe(true)
    })

    it('should reject invalid addresses', () => {
      expect(isValidAddress('')).toBe(false)
      expect(isValidAddress('invalid')).toBe(false)
      expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(false)
    })
  })
})

describe('Trading Opportunity Validation', () => {
  const validOpportunity = {
    id: 'opp-1',
    energyType: 'solar',
    quantity: 100,
    pricePerKwh: 0.08,
    seller: 'Solar Farm A',
    location: 'California',
    availableUntil: Date.now() + 3600000,
    estimatedSavings: 12.5
  }

  it('should validate a correct trading opportunity', () => {
    const errors = validateTradingOpportunity(validOpportunity)
    expect(errors).toHaveLength(0)
  })

  it('should reject opportunity with missing id', () => {
    const invalid = { ...validOpportunity, id: '' }
    const errors = validateTradingOpportunity(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('id')
  })

  it('should reject opportunity with invalid energy type', () => {
    const invalid = { ...validOpportunity, energyType: 'nuclear' }
    const errors = validateTradingOpportunity(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('energyType')
  })

  it('should reject opportunity with invalid quantity', () => {
    const invalid = { ...validOpportunity, quantity: -1 }
    const errors = validateTradingOpportunity(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('quantity')
  })

  it('should reject opportunity with invalid price', () => {
    const invalid = { ...validOpportunity, pricePerKwh: 0 }
    const errors = validateTradingOpportunity(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('pricePerKwh')
  })
})

describe('Transaction Validation', () => {
  const validTransaction = {
    id: 'tx-1',
    type: 'buy',
    energyType: 'solar',
    quantity: 100,
    pricePerKwh: 0.08,
    totalAmount: 8.0,
    timestamp: Date.now() - 3600000,
    status: 'confirmed',
    transactionHash: '5KJp7KqprzMcBsgWMBoUvL2D5sJ8oTdoAN5LgCEW8szqeqKpjUjFn3s4yhANTgSa7w2TBpAqNVE4',
    counterparty: 'Solar Farm A'
  }

  it('should validate a correct transaction', () => {
    const errors = validateTransaction(validTransaction)
    expect(errors).toHaveLength(0)
  })

  it('should reject transaction with invalid type', () => {
    const invalid = { ...validTransaction, type: 'trade' }
    const errors = validateTransaction(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('type')
  })

  it('should reject transaction with invalid status', () => {
    const invalid = { ...validTransaction, status: 'processing' }
    const errors = validateTransaction(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('status')
  })

  it('should reject transaction with negative total amount', () => {
    const invalid = { ...validTransaction, totalAmount: -1 }
    const errors = validateTransaction(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('totalAmount')
  })
})

describe('Token Balance Validation', () => {
  const validBalance = {
    tokenName: 'Solar Token',
    symbol: 'SOL-T',
    balance: 100.5,
    usdValue: 850.25,
    priceChange24h: 5.2,
    contractAddress: '11111111111111111111111111111112',
    decimals: 9
  }

  it('should validate a correct token balance', () => {
    const errors = validateTokenBalance(validBalance)
    expect(errors).toHaveLength(0)
  })

  it('should reject balance with invalid contract address', () => {
    const invalid = { ...validBalance, contractAddress: 'invalid' }
    const errors = validateTokenBalance(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('contractAddress')
  })

  it('should reject balance with negative balance', () => {
    const invalid = { ...validBalance, balance: -1 }
    const errors = validateTokenBalance(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('balance')
  })

  it('should reject balance with invalid decimals', () => {
    const invalid = { ...validBalance, decimals: 20 }
    const errors = validateTokenBalance(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('decimals')
  })
})

describe('Order Validation', () => {
  const validOrder = {
    id: 'order-1',
    type: 'buy',
    energyType: 'solar',
    quantity: 50,
    pricePerKwh: 0.07,
    status: 'open',
    createdAt: Date.now() - 300000,
    expiresAt: Date.now() + 3300000
  }

  it('should validate a correct order', () => {
    const errors = validateOrder(validOrder)
    expect(errors).toHaveLength(0)
  })

  it('should reject order with invalid status', () => {
    const invalid = { ...validOrder, status: 'processing' }
    const errors = validateOrder(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('status')
  })

  it('should reject order with expires at before created at', () => {
    const invalid = { ...validOrder, expiresAt: validOrder.createdAt - 1000 }
    const errors = validateOrder(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('expiresAt')
  })
})

describe('Market Data Validation', () => {
  const validMarketData = {
    energyType: 'solar',
    currentPrice: 0.08,
    priceChange24h: 5.2,
    volume24h: 15420,
    highPrice24h: 0.085,
    lowPrice24h: 0.075
  }

  it('should validate correct market data', () => {
    const errors = validateMarketData(validMarketData)
    expect(errors).toHaveLength(0)
  })

  it('should reject market data with high price lower than low price', () => {
    const invalid = { ...validMarketData, highPrice24h: 0.070, lowPrice24h: 0.080 }
    const errors = validateMarketData(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('priceRange')
  })

  it('should reject market data with negative volume', () => {
    const invalid = { ...validMarketData, volume24h: -1 }
    const errors = validateMarketData(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('volume24h')
  })
})

describe('Network Info Validation', () => {
  const validNetworkInfo = {
    network: 'devnet',
    blockHeight: 245678901,
    gasPrice: 5000,
    transactionThroughput: 2847
  }

  it('should validate correct network info', () => {
    const errors = validateNetworkInfo(validNetworkInfo)
    expect(errors).toHaveLength(0)
  })

  it('should reject network info with invalid network type', () => {
    const invalid = { ...validNetworkInfo, network: 'localnet' }
    const errors = validateNetworkInfo(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('network')
  })

  it('should reject network info with negative block height', () => {
    const invalid = { ...validNetworkInfo, blockHeight: -1 }
    const errors = validateNetworkInfo(invalid)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('blockHeight')
  })
})

describe('isValidTradingData', () => {
  it('should return true for valid data', () => {
    const validOpportunity = {
      id: 'opp-1',
      energyType: 'solar',
      quantity: 100,
      pricePerKwh: 0.08,
      seller: 'Solar Farm A',
      location: 'California',
      availableUntil: Date.now() + 3600000,
      estimatedSavings: 12.5
    }
    
    expect(isValidTradingData(validOpportunity, 'tradingOpportunity')).toBe(true)
  })

  it('should return false for invalid data', () => {
    const invalidOpportunity = {
      id: '',
      energyType: 'nuclear',
      quantity: -1
    }
    
    expect(isValidTradingData(invalidOpportunity, 'tradingOpportunity')).toBe(false)
  })

  it('should return false for unknown type', () => {
    expect(isValidTradingData({}, 'unknown')).toBe(false)
  })
})