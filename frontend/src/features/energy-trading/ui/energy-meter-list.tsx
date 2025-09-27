import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEnergyMeterProgramAccounts } from '../data-access/use-energy-trading-data'
import { Zap, MapPin, Clock, Activity, Settings, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface EnergyMeterListProps {
  account: any
}

export function EnergyMeterList({ account }: EnergyMeterListProps) {
  const { data: meters, isLoading } = useEnergyMeterProgramAccounts()

  const getMeterTypeIcon = (type: string) => {
    switch (type) {
      case 'Solar_Prosumer': return <Zap className="h-4 w-4 text-yellow-500" />
      case 'Grid_Consumer': return <Activity className="h-4 w-4 text-blue-500" />
      case 'Hybrid_Prosumer': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'Battery_Storage': return <Activity className="h-4 w-4 text-purple-500" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  const getMeterTypeColor = (type: string) => {
    switch (type) {
      case 'Solar_Prosumer': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'Grid_Consumer': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Hybrid_Prosumer': return 'bg-green-50 text-green-700 border-green-200'
      case 'Battery_Storage': return 'bg-purple-50 text-purple-700 border-purple-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
      case 'Inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'Maintenance':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Maintenance</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!meters || meters.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <Zap className="h-12 w-12 text-gray-400 mx-auto" />
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">No Energy Meters Found</h3>
              <p className="text-sm text-gray-500">
                Connect your smart meters to start monitoring energy generation and consumption.
              </p>
            </div>
            <Button>
              Register New Meter
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Connected Meters ({meters.length})</h3>
        <Button variant="outline" size="sm">
          Register New Meter
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {meters.map((meter) => (
          <Card key={meter.publicKey} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {getMeterTypeIcon(meter.account.meterType)}
                  {meter.account.meterId}
                </CardTitle>
                {getStatusBadge(meter.account.status)}
              </div>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {meter.account.location}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getMeterTypeColor(meter.account.meterType)}`}>
                {meter.account.meterType.replace('_', ' ')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">Generation</div>
                  <div className="text-lg font-bold text-green-600">
                    {meter.account.totalGeneration.toFixed(2)} kWh
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">Consumption</div>
                  <div className="text-lg font-bold text-blue-600">
                    {meter.account.totalConsumption.toFixed(2)} kWh
                  </div>
                </div>
              </div>

              {meter.account.capacity > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">Capacity</div>
                  <div className="text-sm font-semibold">
                    {meter.account.capacity.toFixed(1)} kW
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Last reading: {formatDistanceToNow(new Date(meter.account.lastReading), { addSuffix: true })}
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button size="sm" className="flex-1">
                  Manage Trading
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}