import { useQuery } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { tradingQueryKeys } from './query-keys'
import { TokenBalance, PortfolioData } from './types'

// Mock token balance data for development
const mockTokenBalances: TokenBalance[] = [
  {
    tokenName: 'Solar Energy Token',
    symbol: 'SOLAR',
    balance: 150.75,
    usdValue: 1205.50,
    priceChange24h: 5.2,
    contractAddress: '11111111111111111111111111111112',
    decimals: 9,
    logoUri: 'https://example.com/solar-logo.png'
  },
  {
    tokenName: 'Wind Energy Token',
    symbol: 'WIND',
    balance: 89.25,
    usdValue: 534.75,
    priceChange24h: -2.1,
    contractAddress: '22222222222222222222222222222223',
    decimals: 9,
    logoUri: 'https://example.com/wind-logo.png'
  },
  {
    tokenName: 'Battery Storage Token',
    symbol: 'BATTERY',
    balance: 45.0,
    usdValue: 540.00,
    priceChange24h: 8.7,
    contractAddress: '33333333333333333333333333333334',
    decimals: 9,
    logoUri: 'https://example.com/battery-logo.png'
  },
  {
    tokenName: 'Grid Energy Token',
    symbol: 'GRID',
    balance: 200.0,
    usdValue: 2000.00,
    priceChange24h: 1.5,
    contractAddress: '44444444444444444444444444444445',
    decimals: 9,
    logoUri: 'https://example.com/grid-logo.png'
  }
]

function calculatePortfolioMetrics(balances: TokenBalance[]): {
  totalValue: number
  totalChange24h: number
} {
  const totalValue = balances.reduce((sum, balance) => sum + balance.usdValue, 0)
  const totalChange24h = balances.reduce((sum, balance) => {
    const changeValue = (balance.usdValue * balance.priceChange24h) / 100
    return sum + changeValue
  }, 0)
  
  return {
    totalValue,
    totalChange24h: totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0
  }
}

async function fetchTokenBalances(publicKey: string): Promise<PortfolioData> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 600))
  
  // In production, this would fetch from Solana blockchain
  // For now, return mock data with some randomization
  const balances = mockTokenBalances.map(balance => ({
    ...balance,
    balance: balance.balance + (Math.random() - 0.5) * 10, // Add some variation
    priceChange24h: balance.priceChange24h + (Math.random() - 0.5) * 2
  }))
  
  // Recalculate USD values based on new balances
  const updatedBalances = balances.map(balance => ({
    ...balance,
    usdValue: balance.balance * (balance.usdValue / mockTokenBalances.find(b => b.symbol === balance.symbol)!.balance)
  }))
  
  const { totalValue, totalChange24h } = calculatePortfolioMetrics(updatedBalances)
  
  return {
    balances: updatedBalances,
    totalValue,
    totalChange24h,
    lastUpdated: Date.now()
  }
}

export function useTokenBalances() {
  const { connection, account } = useSolana()
  
  return useQuery({
    queryKey: tradingQueryKeys.tokenBalancesByUser(account?.publicKey?.toString() || ''),
    queryFn: () => fetchTokenBalances(account?.publicKey?.toString() || ''),
    enabled: !!connection && !!account,
    refetchInterval: 60000, // Refetch every minute for balance updates
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })
}

export function useTokenBalancesQueryKey() {
  const { account } = useSolana()
  return tradingQueryKeys.tokenBalancesByUser(account?.publicKey?.toString() || '')
}

// Helper hook to get individual token balance
export function useTokenBalance(tokenSymbol: string) {
  const balancesQuery = useTokenBalances()
  
  const tokenBalance = balancesQuery.data?.balances.find(
    balance => balance.symbol === tokenSymbol
  )
  
  return {
    ...balancesQuery,
    data: tokenBalance
  }
}

// Helper hook to get portfolio summary
export function usePortfolioSummary() {
  const balancesQuery = useTokenBalances()
  
  if (!balancesQuery.data) {
    return {
      ...balancesQuery,
      data: undefined
    }
  }
  
  const { totalValue, totalChange24h } = balancesQuery.data
  const balanceCount = balancesQuery.data.balances.length
  const nonZeroBalances = balancesQuery.data.balances.filter(b => b.balance > 0).length
  
  return {
    ...balancesQuery,
    data: {
      totalValue,
      totalChange24h,
      balanceCount,
      nonZeroBalances,
      lastUpdated: balancesQuery.data.lastUpdated
    }
  }
}