import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { EnergyTradingDashboard } from './ui/energy-trading-dashboard.tsx'
import { EnergyMeterList } from './ui/energy-meter-list.tsx'
import { TradingOpportunitiesList } from './ui/trading-opportunities-list.tsx'
import { RECCertificatesList } from './ui/rec-certificates-list.tsx'
import { EnergyBalanceChart } from './ui/energy-balance-chart.tsx'
import { WeatherImpactChart } from './ui/weather-impact-chart.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEnergyMeterProgramAccounts } from './data-access/use-energy-trading-data'
import { useMemo } from 'react'

export default function EnergyTradingFeature() {
  const { account, cluster } = useSolana()
  const { data: meters } = useEnergyMeterProgramAccounts()

  const stats = useMemo(() => {
    if (!meters) return { total: 0, active: 0, prosumers: 0, consumers: 0 }
    
    return {
      total: meters.length,
      active: meters.filter(m => m.account.status === 'Active').length,
      prosumers: meters.filter(m => m.account.meterType === 'Solar_Prosumer').length,
      consumers: meters.filter(m => m.account.meterType === 'Grid_Consumer').length
    }
  }, [meters])

  return (
    <div className="container mx-auto py-6 space-y-8">
      <AppHero
        title="P2P Energy Trading System"
        subtitle={
          account
            ? `Connected to ${cluster} cluster. Manage your energy meters, trade surplus energy, and earn REC certificates.`
            : 'Connect your wallet to access the P2P energy trading platform.'
        }
      >
        {!account && (
          <div className="flex justify-center">
            <WalletDropdown />
          </div>
        )}
      </AppHero>

      {account && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Meters</CardTitle>
                <Badge variant="outline">{stats.total}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active}</div>
                <p className="text-xs text-muted-foreground">Active meters</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prosumers</CardTitle>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {stats.prosumers}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.prosumers}</div>
                <p className="text-xs text-muted-foreground">Energy producers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consumers</CardTitle>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {stats.consumers}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.consumers}</div>
                <p className="text-xs text-muted-foreground">Energy buyers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Status</CardTitle>
                <Badge variant="default" className="bg-green-500">Online</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">University PoA</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="meters">Meters</TabsTrigger>
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="certificates">REC</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <EnergyTradingDashboard account={account} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EnergyBalanceChart />
                <WeatherImpactChart />
              </div>
            </TabsContent>

            <TabsContent value="meters" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Smart Meters Management</CardTitle>
                  <CardDescription>
                    Monitor and manage your connected smart meters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnergyMeterList account={account} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trading" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>P2P Trading Opportunities</CardTitle>
                  <CardDescription>
                    Browse and participate in peer-to-peer energy trading
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TradingOpportunitiesList account={account} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certificates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Renewable Energy Certificates</CardTitle>
                  <CardDescription>
                    Manage your REC certificates and carbon offsets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RECCertificatesList />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Energy Generation Analytics</CardTitle>
                    <CardDescription>
                      Track your renewable energy generation over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EnergyBalanceChart />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Weather Impact Analysis</CardTitle>
                    <CardDescription>
                      How weather conditions affect your energy production
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WeatherImpactChart />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}