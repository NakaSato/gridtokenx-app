import React, { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'

interface TransactionStatus {
  hash: string
  status: 'pending' | 'confirmed' | 'failed'
  blockHeight?: number
  timestamp: number
  fee?: number
  type: 'buy' | 'sell'
  amount?: number
  energyType?: string
}

interface TransactionStatusIndicatorProps {
  transaction: TransactionStatus
  onDismiss?: () => void
}

export function TransactionStatusIndicator({ 
  transaction, 
  onDismiss 
}: TransactionStatusIndicatorProps) {
  const [progress, setProgress] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    if (transaction.status === 'pending') {
      const startTime = transaction.timestamp
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        setTimeElapsed(elapsed)
        
        // Simulate progress based on time elapsed (max 30 seconds for confirmation)
        const progressPercent = Math.min((elapsed / 30000) * 100, 95)
        setProgress(progressPercent)
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setProgress(100)
    }
  }, [transaction.status, transaction.timestamp])

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusText = () => {
    switch (transaction.status) {
      case 'pending':
        return `Confirming... (${Math.floor(timeElapsed / 1000)}s)`
      case 'confirmed':
        return 'Confirmed'
      case 'failed':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  const formatTransactionType = () => {
    const action = transaction.type === 'buy' ? 'Purchase' : 'Sale'
    const amount = transaction.amount ? ` ${transaction.amount} kWh` : ''
    const energyType = transaction.energyType ? ` ${transaction.energyType}` : ''
    return `${action}${amount}${energyType}`
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium text-sm">
                {formatTransactionType()}
              </div>
              <div className="text-xs text-muted-foreground">
                {transaction.hash.slice(0, 8)}...{transaction.hash.slice(-8)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor()}>
                {getStatusText()}
              </Badge>
              {onDismiss && transaction.status !== 'pending' && (
                <Button variant="ghost" size="sm" onClick={onDismiss}>
                  ×
                </Button>
              )}
            </div>
          </div>

          {transaction.status === 'pending' && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Waiting for blockchain confirmation...
              </div>
            </div>
          )}

          {transaction.status === 'confirmed' && transaction.blockHeight && (
            <div className="text-xs text-muted-foreground">
              Block: {transaction.blockHeight.toLocaleString()}
              {transaction.fee && ` • Fee: ${transaction.fee.toFixed(6)} SOL`}
            </div>
          )}

          {transaction.status === 'failed' && (
            <div className="text-xs text-destructive">
              Transaction failed. Please try again.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface TransactionStatusListProps {
  transactions: TransactionStatus[]
  onDismiss?: (hash: string) => void
}

export function TransactionStatusList({ 
  transactions, 
  onDismiss 
}: TransactionStatusListProps) {
  if (transactions.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Recent Transactions</div>
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <TransactionStatusIndicator
            key={transaction.hash}
            transaction={transaction}
            onDismiss={onDismiss ? () => onDismiss(transaction.hash) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

// Hook for managing transaction status
export function useTransactionStatusManager() {
  const [transactions, setTransactions] = useState<TransactionStatus[]>([])

  const addTransaction = (transaction: Omit<TransactionStatus, 'timestamp'>) => {
    const newTransaction: TransactionStatus = {
      ...transaction,
      timestamp: Date.now()
    }
    setTransactions(prev => [newTransaction, ...prev.slice(0, 4)]) // Keep only 5 most recent
  }

  const updateTransactionStatus = (
    hash: string, 
    status: TransactionStatus['status'],
    blockHeight?: number,
    fee?: number
  ) => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.hash === hash 
          ? { ...tx, status, blockHeight, fee }
          : tx
      )
    )
  }

  const dismissTransaction = (hash: string) => {
    setTransactions(prev => prev.filter(tx => tx.hash !== hash))
  }

  const clearAllTransactions = () => {
    setTransactions([])
  }

  return {
    transactions,
    addTransaction,
    updateTransactionStatus,
    dismissTransaction,
    clearAllTransactions
  }
}