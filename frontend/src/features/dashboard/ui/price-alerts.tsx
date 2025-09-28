import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Bell, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Settings,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'

export interface PriceAlert {
  id: string
  energyType: string
  condition: 'above' | 'below' | 'change'
  threshold: number
  isActive: boolean
  createdAt: number
  triggeredAt?: number
  message?: string
}

interface PriceAlertsProps {
  currentPrices: Record<string, number>
  priceChanges: Record<string, number>
  className?: string
}

export function PriceAlerts({ currentPrices, priceChanges, className }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({
    energyType: 'solar',
    condition: 'above' as const,
    threshold: 0
  })

  // Load alerts from localStorage on mount
  useEffect(() => {
    const savedAlerts = localStorage.getItem('priceAlerts')
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts))
      } catch (error) {
        console.error('Failed to load price alerts:', error)
      }
    }
  }, [])

  // Save alerts to localStorage whenever alerts change
  useEffect(() => {
    localStorage.setItem('priceAlerts', JSON.stringify(alerts))
  }, [alerts])

  // Check alerts against current prices
  const checkAlerts = useCallback(() => {
    const now = Date.now()
    const updatedAlerts = alerts.map(alert => {
      if (!alert.isActive || alert.triggeredAt) return alert

      const currentPrice = currentPrices[alert.energyType]
      const priceChange = priceChanges[alert.energyType]
      
      if (!currentPrice) return alert

      let shouldTrigger = false
      let message = ''

      switch (alert.condition) {
        case 'above':
          shouldTrigger = currentPrice >= alert.threshold
          message = `${alert.energyType} price reached $${currentPrice.toFixed(4)} (above $${alert.threshold.toFixed(4)})`
          break
        case 'below':
          shouldTrigger = currentPrice <= alert.threshold
          message = `${alert.energyType} price dropped to $${currentPrice.toFixed(4)} (below $${alert.threshold.toFixed(4)})`
          break
        case 'change':
          shouldTrigger = Math.abs(priceChange) >= alert.threshold
          message = `${alert.energyType} price changed by ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}% (threshold: ${alert.threshold}%)`
          break
      }

      if (shouldTrigger) {
        // Show browser notification
        showNotification(message)
        
        // Show toast notification
        toast.success('Price Alert Triggered', {
          description: message,
          duration: 5000
        })

        return {
          ...alert,
          triggeredAt: now,
          message
        }
      }

      return alert
    })

    setAlerts(updatedAlerts)
  }, [alerts, currentPrices, priceChanges])

  // Check alerts every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkAlerts, 30000)
    return () => clearInterval(interval)
  }, [checkAlerts])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const showNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('GridTokenX Price Alert', {
        body: message,
        icon: '/favicon.ico',
        tag: 'price-alert'
      })
    }
  }

  const addAlert = () => {
    if (newAlert.threshold <= 0) {
      toast.error('Please enter a valid threshold value')
      return
    }

    const alert: PriceAlert = {
      id: Date.now().toString(),
      energyType: newAlert.energyType,
      condition: newAlert.condition,
      threshold: newAlert.threshold,
      isActive: true,
      createdAt: Date.now()
    }

    setAlerts(prev => [...prev, alert])
    setNewAlert({ energyType: 'solar', condition: 'above', threshold: 0 })
    setIsDialogOpen(false)
    
    toast.success('Price alert created successfully')
  }

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
    toast.success('Price alert removed')
  }

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id 
        ? { ...alert, isActive: !alert.isActive, triggeredAt: undefined }
        : alert
    ))
  }

  const clearTriggeredAlerts = () => {
    setAlerts(prev => prev.filter(alert => !alert.triggeredAt))
    toast.success('Triggered alerts cleared')
  }

  const activeAlerts = alerts.filter(alert => alert.isActive && !alert.triggeredAt)
  const triggeredAlerts = alerts.filter(alert => alert.triggeredAt)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Price Alerts
            {activeAlerts.length > 0 && (
              <Badge variant="secondary">{activeAlerts.length}</Badge>
            )}
          </CardTitle>
          
          <div className="flex gap-2">
            {triggeredAlerts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearTriggeredAlerts}
              >
                Clear Triggered
              </Button>
            )}
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Alert
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Price Alert</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="energyType">Energy Type</Label>
                    <select
                      id="energyType"
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newAlert.energyType}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, energyType: e.target.value }))}
                    >
                      <option value="solar">Solar</option>
                      <option value="wind">Wind</option>
                      <option value="battery">Battery</option>
                      <option value="grid">Grid</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <select
                      id="condition"
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newAlert.condition}
                      onChange={(e) => setNewAlert(prev => ({ 
                        ...prev, 
                        condition: e.target.value as 'above' | 'below' | 'change' 
                      }))}
                    >
                      <option value="above">Price Above</option>
                      <option value="below">Price Below</option>
                      <option value="change">Price Change %</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="threshold">
                      Threshold {newAlert.condition === 'change' ? '(%)' : '($)'}
                    </Label>
                    <Input
                      id="threshold"
                      type="number"
                      step={newAlert.condition === 'change' ? '0.1' : '0.001'}
                      min="0"
                      value={newAlert.threshold}
                      onChange={(e) => setNewAlert(prev => ({ 
                        ...prev, 
                        threshold: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder={newAlert.condition === 'change' ? '5.0' : '0.100'}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={addAlert} className="flex-1">
                      Create Alert
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No price alerts configured</p>
            <p className="text-sm">Create alerts to get notified of price movements</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Triggered Alerts */}
            {triggeredAlerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Triggered Alerts
                </h4>
                {triggeredAlerts.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    currentPrice={currentPrices[alert.energyType]}
                    onRemove={removeAlert}
                    onToggle={toggleAlert}
                    isTriggered
                  />
                ))}
              </div>
            )}

            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Active Alerts
                </h4>
                {activeAlerts.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    currentPrice={currentPrices[alert.energyType]}
                    onRemove={removeAlert}
                    onToggle={toggleAlert}
                  />
                ))}
              </div>
            )}

            {/* Inactive Alerts */}
            {alerts.filter(alert => !alert.isActive).map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                currentPrice={currentPrices[alert.energyType]}
                onRemove={removeAlert}
                onToggle={toggleAlert}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface AlertCardProps {
  alert: PriceAlert
  currentPrice?: number
  onRemove: (id: string) => void
  onToggle: (id: string) => void
  isTriggered?: boolean
}

function AlertCard({ alert, currentPrice, onRemove, onToggle, isTriggered }: AlertCardProps) {
  const getConditionIcon = () => {
    switch (alert.condition) {
      case 'above':
        return <TrendingUp className="h-4 w-4" />
      case 'below':
        return <TrendingDown className="h-4 w-4" />
      case 'change':
        return <Activity className="h-4 w-4" />
    }
  }

  const getConditionText = () => {
    const unit = alert.condition === 'change' ? '%' : '$'
    return `${alert.condition} ${unit}${alert.threshold.toFixed(alert.condition === 'change' ? 1 : 4)}`
  }

  return (
    <div className={`p-3 border rounded-lg ${
      isTriggered 
        ? 'border-red-200 bg-red-50' 
        : alert.isActive 
          ? 'border-green-200 bg-green-50' 
          : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getConditionIcon()}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium capitalize">{alert.energyType}</span>
              <Badge variant={alert.isActive ? 'default' : 'secondary'} size="sm">
                {getConditionText()}
              </Badge>
            </div>
            {currentPrice && (
              <p className="text-sm text-muted-foreground">
                Current: ${currentPrice.toFixed(4)}
              </p>
            )}
            {isTriggered && alert.message && (
              <p className="text-sm text-red-600 mt-1">{alert.message}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(alert.id)}
            className={alert.isActive ? 'text-green-600' : 'text-gray-400'}
          >
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(alert.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}