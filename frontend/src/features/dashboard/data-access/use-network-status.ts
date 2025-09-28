import { useQuery } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { tradingQueryKeys } from './query-keys'
import { NetworkInfo, NetworkHealth, NetworkStatus } from './types'

// Mock network data for development
const mockNetworkStatus: NetworkStatus = {
  info: {
    network: 'devnet',
    blockHeight: 245678901,
    gasPrice: 5000, // lamports
    transactionThroughput: 2847, // TPS
    networkCongestion: 'low',
    lastBlockTime: Date.now() - 400, // 400ms ago
    epochInfo: {
      epoch: 512,
      slotIndex: 123456,
      slotsInEpoch: 432000
    },
    validators: {
      total: 1200,
      active: 1185
    }
  },
  health: {
    uptime: 99.97,
    averageBlockTime: 400, // milliseconds
    transactionSuccessRate: 98.5,
    networkCapacity: 87.3
  },
  connectionStatus: 'connected',
  lastUpdated: Date.now()
}

function determineNetworkCongestion(tps: number): 'low' | 'medium' | 'high' {
  if (tps > 2000) return 'low'
  if (tps > 1000) return 'medium'
  return 'high'
}

async function fetchNetworkStatus(connection: any): Promise<NetworkStatus> {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    if (!connection) {
      return {
        ...mockNetworkStatus,
        connectionStatus: 'disconnected'
      }
    }

    // In production, these would be real Solana RPC calls
    // const slot = await connection.getSlot()
    // const epochInfo = await connection.getEpochInfo()
    // const recentPerformanceSamples = await connection.getRecentPerformanceSamples(1)
    
    // For now, return mock data with some randomization
    const currentTps = Math.floor(Math.random() * 1000) + 2000
    const blockHeight = mockNetworkStatus.info.blockHeight + Math.floor(Math.random() * 10)
    
    return {
      info: {
        ...mockNetworkStatus.info,
        blockHeight,
        transactionThroughput: currentTps,
        networkCongestion: determineNetworkCongestion(currentTps),
        lastBlockTime: Date.now() - Math.floor(Math.random() * 1000)
      },
      health: {
        ...mockNetworkStatus.health,
        networkCapacity: Math.floor(Math.random() * 20) + 80 // 80-100%
      },
      connectionStatus: 'connected',
      lastUpdated: Date.now()
    }
  } catch (error) {
    console.error('Failed to fetch network status:', error)
    return {
      ...mockNetworkStatus,
      connectionStatus: 'disconnected',
      lastUpdated: Date.now()
    }
  }
}

export function useNetworkStatus() {
  const { connection } = useSolana()
  
  return useQuery({
    queryKey: tradingQueryKeys.networkStatus(),
    queryFn: () => fetchNetworkStatus(connection),
    refetchInterval: 10000, // Refetch every 10 seconds for real-time network info
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
  })
}

export function useNetworkStatusQueryKey() {
  return tradingQueryKeys.networkStatus()
}

// Helper hook for network health monitoring
export function useNetworkHealth() {
  const networkStatusQuery = useNetworkStatus()
  
  return {
    ...networkStatusQuery,
    isHealthy: networkStatusQuery.data?.health.uptime && networkStatusQuery.data.health.uptime > 95,
    isCongested: networkStatusQuery.data?.info.networkCongestion === 'high',
    isConnected: networkStatusQuery.data?.connectionStatus === 'connected'
  }
}