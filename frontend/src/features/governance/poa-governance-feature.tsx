import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useGovernanceData } from './data-access/use-governance-data'
import { useSolana } from '@/components/solana/use-solana'
import { AlertTriangle, Shield, Users, Settings, Activity, Pause, Play } from 'lucide-react'
import { useMemo } from 'react'

export default function PoAGovernanceFeature() {
  const { account, cluster } = useSolana()
  const { 
    data: governanceConfig, 
    isLoading,
    emergencyPauseMutation,
    emergencyUnpauseMutation
  } = useGovernanceData()

  const stats = useMemo(() => {
    if (!governanceConfig) return {
      totalValidators: 0,
      activeValidators: 0,
      minValidators: 0,
      isHealthy: false,
      isPaused: false
    }
    
    const activeCount = governanceConfig.authorizedRecValidators.filter((v: any) => v.active).length
    
    return {
      totalValidators: governanceConfig.authorizedRecValidators.length,
      activeValidators: activeCount,
      minValidators: governanceConfig.minRecValidators,
      isHealthy: activeCount >= governanceConfig.minRecValidators,
      isPaused: governanceConfig.emergencyPaused
    }
  }, [governanceConfig])

  const getValidatorStatusBadge = (validator: any) => {
    if (!validator.active) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (validator.certificationAuthority) {
      return <Badge className="bg-green-500 hover:bg-green-600">REC Authority</Badge>
    }
    return <Badge className="bg-blue-500 hover:bg-blue-600">Active</Badge>
  }

  const isUniversityAuthority = useMemo(() => {
    if (!account || !governanceConfig) return false
    return account.publicKey.toString() === governanceConfig.universityAuthority
  }, [account, governanceConfig])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!governanceConfig) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>PoA Governance Not Initialized</AlertTitle>
          <AlertDescription>
            The Proof of Authority governance system needs to be initialized. 
            Run the setup script: <code>./scripts/setup-poa-governance.sh</code>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-500" />
            PoA Governance
          </h1>
          <p className="text-gray-600 mt-2">
            Proof of Authority governance for GridTokenX energy trading system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={stats.isPaused ? "destructive" : "default"}>
            {stats.isPaused ? 'PAUSED' : 'Operational'}
          </Badge>
          <Badge variant="outline">
            {String(cluster)} cluster
          </Badge>
        </div>
      </div>

      {/* Emergency Alert */}
      {stats.isPaused && (
        <Alert variant="destructive">
          <Pause className="h-4 w-4" />
          <AlertTitle>Emergency Pause Active</AlertTitle>
          <AlertDescription>
            The energy trading system is currently paused. All trading operations are suspended.
            {isUniversityAuthority && (
              <Button 
                className="ml-4" 
                size="sm"
                onClick={() => emergencyUnpauseMutation.mutate()}
                disabled={emergencyUnpauseMutation.isPending}
              >
                <Play className="h-3 w-3 mr-1" />
                Resume System
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* System Health Alert */}
      {!stats.isHealthy && !stats.isPaused && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Insufficient Active Validators</AlertTitle>
          <AlertDescription>
            Only {stats.activeValidators} of {stats.minValidators} minimum validators are active. 
            System functionality may be limited.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalValidators}</div>
                <div className="text-xs text-gray-500">Total Validators</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.activeValidators}</div>
                <div className="text-xs text-gray-500">Active Validators</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Settings className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.minValidators}</div>
                <div className="text-xs text-gray-500">Minimum Required</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${stats.isHealthy ? 'bg-green-100' : 'bg-red-100'}`}>
                <Shield className={`h-4 w-4 ${stats.isHealthy ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${stats.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.isHealthy ? 'Healthy' : 'Critical'}
                </div>
                <div className="text-xs text-gray-500">System Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authority Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            University Authority
          </CardTitle>
          <CardDescription>
            Primary governance authority for the PoA system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium">University Engineering Department</div>
                <div className="text-sm text-gray-600 font-mono">
                  {governanceConfig.universityAuthority}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isUniversityAuthority && (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    Connected
                  </Badge>
                )}
                <Badge variant="outline">Primary Authority</Badge>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>Created:</strong> {new Date(governanceConfig.createdAt * 1000).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* REC Validators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            REC Validators
          </CardTitle>
          <CardDescription>
            Authorized validators for Renewable Energy Certificate processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {governanceConfig.authorizedRecValidators.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No REC validators configured</p>
            </div>
          ) : (
            <div className="space-y-4">
              {governanceConfig.authorizedRecValidators.map((validator: any) => (
                <div key={validator.pubkey} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{validator.authorityName}</h3>
                      <div className="text-sm text-gray-600 font-mono">
                        {validator.pubkey}
                      </div>
                    </div>
                    {getValidatorStatusBadge(validator)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 ${validator.active ? 'text-green-600' : 'text-red-600'}`}>
                        {validator.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cert Authority:</span>
                      <span className="ml-2">
                        {validator.certificationAuthority ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Added:</span>
                      <span className="ml-2">
                        {new Date(validator.addedAt * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Controls (Only for University Authority) */}
      {isUniversityAuthority && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Emergency Controls
            </CardTitle>
            <CardDescription>
              Emergency system controls - use with caution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {!stats.isPaused ? (
                <Button 
                  variant="destructive" 
                  onClick={() => emergencyPauseMutation.mutate()}
                  disabled={emergencyPauseMutation.isPending}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Emergency Pause
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  onClick={() => emergencyUnpauseMutation.mutate()}
                  disabled={emergencyUnpauseMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume System
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Management Commands</CardTitle>
          <CardDescription>
            Command-line tools for advanced governance management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Check System Status</h4>
            <code className="text-sm bg-white px-2 py-1 rounded">
              ./scripts/poa-governance-cli.sh status
            </code>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">List All Validators</h4>
            <code className="text-sm bg-white px-2 py-1 rounded">
              ./scripts/poa-governance-cli.sh list-validators
            </code>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Add New Validator</h4>
            <code className="text-sm bg-white px-2 py-1 rounded">
              ./scripts/poa-governance-cli.sh add-validator --pubkey PUBKEY --name "Department"
            </code>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Network Health Check</h4>
            <code className="text-sm bg-white px-2 py-1 rounded">
              ./scripts/poa-governance-cli.sh network-health
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}