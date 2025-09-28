import { useState } from 'react'
import { Copy, ExternalLink, CheckCircle, AlertCircle, Globe, Twitter, MessageCircle, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTokenMetadata, getExplorerUrl, getSolscanUrl } from '../data-access/use-token-metadata'
import { TokenBalance } from '../data-access/types'
import { cn } from '@/lib/utils'

interface TokenDetailsModalProps {
  token: TokenBalance
  isOpen: boolean
  onClose: () => void
  network?: 'mainnet' | 'devnet' | 'testnet'
}

interface CopyButtonProps {
  text: string
  label: string
  className?: string
}

function CopyButton({ text, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={cn("flex items-center space-x-2", className)}
    >
      <Copy className="h-3 w-3" />
      <span>{copied ? 'Copied!' : label}</span>
    </Button>
  )
}

function ExternalLinkButton({ href, label, icon: Icon }: { 
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
      className="flex items-center space-x-2"
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
      <ExternalLink className="h-3 w-3" />
    </Button>
  )
}

export function TokenDetailsModal({ token, isOpen, onClose, network = 'mainnet' }: TokenDetailsModalProps) {
  const { data: metadata, isLoading, error } = useTokenMetadata(token.contractAddress)

  const explorerUrl = getExplorerUrl(token.contractAddress, network)
  const solscanUrl = getSolscanUrl(token.contractAddress, network)

  const formatSupply = (supply: number) => {
    if (supply >= 1e9) return `${(supply / 1e9).toFixed(2)}B`
    if (supply >= 1e6) return `${(supply / 1e6).toFixed(2)}M`
    if (supply >= 1e3) return `${(supply / 1e3).toFixed(2)}K`
    return supply.toLocaleString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={metadata?.image || token.logoUri} alt={token.symbol} />
              <AvatarFallback>{token.symbol.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <span>{metadata?.name || token.tokenName}</span>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline">{token.symbol}</Badge>
                {metadata?.verified && (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Loading token metadata...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Failed to load token metadata</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Token Description */}
          {metadata?.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>About</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {metadata.description}
                </p>
                {metadata.tags && metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {metadata.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Token Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Token Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Your Balance</span>
                    <span className="font-medium">
                      {token.balance.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 6 
                      })} {token.symbol}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">USD Value</span>
                    <span className="font-medium">
                      ${token.usdValue.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">24h Change</span>
                    <span className={cn(
                      "font-medium",
                      token.priceChange24h >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {token.priceChange24h > 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Decimals</span>
                    <span className="font-medium">{token.decimals}</span>
                  </div>

                  {metadata?.totalSupply && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Supply</span>
                      <span className="font-medium">
                        {formatSupply(metadata.totalSupply)} {token.symbol}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Network</span>
                    <Badge variant="outline" className="capitalize">
                      Solana {network}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contract Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contract Address</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                      {token.contractAddress}
                    </code>
                    <CopyButton text={token.contractAddress} label="Copy" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <ExternalLinkButton
                    href={explorerUrl}
                    label="Solana Explorer"
                    icon={ExternalLink}
                  />
                  <ExternalLinkButton
                    href={solscanUrl}
                    label="Solscan"
                    icon={ExternalLink}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* External Links */}
          {metadata && (metadata.website || metadata.twitter || metadata.telegram) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {metadata.website && (
                    <ExternalLinkButton
                      href={metadata.website}
                      label="Website"
                      icon={Globe}
                    />
                  )}
                  {metadata.twitter && (
                    <ExternalLinkButton
                      href={metadata.twitter}
                      label="Twitter"
                      icon={Twitter}
                    />
                  )}
                  {metadata.telegram && (
                    <ExternalLinkButton
                      href={metadata.telegram}
                      label="Telegram"
                      icon={MessageCircle}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}