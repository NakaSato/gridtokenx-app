import { Badge } from './ui/badge'

export function AppFooter() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">GridTokenX</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Peer-to-peer energy trading platform powered by Solana blockchain technology.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Solana
              </Badge>
              <Badge variant="outline" className="text-xs">
                P2P Energy
              </Badge>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/energy-trading" className="hover:text-foreground transition-colors">Energy Trading</a></li>
              <li><a href="/governance" className="hover:text-foreground transition-colors">Governance</a></li>
              <li><a href="/registry" className="hover:text-foreground transition-colors">Registry</a></li>
              <li><a href="/account" className="hover:text-foreground transition-colors">My Account</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/docs" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="/api" className="hover:text-foreground transition-colors">API Reference</a></li>
              <li><a href="/whitepaper" className="hover:text-foreground transition-colors">Whitepaper</a></li>
              <li><a href="/support" className="hover:text-foreground transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://github.com/NakaSato/gridtokenx-app" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
              <li><a href="https://discord.gg/gridtokenx" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Discord</a></li>
              <li><a href="https://twitter.com/gridtokenx" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Twitter</a></li>
              <li><a href="/blog" className="hover:text-foreground transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground">
            © {currentYear} GridTokenX. All rights reserved.
          </p>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <span className="text-xs text-muted-foreground">
              Built on Solana
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
