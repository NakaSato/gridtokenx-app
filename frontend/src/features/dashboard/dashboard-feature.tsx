import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  Battery,
  Sun,
  Wind,
  BarChart3,
  Wallet,
  Settings,
  Award,
  Activity,
  Calendar,
} from 'lucide-react'
import { AppHero } from '@/components/app-hero.tsx'
import { Link } from 'react-router'
import { useSolana } from '@/components/solana/use-solana'

export default function DashboardFeature() {
  const { account } = useSolana()

  // Mock data for demonstration (in production, these would come from your data hooks)
  const mockStats = {
    totalTrades: 127,
    energyTraded: 2847, // kWh
    recsIssued: 45,
    activeProsumers: 8,
    avgPrice: 0.12, // SOL per kWh
    myBalance: 15.67, // SOL
    myEnergyBalance: 234, // kWh
    carbonSaved: 1.2, // tons CO2
  }

  return (
    <div>
      <AppHero 
        title="Energy Trading Dashboard"
        subtitle="Monitor your energy trading activity and network statistics"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{mockStats.totalTrades}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Energy Traded</p>
                  <p className="text-2xl font-bold">{mockStats.energyTraded.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">kWh</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">RECs Issued</p>
                  <p className="text-2xl font-bold">{mockStats.recsIssued}</p>
                </div>
                <Award className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Prosumers</p>
                  <p className="text-2xl font-bold">{mockStats.activeProsumers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Get started with energy trading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full justify-start" size="lg">
                  <Link to="/energy-trading">
                    <Zap className="mr-2 h-4 w-4" />
                    Start Trading Energy
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full justify-start" size="lg">
                  <Link to="/registry">
                    <Users className="mr-2 h-4 w-4" />
                    Register as Participant
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full justify-start" size="lg">
                  <Link to="/governance">
                    <Settings className="mr-2 h-4 w-4" />
                    View Governance
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full justify-start" size="lg">
                  <Link to="/account">
                    <Wallet className="mr-2 h-4 w-4" />
                    Manage Wallet
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Personal Stats */}
            {account && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    My Stats
                  </CardTitle>
                  <CardDescription>
                    Your trading activity overview
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">SOL Balance</span>
                    <span className="font-bold">{mockStats.myBalance} SOL</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Energy Balance</span>
                    <span className="font-bold">{mockStats.myEnergyBalance} kWh</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Carbon Saved</span>
                    <span className="font-bold text-green-600">{mockStats.carbonSaved}t CO₂</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Middle Column - Market Overview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Overview
                </CardTitle>
                <CardDescription>
                  Current energy market statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Price</span>
                    <Badge variant="secondary">{mockStats.avgPrice} SOL/kWh</Badge>
                  </div>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-muted-foreground">Market activity: High</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Sun className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                    <p className="text-sm font-medium">Solar</p>
                    <p className="text-xs text-muted-foreground">65% of supply</p>
                  </div>
                  
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Wind className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium">Wind</p>
                    <p className="text-xs text-muted-foreground">35% of supply</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="h-5 w-5" />
                  Network Health
                </CardTitle>
                <CardDescription>
                  System performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Network Capacity</span>
                      <span>87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Transaction Speed</span>
                      <span>~2s</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>System Uptime</span>
                      <span>99.9%</span>
                    </div>
                    <Progress value={99.9} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Activity & Resources */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest network transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Energy trade completed</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2m ago</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">REC certificate issued</span>
                    </div>
                    <span className="text-xs text-muted-foreground">5m ago</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-sm">New prosumer registered</span>
                    </div>
                    <span className="text-xs text-muted-foreground">12m ago</span>
                  </div>

                  <Button variant="outline" size="sm" className="w-full mt-4">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Developer Resources</CardTitle>
                <CardDescription>
                  Tools and documentation for building on GridTokenX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <a
                    href="https://solana.com/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors group"
                  >
                    <span className="text-sm">Solana Documentation</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </a>
                  
                  <a
                    href="https://www.anchor-lang.com/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors group"
                  >
                    <span className="text-sm">Anchor Framework</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </a>
                  
                  <a
                    href="https://github.com/NakaSato/gridtokenx-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors group"
                  >
                    <span className="text-sm">GridTokenX GitHub</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
