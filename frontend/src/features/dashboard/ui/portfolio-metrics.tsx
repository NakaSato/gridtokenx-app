import { useMemo } from 'react'
import { TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TokenBalance } from '../data-access/types'
import { cn } from '@/lib/utils'

interface PortfolioMetricsProps {
  balances: TokenBalance[]
  totalValue: number
  totalChange24h: number
  className?: string
}

interface AllocationData {
  symbol: string
  name: string
  value: number
  percentage: number
  color: string
}

interface PerformanceMetric {
  symbol: string
  name: string
  value: number
  change24h: number
  allocation: number
}

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
]

function calculateAllocation(balances: TokenBalance[], totalValue: number): AllocationData[] {
  return balances
    .map((balance, index) => ({
      symbol: balance.symbol,
      name: balance.tokenName,
      value: balance.usdValue,
      percentage: totalValue > 0 ? (balance.usdValue / totalValue) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))
    .sort((a, b) => b.value - a.value)
}

function calculatePerformanceMetrics(balances: TokenBalance[], totalValue: number): PerformanceMetric[] {
  return balances
    .map(balance => ({
      symbol: balance.symbol,
      name: balance.tokenName,
      value: balance.usdValue,
      change24h: balance.priceChange24h,
      allocation: totalValue > 0 ? (balance.usdValue / totalValue) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value)
}

function SimpleDonutChart({ data, size = 120 }: { data: AllocationData[], size?: number }) {
  const radius = size / 2
  const innerRadius = radius * 0.6
  const strokeWidth = radius - innerRadius

  let cumulativePercentage = 0
  const segments = data.map(item => {
    const startAngle = cumulativePercentage * 3.6 // Convert percentage to degrees
    const endAngle = (cumulativePercentage + item.percentage) * 3.6
    cumulativePercentage += item.percentage

    // Calculate path for donut segment
    const startAngleRad = (startAngle - 90) * (Math.PI / 180)
    const endAngleRad = (endAngle - 90) * (Math.PI / 180)

    const x1 = radius + radius * Math.cos(startAngleRad)
    const y1 = radius + radius * Math.sin(startAngleRad)
    const x2 = radius + radius * Math.cos(endAngleRad)
    const y2 = radius + radius * Math.sin(endAngleRad)

    const largeArcFlag = item.percentage > 50 ? 1 : 0

    const pathData = [
      `M ${radius} ${radius}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')

    return {
      ...item,
      pathData,
      startAngle,
      endAngle
    }
  })

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={radius}
          cy={radius}
          r={innerRadius + strokeWidth / 2}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {segments.map((segment, index) => (
          <circle
            key={segment.symbol}
            cx={radius}
            cy={radius}
            r={innerRadius + strokeWidth / 2}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment.percentage * 2.51} 251.2`} // 2π * 40 (radius) ≈ 251.2
            strokeDashoffset={-cumulativePercentage * 2.51 + segment.percentage * 2.51}
            className="transition-all duration-300"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <PieChart className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
          <p className="text-xs text-muted-foreground">Portfolio</p>
        </div>
      </div>
    </div>
  )
}

function AllocationBreakdown({ data }: { data: AllocationData[] }) {
  return (
    <div className="space-y-3">
      {data.map(item => (
        <div key={item.symbol} className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.symbol}</p>
              <p className="text-xs text-muted-foreground truncate">{item.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              ${item.value.toLocaleString(undefined, { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.percentage.toFixed(1)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function PerformanceTable({ metrics }: { metrics: PerformanceMetric[] }) {
  return (
    <div className="space-y-2">
      {metrics.map(metric => {
        const isPositive = metric.change24h >= 0
        const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
        const TrendIcon = isPositive ? TrendingUp : TrendingDown

        return (
          <div key={metric.symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{metric.symbol}</span>
                <span className="text-sm font-medium">
                  ${metric.value.toLocaleString(undefined, { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0 
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Progress value={metric.allocation} className="w-16 h-1" />
                  <span className="text-xs text-muted-foreground">
                    {metric.allocation.toFixed(1)}%
                  </span>
                </div>
                <div className={cn("flex items-center space-x-1", changeColor)}>
                  <TrendIcon className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    {metric.change24h > 0 ? '+' : ''}{metric.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function PortfolioMetrics({ balances, totalValue, totalChange24h, className }: PortfolioMetricsProps) {
  const allocationData = useMemo(() => calculateAllocation(balances, totalValue), [balances, totalValue])
  const performanceMetrics = useMemo(() => calculatePerformanceMetrics(balances, totalValue), [balances, totalValue])

  const topPerformer = useMemo(() => {
    return balances.reduce((best, current) => 
      current.priceChange24h > best.priceChange24h ? current : best
    , balances[0])
  }, [balances])

  const worstPerformer = useMemo(() => {
    return balances.reduce((worst, current) => 
      current.priceChange24h < worst.priceChange24h ? current : worst
    , balances[0])
  }, [balances])

  const diversificationScore = useMemo(() => {
    // Calculate diversification based on how evenly distributed the portfolio is
    const idealPercentage = 100 / balances.length
    const variance = allocationData.reduce((sum, item) => {
      return sum + Math.pow(item.percentage - idealPercentage, 2)
    }, 0) / balances.length
    
    // Convert to a score from 0-100 (lower variance = higher score)
    return Math.max(0, 100 - (variance / 10))
  }, [allocationData, balances.length])

  if (balances.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tokens to display metrics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Portfolio Allocation Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            <span>Portfolio Allocation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
            <div className="flex justify-center mb-4 lg:mb-0">
              <SimpleDonutChart data={allocationData} />
            </div>
            <div className="flex-1">
              <AllocationBreakdown data={allocationData} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Performance Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceTable metrics={performanceMetrics} />
        </CardContent>
      </Card>

      {/* Portfolio Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Portfolio Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Top Performer (24h)</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{topPerformer?.symbol}</span>
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-sm font-medium">
                      +{topPerformer?.priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Worst Performer (24h)</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{worstPerformer?.symbol}</span>
                  <div className="flex items-center space-x-1 text-red-600">
                    <TrendingDown className="h-3 w-3" />
                    <span className="text-sm font-medium">
                      {worstPerformer?.priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Diversification Score</p>
                <div className="flex items-center space-x-2">
                  <Progress value={diversificationScore} className="flex-1" />
                  <span className="text-sm font-medium">
                    {diversificationScore.toFixed(0)}/100
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="font-medium">{balances.length} tokens</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}