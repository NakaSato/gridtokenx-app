import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEnergyReadings } from '../data-access/use-energy-trading-data'
import { TrendingUp, TrendingDown, Battery, Zap } from 'lucide-react'
import { useMemo } from 'react'

interface DataPoint {
  time: string
  generated: number
  consumed: number
  surplus: number
  deficit: number
  batteryLevel: number
}

export function EnergyBalanceChart() {
  const { data: energyReadings } = useEnergyReadings()

  const chartData = useMemo(() => {
    if (!energyReadings) return []
    
    return energyReadings.slice(-24).map(reading => ({
      time: new Date(reading.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      generated: reading.energyGenerated,
      consumed: reading.energyConsumed,
      surplus: reading.surplusEnergy,
      deficit: reading.deficitEnergy,
      batteryLevel: reading.batteryLevel
    }))
  }, [energyReadings])

  const summary = useMemo(() => {
    if (!energyReadings) return null
    
    const recentReadings = energyReadings.slice(-6) // Last 6 readings (3 hours if 30min intervals)
    const totalGenerated = recentReadings.reduce((sum, r) => sum + r.energyGenerated, 0)
    const totalConsumed = recentReadings.reduce((sum, r) => sum + r.energyConsumed, 0)
    const avgBattery = recentReadings.reduce((sum, r) => sum + r.batteryLevel, 0) / recentReadings.length
    const netEnergy = totalGenerated - totalConsumed
    
    return {
      totalGenerated: totalGenerated.toFixed(2),
      totalConsumed: totalConsumed.toFixed(2),
      netEnergy: netEnergy.toFixed(2),
      avgBattery: avgBattery.toFixed(1),
      efficiency: totalConsumed > 0 ? ((totalGenerated / totalConsumed) * 100).toFixed(1) : '0'
    }
  }, [energyReadings])

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 10
    return Math.max(
      ...chartData.map(d => Math.max(d.generated, d.consumed)),
      10
    )
  }, [chartData])

  // Simple SVG-based chart
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No energy data available</p>
          </div>
        </div>
      )
    }

    const width = 400
    const height = 200
    const padding = 40

    const xStep = (width - 2 * padding) / (chartData.length - 1)
    const yScale = (height - 2 * padding) / maxValue

    const generatePath = (data: number[]) => {
      return data.map((value, index) => {
        const x = padding + index * xStep
        const y = height - padding - value * yScale
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      }).join(' ')
    }

    const generatedPath = generatePath(chartData.map(d => d.generated))
    const consumedPath = generatePath(chartData.map(d => d.consumed))

    return (
      <div className="h-64 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percent => {
            const y = height - padding - (maxValue * percent / 100) * yScale
            return (
              <g key={percent}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#f0f0f0"
                  strokeWidth="1"
                />
                <text
                  x={padding - 5}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#666"
                >
                  {(maxValue * percent / 100).toFixed(1)}
                </text>
              </g>
            )
          })}
          
          {/* Generated line */}
          <path
            d={generatedPath}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Consumed line */}
          <path
            d={consumedPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {chartData.map((data, index) => {
            const x = padding + index * xStep
            const yGenerated = height - padding - data.generated * yScale
            const yConsumed = height - padding - data.consumed * yScale
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={yGenerated}
                  r="3"
                  fill="#22c55e"
                  stroke="white"
                  strokeWidth="1"
                />
                <circle
                  cx={x}
                  cy={yConsumed}
                  r="3"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="1"
                />
              </g>
            )
          })}
        </svg>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Generated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Consumed</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Energy Balance (24h)
        </CardTitle>
        <CardDescription>
          Generation vs consumption over the last 24 hours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-lg font-bold">{summary.totalGenerated}</span>
              </div>
              <div className="text-xs text-gray-500">Generated (kWh)</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <TrendingDown className="h-4 w-4" />
                <span className="text-lg font-bold">{summary.totalConsumed}</span>
              </div>
              <div className="text-xs text-gray-500">Consumed (kWh)</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                <Zap className="h-4 w-4" />
                <span className={`text-lg font-bold ${parseFloat(summary.netEnergy) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(summary.netEnergy) >= 0 ? '+' : ''}{summary.netEnergy}
                </span>
              </div>
              <div className="text-xs text-gray-500">Net (kWh)</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                <Battery className="h-4 w-4" />
                <span className="text-lg font-bold">{summary.avgBattery}%</span>
              </div>
              <div className="text-xs text-gray-500">Avg Battery</div>
            </div>
          </div>
        )}
        
        {/* Chart */}
        {renderChart()}
      </CardContent>
    </Card>
  )
}