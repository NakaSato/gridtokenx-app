import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSolana } from '@/components/solana/use-solana'
import { tradingQueryKeys } from './query-keys'
import { Transaction } from './types'

interface TransactionStatusResponse {
  status: 'pending' | 'confirmed' | 'failed'
  blockHeight?: number
  confirmations?: number
  error?: string
}

async function fetchTransactionStatus(
  transactionHash: string,
  connection: any
): Promise<TransactionStatusResponse> {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // In production, this would use Solana connection to check transaction status
    // const signature = await connection.getSignatureStatus(transactionHash)
    
    // Mock implementation - randomly update status for demo
    const random = Math.random()
    if (random < 0.1) {
      return {
        status: 'failed',
        error: 'Transaction failed due to insufficient funds'
      }
    } else if (random < 0.3) {
      return {
        status: 'confirmed',
        blockHeight: Math.floor(Math.random() * 1000000) + 245000000,
        confirmations: Math.floor(Math.random() * 32) + 1
      }
    } else {
      return {
        status: 'pending',
        confirmations: 0
      }
    }
  } catch (error) {
    console.error('Failed to fetch transaction status:', error)
    return {
      status: 'pending',
      error: 'Failed to check status'
    }
  }
}

export function useTransactionStatusPolling(transactionHash: string, enabled: boolean = true) {
  const { connection } = useSolana()
  
  return useQuery({
    queryKey: tradingQueryKeys.transactionStatus(transactionHash),
    queryFn: () => fetchTransactionStatus(transactionHash, connection),
    enabled: enabled && !!transactionHash && !!connection,
    refetchInterval: (data) => {
      // Stop polling if transaction is confirmed or failed
      if (data?.status === 'confirmed' || data?.status === 'failed') {
        return false
      }
      // Poll every 5 seconds for pending transactions
      return 5000
    },
    staleTime: 0, // Always consider data stale to enable polling
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

export function usePendingTransactionsPolling(transactions: Transaction[]) {
  const queryClient = useQueryClient()
  
  const pendingTransactions = transactions.filter(tx => tx.status === 'pending')
  
  // Set up polling for each pending transaction
  const pollingQueries = pendingTransactions.map(tx => 
    useTransactionStatusPolling(tx.transactionHash, true)
  )

  // Update transaction history when status changes
  useEffect(() => {
    pollingQueries.forEach((query, index) => {
      if (query.data && query.data.status !== 'pending') {
        const transaction = pendingTransactions[index]
        
        // Invalidate transaction history to refetch with updated status
        queryClient.invalidateQueries({
          queryKey: tradingQueryKeys.transactionHistoryByUser(
            '', // Will be filled by the actual query
            1,
            10,
            {}
          ).slice(0, 2) // Match the base query key structure
        })
      }
    })
  }, [pollingQueries, pendingTransactions, queryClient])

  return {
    pendingCount: pendingTransactions.length,
    pollingQueries,
    isPolling: pollingQueries.some(query => query.isFetching)
  }
}

export function useTransactionStatusUpdater() {
  const queryClient = useQueryClient()

  const updateTransactionStatus = (
    transactionHash: string, 
    newStatus: TransactionStatusResponse
  ) => {
    // Update the specific transaction status query
    queryClient.setQueryData(
      tradingQueryKeys.transactionStatus(transactionHash),
      newStatus
    )

    // Invalidate transaction history to reflect the updated status
    queryClient.invalidateQueries({
      queryKey: tradingQueryKeys.transactionHistoryByUser('', 1, 10, {}).slice(0, 2)
    })
  }

  return { updateTransactionStatus }
}