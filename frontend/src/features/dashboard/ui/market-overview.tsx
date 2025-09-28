import { useState } from 'react'
import {
  LineChart,
  Line,
  CandlestickChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMarketData, type MarketData, type PriceData } from '../data-access/use-market-data'
import { PriceIndicators, MarketMetricsCard } from './price-indicators'
import { PriceAlerts } from './price-alerts'
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react'

type TimeFrame = '1h' | '24h' | '7d' | '30d'
type ChartType = 'line' | 'candlestick'

interface MarketOverviewProps {
  className?: string
}

export function MarketOverview({ className }: MarketOverviewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('24h')
  const [selectedEnergyType, setSelectedEnergyType] = useState<string>('solar')
  const [chartType, setChartType] = useState<ChartType>('line')

  const { data: marketData, isLoading, error } = useMarketData(selectedTimeframe)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">
            Failed to load market data. Please try again.
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedMarket = marketData?.markets.find(m => m.energyType === selectedEnergyType)
  const chartData = selectedMarket?.priceHistory.map(item => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    date: new Date(item.timestamp).toLocaleDateString()
  })) || []

  // Prepare data for price alerts
  const currentPrices = marketData?.markets.reduce((acc, market) => ({
    ...acc,
    [market.energyType]: market.currentPrice
  }), {}) || {}

  const priceChanges = marketData?.markets.reduce((acc, market) => ({
    ...acc,
    [market.energyType]: market.priceChange24h
  }), {}) || {}

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Market Metrics Overview */}
      {marketData && (
        <MarketMetricsCard metrics={marketData.metrics} />
      )}

      {/* Price Indicators */}
      {selectedMarket && marketData && (
        <PriceIndicators 
          marketData={selectedMarket} 
          marketMetrics={marketData.metrics} 
        />
      )}

      {/* Price Alerts */}
      <PriceAlerts 
        currentPrices={currentPrices}
        priceChanges={priceChanges}
      />

      {/* Main Chart Component */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Price Charts
            </CardTitle>
            
            {/* Timeframe Selection */}
            <div className="flex gap-2">
              {(['1h', '24h', '7d', '30d'] as TimeFrame[]).map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe)}
                >
                  {timeframe}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

      <CardContent className="space-y-6">
        {/* Market Selection Tabs */}
        <Tabs value={selectedEnergyType} onValueChange={setSelectedEnergyType}>
          <TabsList className="grid w-full grid-cols-4">
            {marketData?.markets.map((market) => (
              <TabsTrigger key={market.energyType} value={market.energyType} className="capitalize">
                {market.energyType}
              </TabsTrigger>
            ))}
          </TabsList>

          {marketData?.markets.map((market) => (
            <TabsContent key={market.energyType} value={market.energyType} className="space-y-4">
              {/* Market Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-lg font-semibold">${market.currentPrice.toFixed(3)}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">24h Change</p>
                  <div className="flex items-center gap-1">
                    {market.priceChange24h >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={market.priceChange24h >= 0 ? 'default' : 'destructive'}>
                      {market.priceChange24h >= 0 ? '+' : ''}{market.priceChange24h.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <p className="text-lg font-semibold">{market.volume24h.toLocaleString()} kWh</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">24h Range</p>
                  <p className="text-sm">
                    ${market.lowPrice24h.toFixed(3)} - ${market.highPrice24h.toFixed(3)}
                  </p>
                </div>
              </div>

              {/* Chart Type Selection */}
              <div className="flex gap-2">
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('line')}
                >
                  Line Chart
                </Button>
                <Button
                  variant={chartType === 'candlestick' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('candlestick')}
                >
                  Candlestick
                </Button>
              </div>

              {/* Price Chart */}
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={['dataMin - 0.01', 'dataMax + 0.01']}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value.toFixed(3)}`}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="close"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  ) : (
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        yAxisId="price"
                        domain={['dataMin - 0.01', 'dataMax + 0.01']}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value.toFixed(3)}`}
                      />
                      <YAxis 
                        yAxisId="volume"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CandlestickTooltip />} />
                      <Bar 
                        yAxisId="volume"
                        dataKey="volume" 
                        fill="#94a3b8" 
                        opacity={0.3}
                      />
                      <Line
                        yAxisId="price"
                        type="monotone"
                        dataKey="high"
                        stroke="#10b981"
                        strokeWidth={1}
                        dot={false}
                      />
                      <Line
                        yAxisId="price"
                        type="monotone"
                        dataKey="low"
                        stroke="#ef4444"
                        strokeWidth={1}
                        dot={false}
                      />
                      <Line
                        yAxisId="price"
                        type="monotone"
                        dataKey="close"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        </CardContent>
      </Card>
    </div>
  )
}

// Custom tooltip for line chart
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{data.date}</p>
        <div className="space-y-1 mt-2">
          <p className="text-sm">
            <span className="font-medium">Price:</span> ${data.close.toFixed(4)}
          </p>
          <p className="text-sm">
            <span className="font-medium">Volume:</span> {data.volume.toLocaleString()} kWh
          </p>
        </div>
      </div>
    )
  }
  return null
}

// Custom tooltip for candlestick chart
function CandlestickTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{data.date}</p>
        <div className="space-y-1 mt-2">
          <p className="text-sm">
            <span className="font-medium">Open:</span> ${data.open.toFixed(4)}
          </p>
          <p className="text-sm">
            <span className="font-medium">High:</span> ${data.high.toFixed(4)}
          </p>
          <p className="text-sm">
            <span className="font-medium">Low:</span> ${data.low.toFixed(4)}
          </p>
          <p className="text-sm">
            <span className="font-medium">Close:</span> ${data.close.toFixed(4)}
          </p>
          <p className="text-sm">
            <span className="font-medium">Volume:</span> {data.volume.toLocaleString()} kWh
          </p>
        </div>
      </div>
    )
  }
  return null
}