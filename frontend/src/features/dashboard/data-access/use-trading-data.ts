import { useQuery } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { tradingQueryKeys } from './query-keys'
import { TradingOpportunity, Order, TradingData } from './types'

// Mock data for development - in production this would fetch from Solana program
const mockTradingData: TradingData = {
  opportunities: [
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
    }
  ],
  activeOrders: [
    {
      id: 'order-1',
      type: 'buy',
      energyType: 'solar',
      quantity: 50,
      pricePerKwh: 0.07,
      status: 'open',
      createdAt: Date.now() - 300000, // 5 minutes ago
      expiresAt: Date.now() + 3300000 // 55 minutes from now
    }
  ],
  recentTransactions: [],
  marketPrices: {
    solar: 0.08,
    wind: 0.06,
    battery: 0.12,
    grid: 0.10
  }
}

async function fetchTradingData(): Promise<TradingData> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // In production, this would interact with Solana program
  // For now, return mock data
  return mockTradingData
}

export function useTradingData() {
  const { client, account } = useSolana()
  
  return useQuery({
    queryKey: tradingQueryKeys.tradingDataByUser(account?.publicKey?.toString() || ''),
    queryFn: fetchTradingData,
    enabled: !!client && !!account,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })
}

export function useTradingDataQueryKey() {
  const { account } = useSolana()
  return tradingQueryKeys.tradingDataByUser(account?.publicKey?.toString() || '')
}