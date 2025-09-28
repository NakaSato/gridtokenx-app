import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { tradingQueryKeys } from './query-keys'

interface BuyEnergyParams {
  opportunityId: string
  quantity: number
}

interface SellEnergyParams {
  energyType: string
  quantity: number
  pricePerKwh: number
}

// Mock transaction functions - in production these would interact with Solana program
async function executeBuyTransaction(params: BuyEnergyParams): Promise<string> {
  // Simulate transaction delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Simulate random transaction failure (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('Transaction failed: Insufficient funds or network error')
  }
  
  // Return mock transaction hash
  return `buy_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

async function executeSellTransaction(params: SellEnergyParams): Promise<string> {
  // Simulate transaction delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Simulate random transaction failure (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('Transaction failed: Network congestion or validation error')
  }
  
  // Return mock transaction hash
  return `sell_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function useBuyEnergyMutation() {
  const { account } = useSolana()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: executeBuyTransaction,
    onSuccess: (transactionHash, variables) => {
      // Invalidate trading data to refresh opportunities
      queryClient.invalidateQueries({
        queryKey: tradingQueryKeys.tradingDataByUser(account?.publicKey?.toString() || '')
      })
      
      // Invalidate token balances to reflect new balance
      queryClient.invalidateQueries({
        queryKey: ['tokenBalances', account?.publicKey?.toString()]
      })
      
      // Show success notification (could be handled by the component)
      console.log(`Buy transaction successful: ${transactionHash}`)
    },
    onError: (error, variables) => {
      console.error('Buy transaction failed:', error)
      // Error handling could include showing toast notifications
    },
    retry: 1,
    retryDelay: 1000,
  })
}

export function useSellEnergyMutation() {
  const { account } = useSolana()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: executeSellTransaction,
    onSuccess: (transactionHash, variables) => {
      // Invalidate trading data to refresh opportunities
      queryClient.invalidateQueries({
        queryKey: tradingQueryKeys.tradingDataByUser(account?.publicKey?.toString() || '')
      })
      
      // Invalidate token balances to reflect new balance
      queryClient.invalidateQueries({
        queryKey: ['tokenBalances', account?.publicKey?.toString()]
      })
      
      // Show success notification
      console.log(`Sell transaction successful: ${transactionHash}`)
    },
    onError: (error, variables) => {
      console.error('Sell transaction failed:', error)
    },
    retry: 1,
    retryDelay: 1000,
  })
}

// Hook to get transaction status for a specific transaction
export function useTransactionStatus(transactionHash?: string) {
  const { client } = useSolana()
  
  return useMutation({
    mutationFn: async (txHash: string) => {
      if (!client || !txHash) return null
      
      // Simulate checking transaction status
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock status - in production this would check the actual transaction
      const statuses = ['pending', 'confirmed', 'failed'] as const
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      
      return {
        hash: txHash,
        status: randomStatus,
        blockHeight: Math.floor(Math.random() * 1000000),
        timestamp: Date.now(),
        fee: 0.000005 // SOL
      }
    }
  })
}

// Hook for cancelling pending orders (if supported)
export function useCancelOrderMutation() {
  const { account } = useSolana()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (orderId: string) => {
      // Simulate cancellation delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulate random failure (5% chance)
      if (Math.random() < 0.05) {
        throw new Error('Failed to cancel order: Order may have already been filled')
      }
      
      return `cancel_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    onSuccess: (transactionHash, orderId) => {
      // Invalidate trading data to refresh active orders
      queryClient.invalidateQueries({
        queryKey: tradingQueryKeys.tradingDataByUser(account?.publicKey?.toString() || '')
      })
      
      console.log(`Order cancelled successfully: ${transactionHash}`)
    },
    onError: (error, orderId) => {
      console.error('Order cancellation failed:', error)
    }
  })
}