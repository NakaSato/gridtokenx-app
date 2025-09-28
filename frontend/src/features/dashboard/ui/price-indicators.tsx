import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  AlertTriangle,
  Target
} from 'lucide-react'
import { type MarketData, type MarketMetrics } from '../data-access/use-market-data'

interface PriceIndicatorsProps {
  marketData: MarketData
  marketMetrics: MarketMetrics
  className?: string
}

export function PriceIndicators({ marketData, marketMetrics, className }: PriceIndicatorsProps) {
  const volatility = marketMetrics.priceVolatility
  const priceChange = marketData.priceChange24h
  
  // Calculate market sentiment based on price change and volume
  const getMarketSentiment = () => {
    if (priceChange > 5) return { label: 'Bullish', color: 'text-green-600', icon: TrendingUp }
    if (priceChange < -5) return { label: 'Bearish', color: 'text-red-600', icon: TrendingDown }
    return { label: 'Neutral', color: 'text-gray-600', icon: Activity }
  }

  // Calculate volatility level
  const getVolatilityLevel = () => {
    if (volatility > 20) return { label: 'High', color: 'bg-red-500', percentage: 100 }
    if (volatility > 10) return { label: 'Medium', color: 'bg-yellow-500', percentage: 60 }
    return { label: 'Low', color: 'bg-green-500', percentage: 30 }
  }

  // Calculate trading activity level based on volume
  const getTradingActivity = () => {
    const avgVolume = marketMetrics.totalVolume24h / 4 // Assuming 4 energy types
    const activityRatio = marketData.volume24h / avgVolume
    
    if (activityRatio > 1.5) return { label: 'High', color: 'text-green-600', percentage: 85 }
    if (activityRatio > 0.8) return { label: 'Medium', color: 'text-yellow-600', percentage: 60 }
    return { label: 'Low', color: 'text-red-600', percentage: 35 }
  }

  // Calculate price momentum
  const getPriceMomentum = () => {
    const recentPrices = marketData.priceHistory.slice(-5)
    if (recentPrices.length < 2) return 0
    
    const momentum = recentPrices.reduce((acc, curr, index) => {
      if (index === 0) return 0
      return acc + (curr.close - recentPrices[index - 1].close)
    }, 0)
    
    return momentum / (recentPrices.length - 1)
  }

  const sentiment = getMarketSentiment()
  const volatilityLevel = getVolatilityLevel()
  const tradingActivity = getTradingActivity()
  const momentum = getPriceMomentum()
  const SentimentIcon = sentiment.icon

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* Market Sentiment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <SentimentIcon className="h-4 w-4" />
            Market Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant={priceChange >= 0 ? 'default' : 'destructive'} className={sentiment.color}>
                {sentiment.label}
              </Badge>
              <span className="text-sm font-medium">
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on 24h price movement and volume
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Price Volatility */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Volatility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{volatilityLevel.label}</span>
              <span className="text-sm">{volatility.toFixed(1)}%</span>
            </div>
            <Progress 
              value={volatilityLevel.percentage} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              Price volatility indicator
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Trading Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Trading Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${tradingActivity.color}`}>
                {tradingActivity.label}
              </span>
              <span className="text-sm">
                {marketData.volume24h.toLocaleString()} kWh
              </span>
            </div>
            <Progress 
              value={tradingActivity.percentage} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              24h trading volume vs average
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Price Momentum */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Price Momentum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {momentum > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : momentum < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : (
                  <Activity className="h-3 w-3 text-gray-500" />
                )}
                <span className="text-sm font-medium">
                  {momentum > 0 ? 'Positive' : momentum < 0 ? 'Negative' : 'Neutral'}
                </span>
              </div>
              <span className="text-sm">
                {momentum >= 0 ? '+' : ''}${momentum.toFixed(4)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Recent price direction trend
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface MarketMetricsCardProps {
  metrics: MarketMetrics
  className?: string
}

export function MarketMetricsCard({ metrics, className }: MarketMetricsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Market Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Volume (24h)</p>
            <p className="text-lg font-semibold">
              {metrics.totalVolume24h.toLocaleString()} kWh
            </p>
            <p className="text-xs text-muted-foreground">
              Across all energy types
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Trades (24h)</p>
            <p className="text-lg font-semibold">
              {metrics.totalTrades24h.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Number of transactions
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Average Price (24h)</p>
            <p className="text-lg font-semibold">
              ${metrics.averagePrice24h.toFixed(3)}
            </p>
            <p className="text-xs text-muted-foreground">
              Weighted by volume
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Market Cap</p>
            <p className="text-lg font-semibold">
              ${(metrics.marketCap / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-muted-foreground">
              Total market value
            </p>
          </div>
        </div>

        {/* Market Health Indicators */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Market Health</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">High Liquidity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Moderate Volatility</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Active Trading</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Utility functions for market calculations
export function calculateMarketTrend(priceHistory: Array<{ close: number; timestamp: number }>) {
  if (priceHistory.length < 2) return 'neutral'
  
  const recent = priceHistory.slice(-5)
  const older = priceHistory.slice(-10, -5)
  
  const recentAvg = recent.reduce((sum, item) => sum + item.close, 0) / recent.length
  const olderAvg = older.reduce((sum, item) => sum + item.close, 0) / older.length
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100
  
  if (change > 2) return 'bullish'
  if (change < -2) return 'bearish'
  return 'neutral'
}

export function calculateSupportResistance(priceHistory: Array<{ high: number; low: number }>) {
  if (priceHistory.length < 10) return { support: 0, resistance: 0 }
  
  const highs = priceHistory.map(p => p.high).sort((a, b) => b - a)
  const lows = priceHistory.map(p => p.low).sort((a, b) => a - b)
  
  // Simple support/resistance calculation
  const resistance = highs.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3
  const support = lows.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3
  
  return { support, resistance }
}

export function calculateRSI(priceHistory: Array<{ close: number }>, period: number = 14) {
  if (priceHistory.length < period + 1) return 50 // Neutral RSI
  
  const prices = priceHistory.map(p => p.close)
  let gains = 0
  let losses = 0
  
  for (let i = 1; i <= period; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1]
    if (change > 0) gains += change
    else losses += Math.abs(change)
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  
  if (avgLoss === 0) return 100
  
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}