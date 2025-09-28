// Centralized query key factory for trading dashboard
export const tradingQueryKeys = {
  // Base keys
  all: ['trading'] as const,
  
  // Trading data keys
  tradingData: () => [...tradingQueryKeys.all, 'data'] as const,
  tradingDataByUser: (publicKey: string) => [...tradingQueryKeys.tradingData(), publicKey] as const,
  
  // Market data keys
  marketData: () => [...tradingQueryKeys.all, 'market'] as const,
  marketDataByTimeframe: (timeframe: string) => [...tradingQueryKeys.marketData(), timeframe] as const,
  
  // Transaction history keys
  transactionHistory: () => [...tradingQueryKeys.all, 'transactions'] as const,
  transactionHistoryByUser: (publicKey: string, page: number, pageSize: number, filters: any) => 
    [...tradingQueryKeys.transactionHistory(), publicKey, page, pageSize, filters] as const,
  
  // Transaction status keys
  transactionStatus: (transactionHash: string) => 
    [...tradingQueryKeys.all, 'transaction-status', transactionHash] as const,
  
  // Network status keys
  networkStatus: () => [...tradingQueryKeys.all, 'network'] as const,
  
  // Token balance keys
  tokenBalances: () => [...tradingQueryKeys.all, 'balances'] as const,
  tokenBalancesByUser: (publicKey: string) => [...tradingQueryKeys.tokenBalances(), publicKey] as const,
  
  // Token metadata keys
  tokenMetadata: (contractAddress: string) => 
    [...tradingQueryKeys.all, 'token-metadata', contractAddress] as const,
  multipleTokenMetadata: (contractAddresses: string[]) => 
    [...tradingQueryKeys.all, 'token-metadata', 'multiple', contractAddresses.sort()] as const,
  
  // Order keys
  orders: () => [...tradingQueryKeys.all, 'orders'] as const,
  ordersByUser: (publicKey: string) => [...tradingQueryKeys.orders(), publicKey] as const,
  
  // Price data keys
  priceData: () => [...tradingQueryKeys.all, 'prices'] as const,
  priceDataByToken: (tokenSymbol: string) => [...tradingQueryKeys.priceData(), tokenSymbol] as const,
}

// Query key utilities
export function invalidateTradingQueries(queryClient: any, publicKey?: string) {
  if (publicKey) {
    // Invalidate user-specific queries
    queryClient.invalidateQueries({ queryKey: tradingQueryKeys.tradingDataByUser(publicKey) })
    queryClient.invalidateQueries({ queryKey: tradingQueryKeys.tokenBalancesByUser(publicKey) })
    queryClient.invalidateQueries({ queryKey: tradingQueryKeys.ordersByUser(publicKey) })
  } else {
    // Invalidate all trading queries
    queryClient.invalidateQueries({ queryKey: tradingQueryKeys.all })
  }
}

export function invalidateMarketQueries(queryClient: any) {
  queryClient.invalidateQueries({ queryKey: tradingQueryKeys.marketData() })
  queryClient.invalidateQueries({ queryKey: tradingQueryKeys.priceData() })
}

export function invalidateTransactionQueries(queryClient: any, publicKey?: string) {
  if (publicKey) {
    queryClient.invalidateQueries({ 
      queryKey: tradingQueryKeys.transactionHistory(),
      predicate: (query) => query.queryKey.includes(publicKey)
    })
  } else {
    queryClient.invalidateQueries({ queryKey: tradingQueryKeys.transactionHistory() })
  }
}