import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEnergyReadings } from '../data-access/use-energy-trading-data'
import { CloudRain, Sun, Cloud, CloudDrizzle, Zap } from 'lucide-react'
import { useMemo } from 'react'

export function WeatherImpactChart() {
  const { data: energyReadings } = useEnergyReadings()

  const weatherData = useMemo(() => {
    if (!energyReadings) return []
    
    const weatherMap = new Map<string, { 
      condition: string
      totalGeneration: number
      readings: number
      avgGeneration: number
    }>()
    
    energyReadings.forEach(reading => {
      const condition = reading.weatherCondition
      if (!weatherMap.has(condition)) {
        weatherMap.set(condition, {
          condition,
          totalGeneration: 0,
          readings: 0,
          avgGeneration: 0
        })
      }
      
      const data = weatherMap.get(condition)!
      data.totalGeneration += reading.energyGenerated
      data.readings += 1
      data.avgGeneration = data.totalGeneration / data.readings
    })
    
    return Array.from(weatherMap.values()).sort((a, b) => b.avgGeneration - a.avgGeneration)
  }, [energyReadings])

  const maxGeneration = useMemo(() => {
    if (weatherData.length === 0) return 10
    return Math.max(...weatherData.map(d => d.avgGeneration), 1)
  }, [weatherData])

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny': return <Sun className="h-5 w-5 text-yellow-500" />
      case 'Partly_Cloudy': return <Cloud className="h-5 w-5 text-gray-400" />
      case 'Cloudy': return <Cloud className="h-5 w-5 text-gray-500" />
      case 'Overcast': return <CloudRain className="h-5 w-5 text-gray-600" />
      case 'Rainy': return <CloudDrizzle className="h-5 w-5 text-blue-500" />
      default: return <Sun className="h-5 w-5" />
    }
  }

  const getWeatherColor = (condition: string) => {
    switch (condition) {
      case 'Sunny': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'Partly_Cloudy': return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'Cloudy': return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'Overcast': return 'bg-gray-200 text-gray-800 border-gray-400'
      case 'Rainy': return 'bg-blue-50 text-blue-700 border-blue-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getEfficiencyBadge = (avgGeneration: number) => {
    const efficiency = (avgGeneration / maxGeneration) * 100
    if (efficiency >= 80) return <Badge className="bg-green-500 hover:bg-green-600">Excellent</Badge>
    if (efficiency >= 60) return <Badge className="bg-yellow-500 hover:bg-yellow-600">Good</Badge>
    if (efficiency >= 40) return <Badge className="bg-orange-500 hover:bg-orange-600">Fair</Badge>
    return <Badge variant="destructive">Poor</Badge>
  }

  if (!weatherData || weatherData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-yellow-500" />
            Weather Impact Analysis
          </CardTitle>
          <CardDescription>
            Solar generation performance by weather condition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <CloudRain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No weather data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-yellow-500" />
          Weather Impact Analysis
        </CardTitle>
        <CardDescription>
          Solar generation performance by weather condition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weather Condition Bars */}
        <div className="space-y-3">
          {weatherData.map((data, index) => {
            const barWidth = (data.avgGeneration / maxGeneration) * 100
            
            return (
              <div key={data.condition} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getWeatherIcon(data.condition)}
                    <div className={`px-2 py-1 rounded text-sm font-medium ${getWeatherColor(data.condition)}`}>
                      {data.condition.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getEfficiencyBadge(data.avgGeneration)}
                    <div className="text-sm font-medium">
                      {data.avgGeneration.toFixed(2)} kWh
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        index === 0 ? 'bg-green-500' :
                        index === 1 ? 'bg-yellow-500' :
                        index === 2 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(barWidth, 5)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{data.readings} readings</span>
                    <span>{((data.avgGeneration / maxGeneration) * 100).toFixed(0)}% efficiency</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary Statistics */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-lg font-bold">
                  {weatherData[0]?.condition.replace('_', ' ') || 'N/A'}
                </span>
              </div>
              <div className="text-xs text-gray-500">Best Condition</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <CloudRain className="h-4 w-4" />
                <span className="text-lg font-bold">
                  {weatherData[weatherData.length - 1]?.condition.replace('_', ' ') || 'N/A'}
                </span>
              </div>
              <div className="text-xs text-gray-500">Worst Condition</div>
            </div>
            <div className="md:col-span-1 col-span-2">
              <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                <Sun className="h-4 w-4" />
                <span className="text-lg font-bold">
                  {weatherData.reduce((sum, d) => sum + d.totalGeneration, 0).toFixed(1)}
                </span>
              </div>
              <div className="text-xs text-gray-500">Total Generated (kWh)</div>
            </div>
          </div>
        </div>

        {/* Weather Insights */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Weather Insights</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Sunny conditions provide optimal solar generation</li>
            <li>• {weatherData.length} different weather conditions recorded</li>
            <li>• Performance varies significantly between weather conditions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}