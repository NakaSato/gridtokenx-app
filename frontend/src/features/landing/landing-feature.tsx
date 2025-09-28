import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppHero } from '@/components/app-hero.tsx'
import { 
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { Link } from 'react-router'

export default function LandingFeature() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <AppHero
        title={
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              GridTokenX
            </h1>
            <div className="flex justify-center gap-2 mt-4">
              <Badge variant="outline" className="text-sm">
                Solana Blockchain
              </Badge>
              <Badge variant="outline" className="text-sm">
                P2P Energy Trading
              </Badge>
            </div>
          </div>
        }
        subtitle={
          <div className="space-y-6">
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Revolutionizing energy trading through decentralized peer-to-peer transactions. 
              Trade renewable energy certificates (RECs) and participate in sustainable energy markets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/energy-trading">
                  Start Trading <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/registry">
                  Join Registry
                </Link>
              </Button>
            </div>
          </div>
        }
      />

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose GridTokenX?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built on Solana blockchain for fast, secure, and cost-effective energy trading
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  Lightning Fast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Execute energy trades in seconds with Solana's high-performance blockchain
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  Secure & Transparent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  All transactions are recorded on-chain with full transparency and security
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-green-600 dark:text-green-400">
                  Peer-to-Peer Trading
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Direct trading between prosumers and consumers without intermediaries
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  Fair Market Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Dynamic pricing based on supply and demand with transparent market mechanisms
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  Renewable Energy Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Trade Renewable Energy Certificates (RECs) and promote sustainable solar, wind, and clean energy
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-cyan-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                  Sustainable & Circular
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Support circular economy principles with renewable energy trading and green certificates
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">
              Simple steps to start trading energy on the blockchain
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Register</h3>
              <p className="text-muted-foreground">
                Join the registry as a prosumer, consumer, or grid operator
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Meter</h3>
              <p className="text-muted-foreground">
                Link your smart meter to track energy production and consumption
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Trading</h3>
              <p className="text-muted-foreground">
                Buy or sell energy directly with other participants
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join the Energy Revolution?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect your wallet and start participating in the decentralized energy marketplace today
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/account">
                Connect Wallet <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/governance">
                Learn About Governance
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex justify-center items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Decentralized</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Sustainable</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Transparent</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}