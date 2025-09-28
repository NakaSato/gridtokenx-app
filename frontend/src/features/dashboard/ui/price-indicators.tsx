import React, { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface PriceChangeIndicatorProps {
  currentPrice: number
  previousPrice?: number
  showPercentage?: boolean
  className?: string
}

export function PriceChangeIndicator({ 
  currentPrice, 
  previousPrice, 
  showPercentage = true,
  className = '' 
}: PriceChangeIndicatorProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (previousPrice && previousPrice !== currentPrice) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [currentPrice, previousPrice])

  if (!previousPrice) {
    return (
      <span className={`font-medium ${className}`}>
        ${currentPrice.toFixed(3)}
      </span>
    )
  }

  const change = currentPrice - previousPrice
  const percentChange = (change / previousPrice) * 100
  const isPositive = change > 0
  const isNegative = change < 0

  const getChangeColor = () => {
    if (isPositive) return 'text-green-600 dark:text-green-400'
    if (isNegative) return 'text-red-600 dark:text-red-400'
    return 'text-muted-foreground'
  }

  const getChangeIcon = () => {
    if (isPositive) return '↗'
    if (isNegative) return '↘'
    return '→'
  }

  const getBadgeVariant = () => {
    if (isPositive) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (isNegative) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span 
        className={`font-medium transition-all duration-300 ${
          isAnimating ? 'scale-110 font-bold' : ''
        }`}
      >
        ${currentPrice.toFixed(3)}
      </span>
      
      {change !== 0 && (
        <Badge className={`${getBadgeVariant()} text-xs`}>
          <span className="mr-1">{getChangeIcon()}</span>
          {showPercentage ? (
            `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`
          ) : (
            `${change > 0 ? '+' : ''}${change.toFixed(3)}`
          )}
        </Badge>
      )}
    </div>
  )
}

interface MarketTrendIndicatorProps {
  trend: 'bullish' | 'bearish' | 'neutral'
  strength?: 'weak' | 'moderate' | 'strong'
  className?: string
}

export function MarketTrendIndicator({ 
  trend, 
  strength = 'moderate',
  className = '' 
}: MarketTrendIndicatorProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'bullish':
        return 'text-green-600 dark:text-green-400'
      case 'bearish':
        return 'text-red-600 dark:text-red-400'
      case 'neutral':
        return 'text-muted-foreground'
      default:
        return 'text-muted-foreground'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'bullish':
        return '📈'
      case 'bearish':
        return '📉'
      case 'neutral':
        return '➡️'
      default:
        return '➡️'
    }
  }

  const getTrendText = () => {
    const strengthText = strength === 'weak' ? 'Weak' : 
                       strength === 'strong' ? 'Strong' : ''
    const trendText = trend.charAt(0).toUpperCase() + trend.slice(1)
    return `${strengthText} ${trendText}`.trim()
  }

  const getBadgeVariant = () => {
    const baseClass = 'text-xs'
    switch (trend) {
      case 'bullish':
        return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`
      case 'bearish':
        return `${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
      case 'neutral':
        return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`
      default:
        return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`
    }
  }

  return (
    <Badge className={`${getBadgeVariant()} ${className}`}>
      <span className="mr-1">{getTrendIcon()}</span>
      {getTrendText()}
    </Badge>
  )
}

interface LivePriceDisplayProps {
  energyType: string
  currentPrice: number
  previousPrice?: number
  volume24h?: number
  trend?: 'bullish' | 'bearish' | 'neutral'
  lastUpdated?: number
  className?: string
}

export function LivePriceDisplay({
  energyType,
  currentPrice,
  previousPrice,
  volume24h,
  trend = 'neutral',
  lastUpdated,
  className = ''
}: LivePriceDisplayProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0)

  useEffect(() => {
    if (!lastUpdated) return

    const interval = setInterval(() => {
      setTimeSinceUpdate(Date.now() - lastUpdated)
    }, 1000)

    return () => clearInterval(interval)
  }, [lastUpdated])

  const formatTimeSince = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm capitalize">
          {energyType} Energy
        </div>
        {trend && (
          <MarketTrendIndicator trend={trend} />
        )}
      </div>

      <PriceChangeIndicator
        currentPrice={currentPrice}
        previousPrice={previousPrice}
        className="text-lg"
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {volume24h && (
          <span>Vol: {volume24h.toLocaleString()} kWh</span>
        )}
        {lastUpdated && (
          <span>{formatTimeSince(timeSinceUpdate)}</span>
        )}
      </div>
    </div>
  )
}

// Hook for managing price history and calculating trends
export function usePriceTracking(initialPrice: number) {
  const [priceHistory, setPriceHistory] = useState<number[]>([initialPrice])
  const [currentPrice, setCurrentPrice] = useState(initialPrice)

  const updatePrice = (newPrice: number) => {
    setCurrentPrice(newPrice)
    setPriceHistory(prev => [...prev.slice(-19), newPrice]) // Keep last 20 prices
  }

  const getPreviousPrice = () => {
    return priceHistory.length > 1 ? priceHistory[priceHistory.length - 2] : undefined
  }

  const getTrend = (): 'bullish' | 'bearish' | 'neutral' => {
    if (priceHistory.length < 3) return 'neutral'
    
    const recent = priceHistory.slice(-5) // Last 5 prices
    const increasing = recent.filter((price, i) => i > 0 && price > recent[i - 1]).length
    const decreasing = recent.filter((price, i) => i > 0 && price < recent[i - 1]).length
    
    if (increasing > decreasing + 1) return 'bullish'
    if (decreasing > increasing + 1) return 'bearish'
    return 'neutral'
  }

  const getVolatility = () => {
    if (priceHistory.length < 2) return 0
    
    const changes = priceHistory.slice(1).map((price, i) => 
      Math.abs(price - priceHistory[i]) / priceHistory[i]
    )
    
    return changes.reduce((sum, change) => sum + change, 0) / changes.length
  }

  return {
    currentPrice,
    previousPrice: getPreviousPrice(),
    priceHistory,
    trend: getTrend(),
    volatility: getVolatility(),
    updatePrice
  }
}