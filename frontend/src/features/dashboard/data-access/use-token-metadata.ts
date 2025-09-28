import { useQuery } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { tradingQueryKeys } from './query-keys'

export interface TokenMetadata {
  name: string
  symbol: string
  decimals: number
  totalSupply?: number
  description?: string
  image?: string
  website?: string
  twitter?: string
  telegram?: string
  coingeckoId?: string
  verified: boolean
  tags: string[]
}

// Mock token metadata for development
const mockTokenMetadata: Record<string, TokenMetadata> = {
  '11111111111111111111111111111112': {
    name: 'Solar Energy Token',
    symbol: 'SOLAR',
    decimals: 9,
    totalSupply: 1000000000,
    description: 'A token representing solar energy production and trading rights',
    image: 'https://example.com/solar-logo.png',
    website: 'https://solarenergy.example.com',
    twitter: 'https://twitter.com/solartoken',
    verified: true,
    tags: ['energy', 'renewable', 'solar']
  },
  '22222222222222222222222222222223': {
    name: 'Wind Energy Token',
    symbol: 'WIND',
    decimals: 9,
    totalSupply: 500000000,
    description: 'A token for wind energy generation and distribution',
    image: 'https://example.com/wind-logo.png',
    website: 'https://windenergy.example.com',
    verified: true,
    tags: ['energy', 'renewable', 'wind']
  },
  '33333333333333333333333333333334': {
    name: 'Battery Storage Token',
    symbol: 'BATTERY',
    decimals: 9,
    totalSupply: 250000000,
    description: 'Token for battery storage capacity and energy storage services',
    image: 'https://example.com/battery-logo.png',
    website: 'https://batterystorage.example.com',
    verified: false,
    tags: ['energy', 'storage', 'battery']
  },
  '44444444444444444444444444444445': {
    name: 'Grid Energy Token',
    symbol: 'GRID',
    decimals: 9,
    totalSupply: 2000000000,
    description: 'Token representing traditional grid energy access and trading',
    image: 'https://example.com/grid-logo.png',
    website: 'https://gridenergy.example.com',
    verified: true,
    tags: ['energy', 'grid', 'traditional']
  }
}

async function fetchTokenMetadata(contractAddress: string): Promise<TokenMetadata | null> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // In production, this would fetch from Solana token registry or metadata program
  const metadata = mockTokenMetadata[contractAddress]
  
  if (!metadata) {
    // Return basic metadata for unknown tokens
    return {
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      decimals: 9,
      verified: false,
      tags: []
    }
  }
  
  return metadata
}

export function useTokenMetadata(contractAddress: string) {
  const { connection } = useSolana()
  
  return useQuery({
    queryKey: tradingQueryKeys.tokenMetadata(contractAddress),
    queryFn: () => fetchTokenMetadata(contractAddress),
    enabled: !!connection && !!contractAddress,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
  })
}

// Hook to fetch metadata for multiple tokens
export function useMultipleTokenMetadata(contractAddresses: string[]) {
  const { connection } = useSolana()
  
  return useQuery({
    queryKey: tradingQueryKeys.multipleTokenMetadata(contractAddresses),
    queryFn: async () => {
      const metadataPromises = contractAddresses.map(address => 
        fetchTokenMetadata(address)
      )
      const results = await Promise.all(metadataPromises)
      
      // Return as a map for easy lookup
      return contractAddresses.reduce((acc, address, index) => {
        if (results[index]) {
          acc[address] = results[index]!
        }
        return acc
      }, {} as Record<string, TokenMetadata>)
    },
    enabled: !!connection && contractAddresses.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  })
}

export function getExplorerUrl(contractAddress: string, network: 'mainnet' | 'devnet' | 'testnet' = 'mainnet'): string {
  const baseUrl = 'https://explorer.solana.com/address'
  const cluster = network === 'mainnet' ? '' : `?cluster=${network}`
  return `${baseUrl}/${contractAddress}${cluster}`
}

export function getSolscanUrl(contractAddress: string, network: 'mainnet' | 'devnet' | 'testnet' = 'mainnet'): string {
  const baseUrl = network === 'mainnet' 
    ? 'https://solscan.io/token' 
    : `https://solscan.io/token?cluster=${network}`
  return `${baseUrl}/${contractAddress}`
}