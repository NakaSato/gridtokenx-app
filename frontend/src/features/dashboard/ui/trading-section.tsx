import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { TradingOpportunity, TradingFilters, EnergyType } from '../data-access/types'
import { useTradingData } from '../data-access/use-trading-data'
import { useBuyEnergyMutation, useSellEnergyMutation } from '../data-access/use-trading-mutations'
import { BuyConfirmationModal, SellModal } from './trading-modals'
import { TransactionStatusList, useTransactionStatusManager } from './transaction-status'
// import { LivePriceDisplay, usePriceTracking } from './price-indicators'

interface TradingSectionProps {
  onBuy?: (opportunityId: string, quantity: number) => Promise<void>
  onSell?: (energyType: string, quantity: number, price: number) => Promise<void>
}

const ENERGY_TYPE_COLORS: Record<EnergyType, string> = {
  solar: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  wind: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  battery: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  grid: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

const ENERGY_TYPE_LABELS: Record<EnergyType, string> = {
  solar: 'Solar',
  wind: 'Wind',
  battery: 'Battery',
  grid: 'Grid'
}

type SortField = 'price' | 'quantity' | 'availableUntil' | 'estimatedSavings'
type SortDirection = 'asc' | 'desc'

export function TradingSection({ onBuy, onSell }: TradingSectionProps) {
  const { data: tradingData, isLoading, error } = useTradingData()
  const buyMutation = useBuyEnergyMutation()
  const sellMutation = useSellEnergyMutation()
  
  // Real-time features
  const transactionManager = useTransactionStatusManager()
  // const solarPricing = usePriceTracking(0.08)
  // const windPricing = usePriceTracking(0.06)
  // const batteryPricing = usePriceTracking(0.12)
  // const gridPricing = usePriceTracking(0.10)
  
  // Filter and sort state
  const [filters, setFilters] = useState<TradingFilters>({
    energyType: [],
    priceRange: [0, 1],
    location: [],
    minQuantity: 0,
    maxQuantity: 1000
  })
  
  const [sortField, setSortField] = useState<SortField>('price')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchLocation, setSearchLocation] = useState('')
  
  // Modal state
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [sellModalOpen, setSellModalOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<TradingOpportunity | null>(null)
  
  // Real-time price updates
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     // Simulate price fluctuations
  //     const fluctuation = () => (Math.random() - 0.5) * 0.002 // ±0.1% change
      
  //     solarPricing.updatePrice(solarPricing.currentPrice + fluctuation())
  //     windPricing.updatePrice(windPricing.currentPrice + fluctuation())
  //     batteryPricing.updatePrice(batteryPricing.currentPrice + fluctuation())
  //     gridPricing.updatePrice(gridPricing.currentPrice + fluctuation())
  //   }, 5000) // Update every 5 seconds
    
  //   return () => clearInterval(interval)
  // }, [solarPricing, windPricing, batteryPricing, gridPricing])
  
  // Filter and sort opportunities
  const filteredAndSortedOpportunities = useMemo(() => {
    if (!tradingData?.opportunities) return []
    
    let filtered = tradingData.opportunities.filter(opportunity => {
      // Energy type filter
      if (filters.energyType && filters.energyType.length > 0) {
        if (!filters.energyType.includes(opportunity.energyType)) return false
      }
      
      // Price range filter
      if (filters.priceRange) {
        const [minPrice, maxPrice] = filters.priceRange
        if (opportunity.pricePerKwh < minPrice || opportunity.pricePerKwh > maxPrice) return false
      }
      
      // Quantity filter
      if (filters.minQuantity && opportunity.quantity < filters.minQuantity) return false
      if (filters.maxQuantity && opportunity.quantity > filters.maxQuantity) return false
      
      // Location search
      if (searchLocation && !opportunity.location.toLowerCase().includes(searchLocation.toLowerCase())) {
        return false
      }
      
      return true
    })
    
    // Sort opportunities
    filtered.sort((a, b) => {
      let aValue: number
      let bValue: number
      
      switch (sortField) {
        case 'price':
          aValue = a.pricePerKwh
          bValue = b.pricePerKwh
          break
        case 'quantity':
          aValue = a.quantity
          bValue = b.quantity
          break
        case 'availableUntil':
          aValue = a.availableUntil
          bValue = b.availableUntil
          break
        case 'estimatedSavings':
          aValue = a.estimatedSavings
          bValue = b.estimatedSavings
          break
        default:
          return 0
      }
      
      const result = aValue - bValue
      return sortDirection === 'asc' ? result : -result
    })
    
    return filtered
  }, [tradingData?.opportunities, filters, sortField, sortDirection, searchLocation])
  
  const handleEnergyTypeFilter = (energyType: EnergyType) => {
    setFilters(prev => ({
      ...prev,
      energyType: prev.energyType?.includes(energyType)
        ? prev.energyType.filter(type => type !== energyType)
        : [...(prev.energyType || []), energyType]
    }))
  }
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  const formatTimeRemaining = (timestamp: number) => {
    const now = Date.now()
    const remaining = timestamp - now
    
    if (remaining <= 0) return 'Expired'
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
  
  const handleBuyClick = (opportunity: TradingOpportunity) => {
    setSelectedOpportunity(opportunity)
    setBuyModalOpen(true)
  }
  
  const handleBuyConfirm = async (opportunityId: string, quantity: number) => {
    try {
      // Add transaction to status tracker
      const txHash = `buy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      transactionManager.addTransaction({
        hash: txHash,
        status: 'pending',
        type: 'buy',
        amount: quantity,
        energyType: selectedOpportunity?.energyType
      })
      
      const result = await buyMutation.mutateAsync({ opportunityId, quantity })
      
      // Update transaction status
      transactionManager.updateTransactionStatus(txHash, 'confirmed', Math.floor(Math.random() * 1000000), 0.000005)
      
      // Call the optional callback if provided
      if (onBuy) {
        await onBuy(opportunityId, quantity)
      }
      
      console.log('Buy transaction completed:', result)
    } catch (error) {
      console.error('Buy transaction failed:', error)
      throw error // Re-throw to let the modal handle the error display
    }
  }
  
  const handleSellConfirm = async (energyType: string, quantity: number, pricePerKwh: number) => {
    try {
      // Add transaction to status tracker
      const txHash = `sell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      transactionManager.addTransaction({
        hash: txHash,
        status: 'pending',
        type: 'sell',
        amount: quantity,
        energyType
      })
      
      const result = await sellMutation.mutateAsync({ energyType, quantity, pricePerKwh })
      
      // Update transaction status
      transactionManager.updateTransactionStatus(txHash, 'confirmed', Math.floor(Math.random() * 1000000), 0.000005)
      
      // Call the optional callback if provided
      if (onSell) {
        await onSell(energyType, quantity, pricePerKwh)
      }
      
      console.log('Sell transaction completed:', result)
    } catch (error) {
      console.error('Sell transaction failed:', error)
      throw error // Re-throw to let the modal handle the error display
    }
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trading Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading trading opportunities...</div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trading Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-destructive">
            Failed to load trading opportunities. Please try again.
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Trading Opportunities</CardTitle>
          <CardAction>
            <Button onClick={() => setSellModalOpen(true)} variant="outline">
              Sell Energy
            </Button>
          </CardAction>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Market Prices */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <LivePriceDisplay
            energyType="solar"
            currentPrice={solarPricing.currentPrice}
            previousPrice={solarPricing.previousPrice}
            trend={solarPricing.trend}
            lastUpdated={Date.now()}
          />
          <LivePriceDisplay
            energyType="wind"
            currentPrice={windPricing.currentPrice}
            previousPrice={windPricing.previousPrice}
            trend={windPricing.trend}
            lastUpdated={Date.now()}
          />
          <LivePriceDisplay
            energyType="battery"
            currentPrice={batteryPricing.currentPrice}
            previousPrice={batteryPricing.previousPrice}
            trend={batteryPricing.trend}
            lastUpdated={Date.now()}
          />
          <LivePriceDisplay
            energyType="grid"
            currentPrice={gridPricing.currentPrice}
            previousPrice={gridPricing.previousPrice}
            trend={gridPricing.trend}
            lastUpdated={Date.now()}
          />
        </div> */}
        
        {/* Transaction Status */}
        {transactionManager.transactions.length > 0 && (
          <TransactionStatusList
            transactions={transactionManager.transactions}
            onDismiss={transactionManager.dismissTransaction}
          />
        )}
        
        {/* Filters */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Label className="text-sm font-medium">Filter by Energy Type:</Label>
            {Object.entries(ENERGY_TYPE_LABELS).map(([type, label]) => (
              <Button
                key={type}
                variant={filters.energyType?.includes(type as EnergyType) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleEnergyTypeFilter(type as EnergyType)}
              >
                {label}
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location-search">Location</Label>
              <Input
                id="location-search"
                placeholder="Search by location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min-price">Min Price ($/kWh)</Label>
              <Input
                id="min-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={filters.priceRange?.[0] || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  priceRange: [parseFloat(e.target.value) || 0, prev.priceRange?.[1] || 1]
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-price">Max Price ($/kWh)</Label>
              <Input
                id="max-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="1.00"
                value={filters.priceRange?.[1] || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  priceRange: [prev.priceRange?.[0] || 0, parseFloat(e.target.value) || 1]
                }))}
              />
            </div>
          </div>
        </div>
        
        {/* Sort Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <Label className="text-sm font-medium">Sort by:</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortField === 'price' && 'Price'}
                {sortField === 'quantity' && 'Quantity'}
                {sortField === 'availableUntil' && 'Time Remaining'}
                {sortField === 'estimatedSavings' && 'Savings'}
                {sortDirection === 'asc' ? ' ↑' : ' ↓'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSort('price')}>
                Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('quantity')}>
                Quantity {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('availableUntil')}>
                Time Remaining {sortField === 'availableUntil' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('estimatedSavings')}>
                Savings {sortField === 'estimatedSavings' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Opportunities List */}
        <div className="space-y-4">
          {filteredAndSortedOpportunities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No trading opportunities match your filters.
            </div>
          ) : (
            filteredAndSortedOpportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onBuyClick={handleBuyClick}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
    
    {/* Modals */}
    <BuyConfirmationModal
      isOpen={buyModalOpen}
      onClose={() => setBuyModalOpen(false)}
      opportunity={selectedOpportunity}
      onConfirm={handleBuyConfirm}
      isProcessing={buyMutation.isPending}
    />
    
    <SellModal
      isOpen={sellModalOpen}
      onClose={() => setSellModalOpen(false)}
      onConfirm={handleSellConfirm}
      isProcessing={sellMutation.isPending}
    />
  </>
  )
}

interface OpportunityCardProps {
  opportunity: TradingOpportunity
  onBuyClick: (opportunity: TradingOpportunity) => void
}

function OpportunityCard({ opportunity, onBuyClick }: OpportunityCardProps) {
  
  const timeRemaining = formatTimeRemaining(opportunity.availableUntil)
  const isExpired = opportunity.availableUntil <= Date.now()
  
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
          {/* Energy Type and Seller */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={ENERGY_TYPE_COLORS[opportunity.energyType]}>
                {ENERGY_TYPE_LABELS[opportunity.energyType]}
              </Badge>
              {isExpired && <Badge variant="destructive">Expired</Badge>}
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="font-medium">{opportunity.seller}</div>
              <div>{opportunity.location}</div>
            </div>
          </div>
          
          {/* Quantity and Price */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Available</div>
            <div className="font-semibold">{opportunity.quantity} kWh</div>
            <div className="text-lg font-bold text-primary">
              ${opportunity.pricePerKwh.toFixed(3)}/kWh
            </div>
          </div>
          
          {/* Time and Savings */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Time Remaining</div>
            <div className={`font-medium ${isExpired ? 'text-destructive' : 'text-foreground'}`}>
              {timeRemaining}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Est. savings: ${opportunity.estimatedSavings.toFixed(2)}
            </div>
          </div>
          
          {/* Buy Controls */}
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Price: ${opportunity.pricePerKwh.toFixed(3)}/kWh
            </div>
            
            <Button
              onClick={() => onBuyClick(opportunity)}
              disabled={isExpired}
              className="w-full"
            >
              {isExpired ? 'Expired' : 'Buy Energy'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatTimeRemaining(timestamp: number): string {
  const now = Date.now()
  const remaining = timestamp - now
  
  if (remaining <= 0) return 'Expired'
  
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}