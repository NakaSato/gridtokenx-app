import { useQuery } from '@tanstack/react-query'
import { tradingQueryKeys } from './query-keys'

export interface PriceData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
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

export interface MarketMetrics {
  totalVolume24h: number
  totalTrades24h: number
  averagePrice24h: number
  priceVolatility: number
  marketCap: number
}

export interface MarketOverview {
  markets: MarketData[]
  metrics: MarketMetrics
  lastUpdated: number
}

// Mock market data for development
const mockMarketData: MarketOverview = {
  markets: [
    {
      energyType: 'solar',
      currentPrice: 0.08,
      priceChange24h: 5.2,
      volume24h: 15420,
      highPrice24h: 0.085,
      lowPrice24h: 0.075,
      priceHistory: generateMockPriceHistory(0.08, 24)
    },
    {
      energyType: 'wind',
      currentPrice: 0.06,
      priceChange24h: -2.1,
      volume24h: 22150,
      highPrice24h: 0.065,
      lowPrice24h: 0.058,
      priceHistory: generateMockPriceHistory(0.06, 24)
    },
    {
      energyType: 'battery',
      currentPrice: 0.12,
      priceChange24h: 8.7,
      volume24h: 8930,
      highPrice24h: 0.125,
      lowPrice24h: 0.110,
      priceHistory: generateMockPriceHistory(0.12, 24)
    },
    {
      energyType: 'grid',
      currentPrice: 0.10,
      priceChange24h: 1.5,
      volume24h: 35600,
      highPrice24h: 0.102,
      lowPrice24h: 0.098,
      priceHistory: generateMockPriceHistory(0.10, 24)
    }
  ],
  metrics: {
    totalVolume24h: 82100,
    totalTrades24h: 1247,
    averagePrice24h: 0.085,
    priceVolatility: 12.3,
    marketCap: 2450000
  },
  lastUpdated: Date.now()
}

function generateMockPriceHistory(basePrice: number, hours: number): PriceData[] {
  const history: PriceData[] = []
  const now = Date.now()
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = now - (i * 60 * 60 * 1000) // Hours ago
    const volatility = 0.05 // 5% volatility
    const randomChange = (Math.random() - 0.5) * volatility
    const price = basePrice * (1 + randomChange)
    
    history.push({
      timestamp,
      open: price * 0.99,
      high: price * 1.02,
      low: price * 0.98,
      close: price,
      volume: Math.floor(Math.random() * 1000) + 100
    })
  }
  
  return history
}

async function fetchMarketData(timeframe: string = '24h'): Promise<MarketOverview> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // In production, this would fetch from price APIs or Solana program
  return {
    ...mockMarketData,
    lastUpdated: Date.now()
  }
}

export function useMarketData(timeframe: string = '24h') {
  return useQuery({
    queryKey: tradingQueryKeys.marketDataByTimeframe(timeframe),
    queryFn: () => fetchMarketData(timeframe),
    refetchInterval: 60000, // Refetch every minute for price updates
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })
}

export function useMarketDataQueryKey(timeframe: string = '24h') {
  return tradingQueryKeys.marketDataByTimeframe(timeframe)
}