import {
  TradingOpportunity,
  Transaction,
  TokenBalance,
  MarketData,
  NetworkInfo,
  Order,
  EnergyType,
  TransactionType,
  TransactionStatus,
  OrderStatus,
  NetworkType,
  ValidationError
} from './types'

// Validation utility functions
export function isValidEnergyType(value: string): value is EnergyType {
  return ['solar', 'wind', 'battery', 'grid'].includes(value)
}

export function isValidTransactionType(value: string): value is TransactionType {
  return ['buy', 'sell'].includes(value)
}

export function isValidTransactionStatus(value: string): value is TransactionStatus {
  return ['pending', 'confirmed', 'failed'].includes(value)
}

export function isValidOrderStatus(value: string): value is OrderStatus {
  return ['open', 'partial', 'filled', 'cancelled'].includes(value)
}

export function isValidNetworkType(value: string): value is NetworkType {
  return ['mainnet', 'devnet', 'testnet'].includes(value)
}

export function isValidPrice(price: number): boolean {
  return typeof price === 'number' && price > 0 && price < 1000 && !isNaN(price)
}

export function isValidQuantity(quantity: number): boolean {
  return typeof quantity === 'number' && quantity > 0 && quantity <= 1000000 && !isNaN(quantity)
}

export function isValidTimestamp(timestamp: number): boolean {
  return typeof timestamp === 'number' && timestamp > 0 && timestamp <= Date.now() + 86400000 // Allow up to 1 day in future
}

export function isValidAddress(address: string): boolean {
  // Basic Solana address validation (base58, 32-44 characters)
  return typeof address === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

// Trading Opportunity Validation
export function validateTradingOpportunity(opportunity: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!opportunity.id || typeof opportunity.id !== 'string') {
    errors.push({ field: 'id', message: 'ID is required and must be a string' })
  }

  if (!isValidEnergyType(opportunity.energyType)) {
    errors.push({ 
      field: 'energyType', 
      message: 'Energy type must be one of: solar, wind, battery, grid',
      value: opportunity.energyType 
    })
  }

  if (!isValidQuantity(opportunity.quantity)) {
    errors.push({ 
      field: 'quantity', 
      message: 'Quantity must be a positive number less than 1,000,000',
      value: opportunity.quantity 
    })
  }

  if (!isValidPrice(opportunity.pricePerKwh)) {
    errors.push({ 
      field: 'pricePerKwh', 
      message: 'Price per kWh must be a positive number less than 1000',
      value: opportunity.pricePerKwh 
    })
  }

  if (!opportunity.seller || typeof opportunity.seller !== 'string') {
    errors.push({ field: 'seller', message: 'Seller is required and must be a string' })
  }

  if (!opportunity.location || typeof opportunity.location !== 'string') {
    errors.push({ field: 'location', message: 'Location is required and must be a string' })
  }

  if (!isValidTimestamp(opportunity.availableUntil)) {
    errors.push({ 
      field: 'availableUntil', 
      message: 'Available until must be a valid future timestamp',
      value: opportunity.availableUntil 
    })
  }

  if (typeof opportunity.estimatedSavings !== 'number' || opportunity.estimatedSavings < 0) {
    errors.push({ 
      field: 'estimatedSavings', 
      message: 'Estimated savings must be a non-negative number',
      value: opportunity.estimatedSavings 
    })
  }

  return errors
}

// Transaction Validation
export function validateTransaction(transaction: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!transaction.id || typeof transaction.id !== 'string') {
    errors.push({ field: 'id', message: 'ID is required and must be a string' })
  }

  if (!isValidTransactionType(transaction.type)) {
    errors.push({ 
      field: 'type', 
      message: 'Transaction type must be either buy or sell',
      value: transaction.type 
    })
  }

  if (!transaction.energyType || typeof transaction.energyType !== 'string') {
    errors.push({ field: 'energyType', message: 'Energy type is required and must be a string' })
  }

  if (!isValidQuantity(transaction.quantity)) {
    errors.push({ 
      field: 'quantity', 
      message: 'Quantity must be a positive number',
      value: transaction.quantity 
    })
  }

  if (!isValidPrice(transaction.pricePerKwh)) {
    errors.push({ 
      field: 'pricePerKwh', 
      message: 'Price per kWh must be a positive number',
      value: transaction.pricePerKwh 
    })
  }

  if (typeof transaction.totalAmount !== 'number' || transaction.totalAmount <= 0) {
    errors.push({ 
      field: 'totalAmount', 
      message: 'Total amount must be a positive number',
      value: transaction.totalAmount 
    })
  }

  if (!isValidTimestamp(transaction.timestamp)) {
    errors.push({ 
      field: 'timestamp', 
      message: 'Timestamp must be a valid timestamp',
      value: transaction.timestamp 
    })
  }

  if (!isValidTransactionStatus(transaction.status)) {
    errors.push({ 
      field: 'status', 
      message: 'Status must be one of: pending, confirmed, failed',
      value: transaction.status 
    })
  }

  if (!transaction.transactionHash || typeof transaction.transactionHash !== 'string') {
    errors.push({ field: 'transactionHash', message: 'Transaction hash is required and must be a string' })
  }

  if (!transaction.counterparty || typeof transaction.counterparty !== 'string') {
    errors.push({ field: 'counterparty', message: 'Counterparty is required and must be a string' })
  }

  return errors
}

// Token Balance Validation
export function validateTokenBalance(balance: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!balance.tokenName || typeof balance.tokenName !== 'string') {
    errors.push({ field: 'tokenName', message: 'Token name is required and must be a string' })
  }

  if (!balance.symbol || typeof balance.symbol !== 'string') {
    errors.push({ field: 'symbol', message: 'Symbol is required and must be a string' })
  }

  if (typeof balance.balance !== 'number' || balance.balance < 0) {
    errors.push({ 
      field: 'balance', 
      message: 'Balance must be a non-negative number',
      value: balance.balance 
    })
  }

  if (typeof balance.usdValue !== 'number' || balance.usdValue < 0) {
    errors.push({ 
      field: 'usdValue', 
      message: 'USD value must be a non-negative number',
      value: balance.usdValue 
    })
  }

  if (typeof balance.priceChange24h !== 'number') {
    errors.push({ 
      field: 'priceChange24h', 
      message: 'Price change 24h must be a number',
      value: balance.priceChange24h 
    })
  }

  if (!isValidAddress(balance.contractAddress)) {
    errors.push({ 
      field: 'contractAddress', 
      message: 'Contract address must be a valid Solana address',
      value: balance.contractAddress 
    })
  }

  if (typeof balance.decimals !== 'number' || balance.decimals < 0 || balance.decimals > 18) {
    errors.push({ 
      field: 'decimals', 
      message: 'Decimals must be a number between 0 and 18',
      value: balance.decimals 
    })
  }

  return errors
}

// Order Validation
export function validateOrder(order: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!order.id || typeof order.id !== 'string') {
    errors.push({ field: 'id', message: 'ID is required and must be a string' })
  }

  if (!isValidTransactionType(order.type)) {
    errors.push({ 
      field: 'type', 
      message: 'Order type must be either buy or sell',
      value: order.type 
    })
  }

  if (!order.energyType || typeof order.energyType !== 'string') {
    errors.push({ field: 'energyType', message: 'Energy type is required and must be a string' })
  }

  if (!isValidQuantity(order.quantity)) {
    errors.push({ 
      field: 'quantity', 
      message: 'Quantity must be a positive number',
      value: order.quantity 
    })
  }

  if (!isValidPrice(order.pricePerKwh)) {
    errors.push({ 
      field: 'pricePerKwh', 
      message: 'Price per kWh must be a positive number',
      value: order.pricePerKwh 
    })
  }

  if (!isValidOrderStatus(order.status)) {
    errors.push({ 
      field: 'status', 
      message: 'Status must be one of: open, partial, filled, cancelled',
      value: order.status 
    })
  }

  if (!isValidTimestamp(order.createdAt)) {
    errors.push({ 
      field: 'createdAt', 
      message: 'Created at must be a valid timestamp',
      value: order.createdAt 
    })
  }

  if (!isValidTimestamp(order.expiresAt) || order.expiresAt <= order.createdAt) {
    errors.push({ 
      field: 'expiresAt', 
      message: 'Expires at must be a valid future timestamp after creation',
      value: order.expiresAt 
    })
  }

  return errors
}

// Market Data Validation
export function validateMarketData(marketData: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!marketData.energyType || typeof marketData.energyType !== 'string') {
    errors.push({ field: 'energyType', message: 'Energy type is required and must be a string' })
  }

  if (!isValidPrice(marketData.currentPrice)) {
    errors.push({ 
      field: 'currentPrice', 
      message: 'Current price must be a positive number',
      value: marketData.currentPrice 
    })
  }

  if (typeof marketData.priceChange24h !== 'number') {
    errors.push({ 
      field: 'priceChange24h', 
      message: 'Price change 24h must be a number',
      value: marketData.priceChange24h 
    })
  }

  if (typeof marketData.volume24h !== 'number' || marketData.volume24h < 0) {
    errors.push({ 
      field: 'volume24h', 
      message: 'Volume 24h must be a non-negative number',
      value: marketData.volume24h 
    })
  }

  if (!isValidPrice(marketData.highPrice24h)) {
    errors.push({ 
      field: 'highPrice24h', 
      message: 'High price 24h must be a positive number',
      value: marketData.highPrice24h 
    })
  }

  if (!isValidPrice(marketData.lowPrice24h)) {
    errors.push({ 
      field: 'lowPrice24h', 
      message: 'Low price 24h must be a positive number',
      value: marketData.lowPrice24h 
    })
  }

  if (marketData.highPrice24h < marketData.lowPrice24h) {
    errors.push({ 
      field: 'priceRange', 
      message: 'High price must be greater than or equal to low price' 
    })
  }

  return errors
}

// Network Info Validation
export function validateNetworkInfo(networkInfo: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!isValidNetworkType(networkInfo.network)) {
    errors.push({ 
      field: 'network', 
      message: 'Network must be one of: mainnet, devnet, testnet',
      value: networkInfo.network 
    })
  }

  if (typeof networkInfo.blockHeight !== 'number' || networkInfo.blockHeight < 0) {
    errors.push({ 
      field: 'blockHeight', 
      message: 'Block height must be a non-negative number',
      value: networkInfo.blockHeight 
    })
  }

  if (typeof networkInfo.gasPrice !== 'number' || networkInfo.gasPrice < 0) {
    errors.push({ 
      field: 'gasPrice', 
      message: 'Gas price must be a non-negative number',
      value: networkInfo.gasPrice 
    })
  }

  if (typeof networkInfo.transactionThroughput !== 'number' || networkInfo.transactionThroughput < 0) {
    errors.push({ 
      field: 'transactionThroughput', 
      message: 'Transaction throughput must be a non-negative number',
      value: networkInfo.transactionThroughput 
    })
  }

  return errors
}

// Utility function to validate any trading data object
export function validateTradingData(data: any, type: string): ValidationError[] {
  switch (type) {
    case 'tradingOpportunity':
      return validateTradingOpportunity(data)
    case 'transaction':
      return validateTransaction(data)
    case 'tokenBalance':
      return validateTokenBalance(data)
    case 'order':
      return validateOrder(data)
    case 'marketData':
      return validateMarketData(data)
    case 'networkInfo':
      return validateNetworkInfo(data)
    default:
      return [{ field: 'type', message: `Unknown validation type: ${type}` }]
  }
}

// Helper function to check if data is valid
export function isValidTradingData(data: any, type: string): boolean {
  return validateTradingData(data, type).length === 0
}