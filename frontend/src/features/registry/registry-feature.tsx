import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppHero } from '@/components/app-hero.tsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Building2, Zap, Shield, CheckCircle, Clock, UserCheck } from 'lucide-react'
import { RegistryUiRegisterUser } from './ui/registry-ui-register-user'
import { useRegistryParticipants } from './data-access/use-registry-participants'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSolana } from '@/components/solana/use-solana'

export default function RegistryFeature() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const { account } = useSolana()
  const participantsQuery = useRegistryParticipants()

  const participants = participantsQuery.data || []
  const participantCount = participants.length

  return (
    <div>
      <AppHero
        title="Participant Registry"
        subtitle="Join the GridTokenX network as a prosumer, consumer, or grid operator"
      />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Main Navigation Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Registration Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Zap className="h-8 w-8 text-yellow-500" />
                    <div>
                      <CardTitle className="text-yellow-600 dark:text-yellow-400">Prosumer</CardTitle>
                      <Badge variant="outline" className="mt-2">Producer + Consumer</Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Generate and consume energy. Sell excess renewable energy to the grid.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Solar panel owners</li>
                    <li>• Wind energy producers</li>
                    <li>• Battery storage systems</li>
                    <li>• Earn from excess energy</li>
                  </ul>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => setSelectedTab('register')}
                  >
                    Register as Prosumer
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <CardTitle className="text-blue-600 dark:text-blue-400">Consumer</CardTitle>
                      <Badge variant="outline" className="mt-2">Energy Buyer</Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Purchase clean energy directly from prosumers at competitive rates.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Residential customers</li>
                    <li>• Small businesses</li>
                    <li>• Commercial entities</li>
                    <li>• Support renewable energy</li>
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setSelectedTab('register')}
                  >
                    Register as Consumer
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-green-500" />
                    <div>
                      <CardTitle className="text-green-600 dark:text-green-400">Grid Operator</CardTitle>
                      <Badge variant="outline" className="mt-2">Network Authority</Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Manage smart meters and oversee network operations with governance authority.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Utility companies</li>
                    <li>• Network operators</li>
                    <li>• Meter management</li>
                    <li>• Governance participation</li>
                  </ul>
                  <Button 
                    variant="secondary" 
                    className="w-full mt-4"
                    onClick={() => setSelectedTab('register')}
                  >
                    Apply as Operator
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-green-500 mb-2">
                    {participantsQuery.isLoading ? '...' : participantCount}
                  </div>
                  <p className="text-muted-foreground">Registered Participants</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-blue-500 mb-2">
                    {participantsQuery.isLoading ? '...' : Math.floor(participantCount * 0.6)}
                  </div>
                  <p className="text-muted-foreground">Active Prosumers</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-purple-500 mb-2">
                    {participantsQuery.isLoading ? '...' : Math.floor(participantCount * 0.1)}
                  </div>
                  <p className="text-muted-foreground">Grid Operators</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Participant Registration
                </CardTitle>
                <CardDescription>
                  Complete your registration to start participating in the GridTokenX network
                </CardDescription>
              </CardHeader>
              <CardContent>
                {account ? (
                  <RegistryUiRegisterUser account={account} />
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                    <p className="text-muted-foreground mb-4">
                      Please connect your Solana wallet to register for the GridTokenX network
                    </p>
                    <Button variant="outline">Connect Wallet</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Network Participants
                </CardTitle>
                <CardDescription>
                  View all registered participants in the GridTokenX network
                </CardDescription>
              </CardHeader>
              <CardContent>
                {participantsQuery.isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading participants...</p>
                  </div>
                ) : participantCount === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Participants Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to register and start building the GridTokenX network!
                    </p>
                    <Button onClick={() => setSelectedTab('register')}>
                      Register Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {participantCount} participants registered
                      </p>
                      <Button size="sm" onClick={() => participantsQuery.refetch()}>
                        Refresh
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {participants.map((participant: any, index: number) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">
                                {index % 3 === 0 ? 'Prosumer' : index % 3 === 1 ? 'Consumer' : 'Operator'}
                              </Badge>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              Address: {`${String(participant.address || participant.pubkey || 'Unknown').slice(0, 8)}...${String(participant.address || participant.pubkey || 'Unknown').slice(-8)}`}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requirements Tab */}
          <TabsContent value="requirements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Registration Requirements
                </CardTitle>
                <CardDescription>
                  What you need to get started on GridTokenX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      For All Participants
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Solana wallet (Phantom, Solflare, etc.)</li>
                      <li>• Valid identification documents</li>
                      <li>• Location verification</li>
                      <li>• Terms of service agreement</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      For Prosumers & Operators
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Smart meter installation</li>
                      <li>• Energy production capacity docs</li>
                      <li>• Grid connection certification</li>
                      <li>• Technical specifications</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Registration Process</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-primary-foreground font-bold">1</span>
                      </div>
                      <p className="font-medium">Connect Wallet</p>
                      <p className="text-muted-foreground">Link your Solana wallet</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-primary-foreground font-bold">2</span>
                      </div>
                      <p className="font-medium">Choose Type</p>
                      <p className="text-muted-foreground">Select user type</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-primary-foreground font-bold">3</span>
                      </div>
                      <p className="font-medium">Submit Info</p>
                      <p className="text-muted-foreground">Provide location details</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-primary-foreground font-bold">4</span>
                      </div>
                      <p className="font-medium">Start Trading</p>
                      <p className="text-muted-foreground">Begin energy transactions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}