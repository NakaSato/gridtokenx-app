import { useState } from 'react'
import { RefreshCw, Copy, ExternalLink, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTokenBalances } from '../data-access/use-token-balances'
import { TokenBalance } from '../data-access/types'
import { PortfolioMetrics } from './portfolio-metrics'
import { TokenDetailsModal } from './token-details-modal'
import { cn } from '@/lib/utils'

interface TokenPortfolioProps {
  className?: string
}

interface TokenBalanceCardProps {
  balance: TokenBalance
  onCopyAddress: (address: string) => void
  onViewContract: (address: string) => void
  onViewDetails: (token: TokenBalance) => void
}

function TokenBalanceCard({ balance, onCopyAddress, onViewContract, onViewDetails }: TokenBalanceCardProps) {
  const isPositiveChange = balance.priceChange24h >= 0
  const changeColor = isPositiveChange ? 'text-green-600' : 'text-red-600'
  const TrendIcon = isPositiveChange ? TrendingUp : TrendingDown

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={balance.logoUri} alt={balance.symbol} />
              <AvatarFallback className="text-sm font-medium">
                {balance.symbol.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{balance.tokenName}</h3>
              <p className="text-xs text-muted-foreground">{balance.symbol}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {balance.decimals} decimals
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="font-medium">
              {balance.balance.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 6 
              })} {balance.symbol}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">USD Value</span>
            <span className="font-semibold">
              ${balance.usdValue.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">24h Change</span>
            <div className={cn("flex items-center space-x-1", changeColor)}>
              <TrendIcon className="h-3 w-3" />
              <span className="text-sm font-medium">
                {balance.priceChange24h > 0 ? '+' : ''}{balance.priceChange24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground truncate flex-1 mr-2">
              {balance.contractAddress}
            </span>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onCopyAddress(balance.contractAddress)}
                title="Copy contract address"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onViewContract(balance.contractAddress)}
                title="View on explorer"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={() => onViewDetails(balance)}
          >
            <Info className="h-3 w-3 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PortfolioSummary({ 
  totalValue, 
  totalChange24h, 
  balanceCount 
}: { 
  totalValue: number
  totalChange24h: number
  balanceCount: number
}) {
  const isPositiveChange = totalChange24h >= 0
  const changeColor = isPositiveChange ? 'text-green-600' : 'text-red-600'
  const TrendIcon = isPositiveChange ? TrendingUp : TrendingDown

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Portfolio Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">
              ${totalValue.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">24h Change</span>
            <div className={cn("flex items-center space-x-1", changeColor)}>
              <TrendIcon className="h-4 w-4" />
              <span className="font-medium">
                {totalChange24h > 0 ? '+' : ''}{totalChange24h.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tokens</span>
            <span className="font-medium">{balanceCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TokenPortfolio({ className }: TokenPortfolioProps) {
  const { data: portfolioData, isLoading, error, refetch, isFetching } = useTokenBalances()
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null)

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const handleViewContract = (address: string) => {
    // Open Solana explorer in new tab
    const explorerUrl = `https://explorer.solana.com/address/${address}`
    window.open(explorerUrl, '_blank', 'noopener,noreferrer')
  }

  const handleRefresh = () => {
    refetch()
  }

  const handleViewDetails = (token: TokenBalance) => {
    setSelectedToken(token)
  }

  const handleCloseDetails = () => {
    setSelectedToken(null)
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Failed to load portfolio data
              </p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Token Portfolio</h2>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isFetching}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-4">

      {isLoading ? (
        <div className="space-y-4">
          {/* Portfolio Summary Skeleton */}
          <Card>
            <CardHeader className="pb-3">
              <div className="h-6 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-20" />
                  <div className="h-8 bg-muted rounded animate-pulse w-32" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded animate-pulse w-16" />
                  <div className="h-4 bg-muted rounded animate-pulse w-20" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded animate-pulse w-12" />
                  <div className="h-4 bg-muted rounded animate-pulse w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Balance Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 bg-muted rounded animate-pulse w-24" />
                        <div className="h-3 bg-muted rounded animate-pulse w-16" />
                      </div>
                    </div>
                    <div className="h-5 bg-muted rounded animate-pulse w-16" />
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-4 bg-muted rounded animate-pulse w-16" />
                        <div className="h-4 bg-muted rounded animate-pulse w-20" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between">
                      <div className="h-3 bg-muted rounded animate-pulse flex-1 mr-2" />
                      <div className="flex space-x-1">
                        <div className="h-6 w-6 bg-muted rounded animate-pulse" />
                        <div className="h-6 w-6 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : portfolioData ? (
        <div className="space-y-4">
          <PortfolioSummary
            totalValue={portfolioData.totalValue}
            totalChange24h={portfolioData.totalChange24h}
            balanceCount={portfolioData.balances.length}
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {portfolioData.balances.map((balance) => (
              <TokenBalanceCard
                key={balance.contractAddress}
                balance={balance}
                onCopyAddress={handleCopyAddress}
                onViewContract={handleViewContract}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {copiedAddress && (
            <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg">
              Address copied to clipboard!
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground">
            Last updated: {new Date(portfolioData.lastUpdated).toLocaleString()}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          {portfolioData && (
            <PortfolioMetrics
              balances={portfolioData.balances}
              totalValue={portfolioData.totalValue}
              totalChange24h={portfolioData.totalChange24h}
            />
          )}
        </TabsContent>
        </div>
      ) : null}
      </Tabs>

      {/* Token Details Modal */}
      {selectedToken && (
        <TokenDetailsModal
          token={selectedToken}
          isOpen={!!selectedToken}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  )
}