# GridTokenX Frontend

## 🌐 P2P Energy Trading Dashboard

This is the React-based frontend for the GridTokenX P2P energy trading system, built with Vite, TypeScript, and Tailwind CSS.

### 🚀 Features

- **🏛️ PoA Governance Dashboard**: Real-time governance status and controls
- **⚡ Energy Trading Interface**: P2P energy trading marketplace
- **🔋 ERC Certificate Management**: Energy Renewable Certificate tracking
- **📊 Analytics Dashboard**: Trading analytics and system monitoring
- **🔐 Wallet Integration**: Solana wallet connectivity with Gill SDK
- **🎨 Modern UI**: Responsive design with shadcn/ui components

### 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── account/        # Account-related components
│   │   ├── ui/             # shadcn/ui components
│   │   └── ...
│   ├── features/           # Feature-based modules
│   │   ├── energy-trading/ # Energy trading functionality
│   │   ├── governance/     # PoA governance interface
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── ...
├── public/                 # Static assets
├── index.html             # Main HTML template
├── vite.config.ts         # Vite configuration
└── package.json           # Frontend dependencies
```

### 🛠️ Development

#### Prerequisites
- Node.js 18+
- pnpm
- Running Solana validator (localnet)

#### Setup
```bash
# Install dependencies
cd frontend
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

#### Available Scripts
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint
- `pnpm run format` - Format code with Prettier

### 🔗 Integration

The frontend integrates with:
- **Anchor Programs**: Via generated TypeScript clients
- **Solana Blockchain**: Through Gill SDK
- **Wallet Providers**: Multiple wallet adapters
- **Backend APIs**: REST API for off-chain data

### 🎯 Key Components

#### Governance Dashboard (`/governance`)
- Real-time PoA governance status
- Emergency pause/unpause controls
- ERC certificate management
- Authority information display

#### Energy Trading (`/trading`)
- P2P energy marketplace
- Order placement and matching
- Trading history and analytics
- Real-time price updates

#### Analytics Dashboard (`/analytics`)
- System performance metrics
- Trading volume statistics
- Energy production/consumption data
- Certificate issuance tracking

### 🔧 Configuration

Environment variables are inherited from the root `.env` file:
- `VITE_CLUSTER` - Solana cluster (localnet/devnet)
- `VITE_RPC_URL` - Solana RPC endpoint
- API endpoints and keys

### 🎨 UI/UX

Built with:
- **React 19** - Latest React features
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - High-quality components
- **Radix UI** - Accessible primitives
- **Lucide React** - Beautiful icons

### 📱 Responsive Design

Optimized for:
- Desktop (1920x1080+)
- Tablet (768px-1024px)
- Mobile (320px-768px)

### 🚀 Performance

- **Code Splitting** - Route-based lazy loading
- **Tree Shaking** - Unused code elimination
- **Asset Optimization** - Image and bundle optimization
- **Caching** - React Query for data caching

### 🔒 Security

- **Wallet Security** - Secure key management
- **Input Validation** - Client-side validation
- **HTTPS Only** - Secure connections
- **CSP Headers** - Content Security Policy

### 🌐 Deployment

The frontend can be deployed to:
- **Vercel** - Automatic deployments
- **Netlify** - JAMstack hosting
- **Docker** - Containerized deployment
- **Static Hosting** - Any static file server

### 📚 Development Guidelines

- Follow React best practices
- Use TypeScript for type safety
- Implement error boundaries
- Write accessible components
- Maintain consistent styling
- Add comprehensive tests