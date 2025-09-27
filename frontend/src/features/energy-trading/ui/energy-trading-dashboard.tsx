import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useEnergyReadings, useTradingOpportunities, useRECCertificates } from '../data-access/use-energy-trading-data'
import { Zap, TrendingUp, Award, Leaf, Battery, Sun, CloudRain } from 'lucide-react'
import { useMemo } from 'react'

interface EnergyTradingDashboardProps {
  account: any
}

export function EnergyTradingDashboard({ account }: EnergyTradingDashboardProps) {
  const { data: energyReadings } = useEnergyReadings()
  const { data: tradingOpportunities } = useTradingOpportunities()
  const { data: recCertificates } = useRECCertificates()

  const latestReading = energyReadings?.[0]
  const availableOpportunities = tradingOpportunities?.filter(op => op.status === 'Available')?.length || 0
  const certifiedRECs = recCertificates?.filter(cert => cert.status === 'Certified')?.length || 0

  const dashboardStats = useMemo(() => {
    if (!energyReadings) return null
    
    const totalGeneration = energyReadings.reduce((sum, reading) => sum + reading.energyGenerated, 0)
    const totalConsumption = energyReadings.reduce((sum, reading) => sum + reading.energyConsumed, 0)
    const totalCarbonOffset = energyReadings.reduce((sum, reading) => sum + reading.carbonOffset, 0)
    const selfSufficiencyRatio = totalConsumption > 0 ? Math.min(100, (totalGeneration / totalConsumption) * 100) : 0
    
    return {
      totalGeneration: totalGeneration.toFixed(2),
      totalConsumption: totalConsumption.toFixed(2),
      totalCarbonOffset: totalCarbonOffset.toFixed(2),
      selfSufficiencyRatio: selfSufficiencyRatio.toFixed(1),
      netEnergy: (totalGeneration - totalConsumption).toFixed(2)
    }
  }, [energyReadings])

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny': return <Sun className="h-4 w-4 text-yellow-500" />
      case 'Partly_Cloudy': return <CloudRain className="h-4 w-4 text-gray-400" />
      case 'Cloudy': return <CloudRain className="h-4 w-4 text-gray-500" />
      case 'Overcast': return <CloudRain className="h-4 w-4 text-gray-600" />
      case 'Rainy': return <CloudRain className="h-4 w-4 text-blue-500" />
      default: return <Sun className="h-4 w-4" />
    }
  }

  const getSufficiencyColor = (ratio: number) => {
    if (ratio >= 80) return 'text-green-600'
    if (ratio >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Current Status Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Real-time Energy Status
          </CardTitle>
          <CardDescription>Current energy generation and consumption</CardDescription>
        </CardHeader>
        <CardContent>
          {latestReading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {latestReading.energyGenerated.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">kWh Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {latestReading.energyConsumed.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">kWh Consumed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {latestReading.surplusEnergy.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">kWh Surplus</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {latestReading.batteryLevel.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Battery Level</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getWeatherIcon(latestReading.weatherCondition)}
                  <span className="text-sm font-medium">
                    {latestReading.weatherCondition.replace('_', ' ')}
                  </span>
                </div>
                <Badge variant={latestReading.recEligible ? 'default' : 'secondary'}>
                  {latestReading.recEligible ? 'REC Eligible' : 'Not REC Eligible'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Battery Charge</span>
                  <span>{latestReading.batteryLevel.toFixed(1)}%</span>
                </div>
                <Progress value={latestReading.batteryLevel} className="w-full" />
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No recent energy readings available
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Performance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            System Performance
          </CardTitle>
          <CardDescription>24-hour summary</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardStats ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Self-Sufficiency</span>
                  <span className={`font-medium ${getSufficiencyColor(parseFloat(dashboardStats.selfSufficiencyRatio))}`}>
                    {dashboardStats.selfSufficiencyRatio}%
                  </span>
                </div>
                <Progress 
                  value={parseFloat(dashboardStats.selfSufficiencyRatio)} 
                  className="w-full" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generation</span>
                  <span className="font-medium text-green-600">
                    {dashboardStats.totalGeneration} kWh
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Consumption</span>
                  <span className="font-medium text-blue-600">
                    {dashboardStats.totalConsumption} kWh
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Net Energy</span>
                  <span className={`font-medium ${parseFloat(dashboardStats.netEnergy) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(dashboardStats.netEnergy) >= 0 ? '+' : ''}{dashboardStats.netEnergy} kWh
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-500" />
                    <span>Carbon Offset</span>
                  </div>
                  <span className="font-medium text-green-600">
                    {dashboardStats.totalCarbonOffset} kg CO₂
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Loading performance data...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Opportunities Quick View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Trading Opportunities
          </CardTitle>
          <CardDescription>Available P2P trading matches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-3xl font-bold text-purple-600">{availableOpportunities}</div>
            <div className="text-sm text-muted-foreground">Active opportunities</div>
            <Button variant="outline" size="sm" className="w-full">
              View All Opportunities
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* REC Certificates Quick View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            REC Certificates
          </CardTitle>
          <CardDescription>Renewable energy certificates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-3xl font-bold text-yellow-600">{certifiedRECs}</div>
            <div className="text-sm text-muted-foreground">Certified RECs</div>
            <Button variant="outline" size="sm" className="w-full">
              View Certificates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className="h-5 w-5 text-blue-600" />
            Grid Status
          </CardTitle>
          <CardDescription>Network and grid connectivity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">University PoA</span>
              <Badge variant="default" className="bg-green-500">
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Smart Contracts</span>
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Grid Connection</span>
              <Badge variant="default" className="bg-green-500">
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Trading Engine</span>
              <Badge variant="default" className="bg-green-500">
                Running
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}