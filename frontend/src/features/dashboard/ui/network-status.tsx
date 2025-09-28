import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { useNetworkStatus, useNetworkHealth } from '../data-access/use-network-status'
import { NetworkStatus as NetworkStatusType, NetworkType, CongestionLevel } from '../data-access/types'
import { ChevronDown, Wifi, WifiOff, AlertTriangle, CheckCircle, Clock, Activity, RefreshCw } from 'lucide-react'
import { useWalletUi, useWalletUiCluster, SolanaClusterId } from '@wallet-ui/react'

interface NetworkStatusProps {
  onNetworkSwitch?: (network: NetworkType) => void
  className?: string
  showNetworkSwitcher?: boolean
  autoReconnect?: boolean
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

function formatBlockTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

function getCongestionColor(level: CongestionLevel): string {
  switch (level) {
    case 'low': return 'text-green-600'
    case 'medium': return 'text-yellow-600'
    case 'high': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

function getCongestionBadgeVariant(level: CongestionLevel): 'default' | 'secondary' | 'destructive' {
  switch (level) {
    case 'low': return 'default'
    case 'medium': return 'secondary'
    case 'high': return 'destructive'
    default: return 'secondary'
  }
}

function getConnectionIcon(status: 'connected' | 'connecting' | 'disconnected') {
  switch (status) {
    case 'connected': return <Wifi className="h-4 w-4 text-green-600" />
    case 'connecting': return <Activity className="h-4 w-4 text-yellow-600 animate-pulse" />
    case 'disconnected': return <WifiOff className="h-4 w-4 text-red-600" />
  }
}

function getNetworkDisplayName(network: NetworkType): string {
  switch (network) {
    case 'mainnet': return 'Mainnet'
    case 'devnet': return 'Devnet'
    case 'testnet': return 'Testnet'
    default: return network
  }
}

function mapClusterIdToNetworkType(clusterId: string): NetworkType {
  switch (clusterId) {
    case 'mainnet-beta': return 'mainnet'
    case 'devnet': return 'devnet'
    case 'testnet': return 'testnet'
    case 'localnet': return 'devnet' // Map localnet to devnet for display
    default: return 'devnet'
  }
}

function mapNetworkTypeToClusterId(network: NetworkType): SolanaClusterId {
  switch (network) {
    case 'mainnet': return 'mainnet-beta'
    case 'devnet': return 'devnet'
    case 'testnet': return 'testnet'
    default: return 'devnet'
  }
}

export function NetworkStatus({ 
  onNetworkSwitch, 
  className, 
  showNetworkSwitcher = true,
  autoReconnect = true 
}: NetworkStatusProps) {
  const { cluster, connection } = useWalletUi()
  const { clusters, setCluster } = useWalletUiCluster()
  const { data: networkStatus, isLoading, error, refetch } = useNetworkStatus()
  const { isHealthy, isCongested, isConnected } = useNetworkHealth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [lastConnectionCheck, setLastConnectionCheck] = useState(Date.now())

  // Auto-reconnection logic
  useEffect(() => {
    if (!autoReconnect || isConnected) return

    const reconnectInterval = setInterval(() => {
      if (!isConnected && connectionAttempts < 5) {
        console.log(`Attempting to reconnect... (${connectionAttempts + 1}/5)`)
        refetch()
        setConnectionAttempts(prev => prev + 1)
        setLastConnectionCheck(Date.now())
      }
    }, 5000) // Try every 5 seconds

    return () => clearInterval(reconnectInterval)
  }, [isConnected, connectionAttempts, autoReconnect, refetch])

  // Reset connection attempts when successfully connected
  useEffect(() => {
    if (isConnected) {
      setConnectionAttempts(0)
    }
  }, [isConnected])

  // Health monitoring - refetch data more frequently if network is unhealthy
  useEffect(() => {
    if (!isHealthy || isCongested) {
      const healthCheckInterval = setInterval(() => {
        refetch()
      }, 5000) // Check every 5 seconds when unhealthy

      return () => clearInterval(healthCheckInterval)
    }
  }, [isHealthy, isCongested, refetch])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setLastConnectionCheck(Date.now())
    await refetch()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleNetworkSwitch = (clusterId: string) => {
    const networkType = mapClusterIdToNetworkType(clusterId)
    setCluster(clusterId as SolanaClusterId)
    onNetworkSwitch?.(networkType)
    setConnectionAttempts(0) // Reset connection attempts on network switch
    
    // Refetch network status after switching
    setTimeout(() => {
      refetch()
    }, 1000)
  }

  const currentNetworkType = mapClusterIdToNetworkType(cluster.id)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse" />
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !networkStatus) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600 mb-3">
            Failed to load network information
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Retrying...' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { info, health, connectionStatus } = networkStatus

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getConnectionIcon(connectionStatus)}
            Network Status
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 w-6 p-0"
          >
            <Activity className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Selection */}
        {showNetworkSwitcher && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Network:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7">
                  {cluster.label}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup 
                  value={cluster.id} 
                  onValueChange={handleNetworkSwitch}
                >
                  {clusters.map((availableCluster) => (
                    <DropdownMenuRadioItem 
                      key={availableCluster.id} 
                      value={availableCluster.id}
                    >
                      {availableCluster.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {connectionStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
              </Badge>
            )}
            {!isConnected && autoReconnect && connectionAttempts > 0 && (
              <span className="text-xs text-gray-500">
                ({connectionAttempts}/5)
              </span>
            )}
          </div>
        </div>

        {/* Block Height */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Block Height:</span>
          <span className="text-sm font-mono">{formatNumber(info.blockHeight)}</span>
        </div>

        {/* Last Block Time */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Last Block:</span>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3" />
            {formatBlockTime(info.lastBlockTime)}
          </div>
        </div>

        {/* Transaction Throughput */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">TPS:</span>
          <span className="text-sm font-mono">{formatNumber(info.transactionThroughput)}</span>
        </div>

        {/* Network Congestion */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Congestion:</span>
          <Badge variant={getCongestionBadgeVariant(info.networkCongestion)} className="text-xs">
            {info.networkCongestion.toUpperCase()}
          </Badge>
        </div>

        {/* Gas Price */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Gas Price:</span>
          <span className="text-sm font-mono">{formatNumber(info.gasPrice)} lamports</span>
        </div>

        {/* Network Health */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Network Health:</span>
            <span className="text-sm font-medium">{health.uptime.toFixed(1)}%</span>
          </div>
          <Progress value={health.uptime} className="h-2" />
        </div>

        {/* Network Capacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Capacity:</span>
            <span className="text-sm font-medium">{health.networkCapacity.toFixed(1)}%</span>
          </div>
          <Progress value={health.networkCapacity} className="h-2" />
        </div>

        {/* Validators Info */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Validators:</span>
          <span className="text-sm">
            {info.validators.active}/{info.validators.total}
          </span>
        </div>

        {/* Epoch Info */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Epoch:</span>
          <span className="text-sm font-mono">{info.epochInfo.epoch}</span>
        </div>

        {/* Connection Management */}
        {!isConnected && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md">
              <WifiOff className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">
                Connection lost
                {autoReconnect && connectionAttempts > 0 && (
                  <span className="ml-1">- Reconnecting...</span>
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-1"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Reconnect
              </Button>
            </div>
          </div>
        )}

        {/* Health Indicators */}
        {isConnected && !isHealthy && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">Network health below 95%</span>
          </div>
        )}

        {isConnected && isCongested && (
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">High network congestion detected</span>
          </div>
        )}

        {/* Auto-reconnect Status */}
        {autoReconnect && !isConnected && (
          <div className="text-xs text-gray-500 text-center">
            Auto-reconnect enabled
            {connectionAttempts >= 5 && (
              <span className="block text-red-500">Max attempts reached</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}