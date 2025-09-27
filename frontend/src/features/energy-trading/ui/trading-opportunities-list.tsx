import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTradingOpportunities, useAcceptTradingOpportunity } from '../data-access/use-energy-trading-data'
import { TrendingUp, Users, Clock, Zap, DollarSign, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface TradingOpportunitiesListProps {
  account: any
}

export function TradingOpportunitiesList({ account }: TradingOpportunitiesListProps) {
  const { data: opportunities, isLoading } = useTradingOpportunities()
  const acceptTrade = useAcceptTradingOpportunity()
  const { toast } = useToast()

  const handleAcceptTrade = async (opportunityId: string, energyAmount: number, price: number) => {
    try {
      await acceptTrade.mutateAsync(opportunityId)
      toast({
        title: "Trade Accepted!",
        description: `Successfully accepted trade for ${energyAmount.toFixed(2)} kWh at $${price.toFixed(3)}/kWh`,
      })
    } catch (error) {
      toast({
        title: "Trade Failed",
        description: "Could not accept the trading opportunity. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>
      case 'Matched':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Matched</Badge>
      case 'Completed':
        return <Badge className="bg-gray-500 hover:bg-gray-600">Completed</Badge>
      case 'Cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
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

  if (!opportunities || opportunities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto" />
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">No Trading Opportunities</h3>
              <p className="text-sm text-gray-500">
                No active P2P trading opportunities are available right now.
                Check back later or create a new trading order.
              </p>
            </div>
            <Button>
              Create Trading Order
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const availableOpportunities = opportunities.filter(op => op.status === 'Available')
  const completedOpportunities = opportunities.filter(op => op.status === 'Completed' || op.status === 'Matched')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Trading Opportunities ({availableOpportunities.length} available)
        </h3>
        <Button variant="outline" size="sm">
          Create New Order
        </Button>
      </div>

      {/* Available Opportunities */}
      {availableOpportunities.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-green-600 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Available Now ({availableOpportunities.length})
          </h4>
          <div className="grid gap-4">
            {availableOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="border-green-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      {opportunity.energyAmount.toFixed(2)} kWh Available
                    </CardTitle>
                    {getStatusBadge(opportunity.status)}
                  </div>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {opportunity.sellerMeter} → {opportunity.buyerMeter}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(opportunity.timestamp), { addSuffix: true })}
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {opportunity.suggestedPrice.toFixed(3)}
                      </div>
                      <div className="text-xs text-gray-500">per kWh</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        ${(opportunity.energyAmount * opportunity.suggestedPrice).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Total Cost</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getCompatibilityColor(opportunity.compatibilityScore)}`}>
                        {(opportunity.compatibilityScore * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        ${opportunity.estimatedSavings.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Est. Savings</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => handleAcceptTrade(opportunity.id, opportunity.energyAmount, opportunity.suggestedPrice)}
                      disabled={acceptTrade.isPending}
                    >
                      {acceptTrade.isPending ? 'Processing...' : 'Accept Trade'}
                    </Button>
                    <Button variant="outline" size="icon">
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent/Completed Opportunities */}
      {completedOpportunities.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-600 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Recent Activity ({completedOpportunities.length})
          </h4>
          <div className="space-y-2">
            {completedOpportunities.slice(0, 5).map((opportunity) => (
              <Card key={opportunity.id} className="bg-gray-50 border-gray-200">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div className="text-sm">
                        <span className="font-medium">{opportunity.energyAmount.toFixed(2)} kWh</span>
                        <span className="text-gray-500"> traded at </span>
                        <span className="font-medium">${opportunity.suggestedPrice.toFixed(3)}/kWh</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(opportunity.status)}
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(opportunity.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}