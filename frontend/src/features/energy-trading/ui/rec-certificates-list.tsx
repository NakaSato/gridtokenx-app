import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRECCertificates } from '../data-access/use-energy-trading-data'
import { Award, Leaf, Calendar, ExternalLink } from 'lucide-react'
import { useMemo } from 'react'

export function RECCertificatesList() {
  const { data: certificates } = useRECCertificates()

  const stats = useMemo(() => {
    if (!certificates) return {
      totalCertificates: 0,
      totalMWh: 0,
      activeCertificates: 0,
      totalValue: 0
    }
    
    return {
      totalCertificates: certificates.length,
      totalMWh: certificates.reduce((sum, cert) => sum + cert.energyGenerated, 0) / 1000, // Convert kWh to MWh
      activeCertificates: certificates.filter(cert => cert.status === 'Certified').length,
      totalValue: certificates.reduce((sum, cert) => sum + (cert.energyGenerated * 0.05), 0) // Estimated value
    }
  }, [certificates])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Certified':
        return <Badge className="bg-green-500 hover:bg-green-600">Certified</Badge>
      case 'Pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
      case 'Traded':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Traded</Badge>
      case 'Retired':
        return <Badge variant="secondary">Retired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (timestamp: number) => {
    try {
      return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  if (!certificates || certificates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-500" />
            REC Certificates
          </CardTitle>
          <CardDescription>
            Renewable Energy Certificates from your solar generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Leaf className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No REC certificates available</p>
              <p className="text-sm mt-1">Certificates will appear as you generate renewable energy</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalCertificates}</div>
                <div className="text-xs text-gray-500">Total Certificates</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalMWh.toFixed(1)}</div>
                <div className="text-xs text-gray-500">Total MWh</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.activeCertificates}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">${stats.totalValue.toFixed(0)}</div>
                <div className="text-xs text-gray-500">Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-500" />
            REC Certificates
          </CardTitle>
          <CardDescription>
            Your renewable energy certificates and their verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Award className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Certificate #{certificate.id}</h3>
                      <p className="text-sm text-gray-500">
                        Generated on {formatDate(certificate.certificationDate)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(certificate.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-sm text-gray-500">Energy Amount</div>
                    <div className="font-medium">{(certificate.energyGenerated / 1000).toFixed(2)} MWh</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Meter ID</div>
                    <div className="font-medium">{certificate.meterId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Carbon Offset</div>
                    <div className="font-medium">{certificate.carbonOffset.toFixed(2)} kg CO₂</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Estimated Value</div>
                    <div className="font-medium">${(certificate.energyGenerated * 0.05).toFixed(2)}</div>
                  </div>
                </div>

                {certificate.verificationHash && (
                  <div className="mb-3">
                    <div className="text-sm text-gray-500 mb-1">Verification Hash</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {certificate.verificationHash.slice(0, 20)}...{certificate.verificationHash.slice(-10)}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => window.open(`https://explorer.solana.com/tx/${certificate.verificationHash}?cluster=devnet`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {certificate.engineeringDeptSignature ? 'Verified by Engineering Dept' : 'Pending verification'}
                  </div>
                  {certificate.status === 'Certified' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Transfer
                      </Button>
                      <Button size="sm" variant="outline">
                        Retire
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* REC Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-500" />
            About RECs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">What are Renewable Energy Certificates?</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• RECs represent the environmental benefits of renewable energy generation</li>
              <li>• Each REC represents 1 MWh of renewable energy generated</li>
              <li>• RECs can be traded separately from the physical electricity</li>
              <li>• They provide a way to track and verify renewable energy claims</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">REC Trading on GridTokenX</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Automatic REC generation for verified solar production</li>
              <li>• Blockchain-based verification ensures authenticity</li>
              <li>• P2P trading marketplace for buying and selling RECs</li>
              <li>• Integration with university sustainability programs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}