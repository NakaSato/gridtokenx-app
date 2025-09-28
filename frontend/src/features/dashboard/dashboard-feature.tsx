import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  Sun,
  Wind,
  BarChart3,
  Wallet,
  Settings,
  Award,
  Activity,
  Calendar,
  PieChart,
  LineChart,
} from 'lucide-react'
import { AppHero } from '@/components/app-hero.tsx'
import { Link } from 'react-router'
import { useSolana } from '@/components/solana/use-solana'
import { Suspense } from 'react'

// Import dashboard components
import { MarketOverview } from './ui/market-overview'
import { PortfolioMetrics } from './ui/portfolio-metrics'
import { TradingSection } from './ui/trading-section'
import { TransactionHistory } from './ui/transaction-history'
import { TokenPortfolio } from './ui/token-portfolio'
import { NetworkStatus } from './ui/network-status'

// Import error boundaries and loading components
import { 
  ErrorBoundaryWrapper, 
  TradingErrorBoundary, 
  NetworkErrorBoundary 
} from './ui/dashboard-error-boundary'
import {
  TradingSectionSkeleton,
  MarketOverviewSkeleton,
  TransactionHistorySkeleton,
  TokenPortfolioSkeleton,
  NetworkStatusSkeleton,
  PortfolioMetricsSkeleton,
  QuickStatsSkeleton
} from './ui/loading-skeletons'

// Import data hooks
import { useTokenBalances } from './data-access/use-token-balances'
// import { useNetworkStatus } from './data-access/use-network-status'

export default function DashboardFeature() {
  const { account } = useSolana()
  const { data: portfolioData, isLoading: balancesLoading } = useTokenBalances()
  const balances = portfolioData?.balances || []
  const totalValue = portfolioData?.totalValue || 0
  const totalChange24h = portfolioData?.totalChange24h || 0
  // const { data: networkData } = useNetworkStatus()

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
        subtitle="Monitor your energy trading activity, portfolio, and network statistics"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Quick Stats Overview */}
        <ErrorBoundaryWrapper componentName="Quick Stats">
          <Suspense fallback={<QuickStatsSkeleton />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{mockStats.totalTrades}</p>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
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
                  <p className="text-xs text-muted-foreground">kWh this month</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold">
                    ${totalValue?.toLocaleString() || '0'}
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    {(totalChange24h || 0) >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                    )}
                    <span className={`${(totalChange24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(totalChange24h || 0) >= 0 ? '+' : ''}{(totalChange24h || 0).toFixed(2)}% (24h)
                    </span>
                  </div>
                </div>
                <Wallet className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Carbon Saved</p>
                  <p className="text-2xl font-bold">{mockStats.carbonSaved}t</p>
                  <p className="text-xs text-muted-foreground">CO₂ equivalent</p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
            </div>
          </Suspense>
        </ErrorBoundaryWrapper>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="trading" className="text-xs sm:text-sm">Trading</TabsTrigger>
            <TabsTrigger value="portfolio" className="text-xs sm:text-sm">Portfolio</TabsTrigger>
            <TabsTrigger value="market" className="text-xs sm:text-sm">Market</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
            <TabsTrigger value="network" className="text-xs sm:text-sm">Network</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Quick Actions */}
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
                <CardContent className="space-y-3 sm:space-y-4">
                  <Button asChild className="w-full justify-start" size="sm" variant="default">
                    <Link to="/energy-trading">
                      <Zap className="mr-2 h-4 w-4" />
                      <span className="truncate">Start Trading Energy</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full justify-start" size="sm">
                    <Link to="/registry">
                      <Users className="mr-2 h-4 w-4" />
                      <span className="truncate">Register as Participant</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full justify-start" size="sm">
                    <Link to="/governance">
                      <Settings className="mr-2 h-4 w-4" />
                      <span className="truncate">View Governance</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="w-full justify-start" size="sm">
                    <Link to="/account">
                      <Wallet className="mr-2 h-4 w-4" />
                      <span className="truncate">Manage Wallet</span>
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
                      <span className="text-sm font-medium">Active Orders</span>
                      <span className="font-bold">3</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Carbon Credits</span>
                      <span className="font-bold text-green-600">{mockStats.carbonSaved}t CO₂</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Market Overview Mini */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Market Summary
                  </CardTitle>
                  <CardDescription>
                    Current energy market snapshot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="text-center p-2 sm:p-3 bg-muted rounded-lg">
                      <Sun className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-yellow-500" />
                      <p className="text-xs sm:text-sm font-medium">Solar</p>
                      <p className="text-xs text-muted-foreground">$0.084/kWh</p>
                      <Badge variant="secondary" className="text-xs mt-1">+2.3%</Badge>
                    </div>
                    
                    <div className="text-center p-2 sm:p-3 bg-muted rounded-lg">
                      <Wind className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-blue-500" />
                      <p className="text-xs sm:text-sm font-medium">Wind</p>
                      <p className="text-xs text-muted-foreground">$0.071/kWh</p>
                      <Badge variant="secondary" className="text-xs mt-1">-1.2%</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Market Activity</span>
                      <Badge variant="default">High</Badge>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest network transactions and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start sm:items-center justify-between p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Zap className="h-4 w-4 text-yellow-500 mt-0.5 sm:mt-0 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium block">Energy trade completed</span>
                        <p className="text-xs text-muted-foreground truncate">Bought 25 kWh of solar energy</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">2m ago</span>
                  </div>
                  
                  <div className="flex items-start sm:items-center justify-between p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Award className="h-4 w-4 text-blue-500 mt-0.5 sm:mt-0 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium block">REC certificate issued</span>
                        <p className="text-xs text-muted-foreground truncate">Received certificate #REC-2025-001</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">15m ago</span>
                  </div>
                  
                  <div className="flex items-start sm:items-center justify-between p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Users className="h-4 w-4 text-green-500 mt-0.5 sm:mt-0 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium block">New prosumer registered</span>
                        <p className="text-xs text-muted-foreground truncate">Solar Farm #SF-123 joined network</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">1h ago</span>
                  </div>

                  <Button variant="outline" size="sm" className="w-full mt-4">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trading Tab */}
          <TabsContent value="trading" className="space-y-4 sm:space-y-6">
            <TradingErrorBoundary>
              <Suspense fallback={<TradingSectionSkeleton />}>
                <TradingSection />
              </Suspense>
            </TradingErrorBoundary>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ErrorBoundaryWrapper componentName="Token Portfolio">
                <Suspense fallback={<TokenPortfolioSkeleton />}>
                  <TokenPortfolio />
                </Suspense>
              </ErrorBoundaryWrapper>
              
              <ErrorBoundaryWrapper componentName="Portfolio Metrics">
                <Suspense fallback={<PortfolioMetricsSkeleton />}>
                  {balances.length > 0 && !balancesLoading ? (
                    <PortfolioMetrics 
                      balances={balances} 
                      totalValue={totalValue}
                      totalChange24h={totalChange24h}
                    />
                  ) : (
                    <PortfolioMetricsSkeleton />
                  )}
                </Suspense>
              </ErrorBoundaryWrapper>
            </div>
          </TabsContent>

          {/* Market Tab */}
          <TabsContent value="market" className="space-y-4 sm:space-y-6">
            <ErrorBoundaryWrapper componentName="Market Overview">
              <Suspense fallback={<MarketOverviewSkeleton />}>
                <MarketOverview />
              </Suspense>
            </ErrorBoundaryWrapper>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 sm:space-y-6">
            <ErrorBoundaryWrapper componentName="Transaction History">
              <Suspense fallback={<TransactionHistorySkeleton />}>
                <TransactionHistory />
              </Suspense>
            </ErrorBoundaryWrapper>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-4 sm:space-y-6">
            <NetworkErrorBoundary>
              <Suspense fallback={<NetworkStatusSkeleton />}>
                <NetworkStatus />
              </Suspense>
            </NetworkErrorBoundary>
          </TabsContent>
        </Tabs>

        {/* Developer Resources (Bottom Section) */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle>Developer Resources</CardTitle>
            <CardDescription>
              Tools and documentation for building on GridTokenX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <a
                href="https://solana.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 sm:p-3 hover:bg-muted rounded-lg transition-colors group touch-manipulation"
              >
                <span className="text-xs sm:text-sm truncate">Solana Documentation</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 ml-2" />
              </a>
              
              <a
                href="https://www.anchor-lang.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 sm:p-3 hover:bg-muted rounded-lg transition-colors group touch-manipulation"
              >
                <span className="text-xs sm:text-sm truncate">Anchor Framework</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 ml-2" />
              </a>
              
              <a
                href="https://github.com/NakaSato/gridtokenx-app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 sm:p-3 hover:bg-muted rounded-lg transition-colors group touch-manipulation sm:col-span-2 md:col-span-1"
              >
                <span className="text-xs sm:text-sm truncate">GridTokenX GitHub</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 ml-2" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
