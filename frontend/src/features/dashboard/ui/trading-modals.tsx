import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { TradingOpportunity, EnergyType } from '../data-access/types'

interface BuyConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  opportunity: TradingOpportunity | null
  onConfirm: (opportunityId: string, quantity: number) => Promise<void>
  isProcessing?: boolean
}

export function BuyConfirmationModal({
  isOpen,
  onClose,
  opportunity,
  onConfirm,
  isProcessing = false
}: BuyConfirmationModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)

  if (!opportunity) return null

  const totalCost = quantity * opportunity.pricePerKwh
  const estimatedFee = totalCost * 0.001 // 0.1% transaction fee
  const totalWithFee = totalCost + estimatedFee

  const handleConfirm = async () => {
    if (quantity <= 0 || quantity > opportunity.quantity) {
      setError('Invalid quantity')
      return
    }

    setError(null)
    try {
      await onConfirm(opportunity.id, quantity)
      onClose()
      setQuantity(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
      setQuantity(1)
      setError(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogDescription>
            Review your energy purchase details before confirming the transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Opportunity Details */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary">
                {opportunity.energyType.charAt(0).toUpperCase() + opportunity.energyType.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">from {opportunity.seller}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Location: {opportunity.location}
            </div>
            <div className="text-lg font-semibold">
              ${opportunity.pricePerKwh.toFixed(3)}/kWh
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="buy-quantity">Quantity (kWh)</Label>
            <Input
              id="buy-quantity"
              type="number"
              min="1"
              max={opportunity.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isProcessing}
            />
            <div className="text-xs text-muted-foreground">
              Available: {opportunity.quantity} kWh
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Energy Cost:</span>
              <span>${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Transaction Fee:</span>
              <span>${estimatedFee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total:</span>
              <span>${totalWithFee.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : `Buy ${quantity} kWh`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SellModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (energyType: string, quantity: number, price: number) => Promise<void>
  isProcessing?: boolean
}

const ENERGY_TYPES: { value: EnergyType; label: string }[] = [
  { value: 'solar', label: 'Solar' },
  { value: 'wind', label: 'Wind' },
  { value: 'battery', label: 'Battery Storage' },
  { value: 'grid', label: 'Grid' }
]

export function SellModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing = false
}: SellModalProps) {
  const [energyType, setEnergyType] = useState<EnergyType>('solar')
  const [quantity, setQuantity] = useState(1)
  const [pricePerKwh, setPricePerKwh] = useState(0.08)
  const [error, setError] = useState<string | null>(null)

  const totalRevenue = quantity * pricePerKwh
  const estimatedFee = totalRevenue * 0.001 // 0.1% transaction fee
  const netRevenue = totalRevenue - estimatedFee

  const handleConfirm = async () => {
    if (quantity <= 0) {
      setError('Quantity must be greater than 0')
      return
    }

    if (pricePerKwh <= 0) {
      setError('Price must be greater than 0')
      return
    }

    setError(null)
    try {
      await onConfirm(energyType, quantity, pricePerKwh)
      onClose()
      // Reset form
      setQuantity(1)
      setPricePerKwh(0.08)
      setEnergyType('solar')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
      setError(null)
    }
  }

  const selectedEnergyTypeLabel = ENERGY_TYPES.find(type => type.value === energyType)?.label || 'Solar'

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sell Energy</DialogTitle>
          <DialogDescription>
            Create a new energy selling opportunity for other traders to purchase.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Energy Type Selection */}
          <div className="space-y-2">
            <Label>Energy Type</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedEnergyTypeLabel}
                  <span className="ml-2">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {ENERGY_TYPES.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => setEnergyType(type.value)}
                  >
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="sell-quantity">Quantity (kWh)</Label>
            <Input
              id="sell-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isProcessing}
            />
          </div>

          {/* Price Input */}
          <div className="space-y-2">
            <Label htmlFor="sell-price">Price per kWh ($)</Label>
            <Input
              id="sell-price"
              type="number"
              step="0.001"
              min="0.001"
              value={pricePerKwh}
              onChange={(e) => setPricePerKwh(Math.max(0.001, parseFloat(e.target.value) || 0.001))}
              disabled={isProcessing}
            />
            <div className="text-xs text-muted-foreground">
              Market average: $0.08/kWh
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Gross Revenue:</span>
              <span>${totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Transaction Fee:</span>
              <span>-${estimatedFee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Net Revenue:</span>
              <span>${netRevenue.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : `Sell ${quantity} kWh`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}