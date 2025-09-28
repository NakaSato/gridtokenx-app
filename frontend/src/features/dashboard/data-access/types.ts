// Core Trading Types
export interface TradingOpportunity {
  id: string
  energyType: 'solar' | 'wind' | 'battery' | 'grid'
  quantity: number
  pricePerKwh: number
  seller: string
  location: string
  availableUntil: number
  estimatedSavings: number
}

export interface Transaction {
  id: string
  type: 'buy' | 'sell'
  energyType: string
  quantity: number
  pricePerKwh: number
  totalAmount: number
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  transactionHash: string
  counterparty: string
  blockHeight?: number
  gasUsed?: number
}

export interface TokenBalance {
  tokenName: string
  symbol: string
  balance: number
  usdValue: number
  priceChange24h: number
  contractAddress: string
  decimals: number
  logoUri?: string
}

export interface MarketData {
  energyType: string
  currentPrice: number
  priceChange24h: number
  volume24h: number
  highPrice24h: number
  lowPrice24h: number
  priceHistory: PriceData[]
}

export interface NetworkInfo {
  network: 'mainnet' | 'devnet' | 'testnet'
  blockHeight: number
  gasPrice: number
  transactionThroughput: number
  networkCongestion: 'low' | 'medium' | 'high'
  lastBlockTime: number
  epochInfo: {
    epoch: number
    slotIndex: number
    slotsInEpoch: number
  }
  validators: {
    total: number
    active: number
  }
}

export interface Order {
  id: string
  type: 'buy' | 'sell'
  energyType: string
  quantity: number
  pricePerKwh: number
  status: 'open' | 'partial' | 'filled' | 'cancelled'
  createdAt: number
  expiresAt: number
  filledQuantity?: number
  remainingQuantity?: number
}

// Supporting Types
export interface PriceData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketMetrics {
  totalVolume24h: number
  totalTrades24h: number
  averagePrice24h: number
  priceVolatility: number
  marketCap: number
}

export interface NetworkHealth {
  uptime: number
  averageBlockTime: number
  transactionSuccessRate: number
  networkCapacity: number
}

// Filter Types
export interface TransactionFilters {
  dateRange?: [Date, Date]
  type?: 'all' | 'buy' | 'sell'
  energyType?: string[]
  status?: 'all' | 'pending' | 'confirmed' | 'failed'
}

export interface TradingFilters {
  energyType?: string[]
  priceRange?: [number, number]
  location?: string[]
  minQuantity?: number
  maxQuantity?: number
}

// Composite Types
export interface TradingState {
  opportunities: TradingOpportunity[]
  activeOrders: Order[]
  recentTransactions: Transaction[]
  marketPrices: Record<string, number>
  userBalances: TokenBalance[]
}

export interface TradingData {
  opportunities: TradingOpportunity[]
  activeOrders: Order[]
  recentTransactions: Transaction[]
  marketPrices: Record<string, number>
}

export interface MarketOverview {
  markets: MarketData[]
  metrics: MarketMetrics
  lastUpdated: number
}

export interface NetworkStatus {
  info: NetworkInfo
  health: NetworkHealth
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
  lastUpdated: number
}

export interface TransactionHistoryData {
  transactions: Transaction[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export interface PortfolioData {
  balances: TokenBalance[]
  totalValue: number
  totalChange24h: number
  lastUpdated: number
}

// Energy Types
export type EnergyType = 'solar' | 'wind' | 'battery' | 'grid'
export type TransactionType = 'buy' | 'sell'
export type TransactionStatus = 'pending' | 'confirmed' | 'failed'
export type OrderStatus = 'open' | 'partial' | 'filled' | 'cancelled'
export type NetworkType = 'mainnet' | 'devnet' | 'testnet'
export type CongestionLevel = 'low' | 'medium' | 'high'
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

// API Response Types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: number
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  totalPages: number
  currentPage: number
  pageSize: number
}

// Error Types
export interface TradingError {
  code: string
  message: string
  details?: any
  timestamp: number
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}