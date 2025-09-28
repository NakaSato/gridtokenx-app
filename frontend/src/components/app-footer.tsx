export function AppFooter() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-background/95">
      <div className="container mx-auto px-4 py-8">
       
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
