# GridTokenX App - AI Coding Agent Instructions

## 🏗️ Architecture Overview

**GridTokenX** is a P2P Energy Trading System with a **monorepo pnpm workspace** containing:
- **Frontend** (`frontend/`): React 18 + Vite + Gill Solana SDK - Next.js alternative in `frontend-exchange/`
- **Anchor Workspace** (`anchor/`): 5 Solana programs + Codama TypeScript code generation
- **API Gateway** (`api-gateway/`): Rust async backend with PostgreSQL, TimescaleDB, Redis
- **Docker Services**: Smart meter simulator (Python), databases, validator, nginx

**Critical Integration**: Anchor programs → (Codama codegen) → TypeScript clients → React hooks → UI

## 🎯 Program-First Development Workflow

**When adding blockchain functionality, ALWAYS start with Anchor programs:**

1. **Define instruction in Rust** (`anchor/programs/[name]/src/lib.rs`)
2. **Run code generation pipeline** (CRITICAL):
   ```bash
   pnpm run setup           # Full pipeline: keys sync → build → codegen
   # OR individual steps:
   pnpm run anchor-build    # Builds and generates IDL files
   pnpm run codama:js       # Generates TS clients from IDL
   ```
3. **Use generated helpers in React** (from `@project/anchor` imports)

**Key Files:**
- `anchor/Anchor.toml` - Program IDs, cluster config, provider settings
- `anchor/codama.js` - Codama configuration (has Gill issue workaround via `create-codama-config.js`)
- `anchor/src/gridtokenxapp-exports.ts` - Main exports: re-exports all generated clients + helpers like `getGridtokenxappProgramAccounts()`

## 🧩 Five-Program Architecture

| Program | Address | Purpose |
|---------|---------|---------|
| **energy-token** | `FaELH...6r` | ERC/token minting, REC validation |
| **governance** | `EAcyE...gb` | Proof-of-Authority voting |
| **oracle** | `G365L...gG` | AMI meter data processing |
| **registry** | `FSXdx...eJ` | Participant KYC, smart meter registration |
| **trading** | `CEWpf...oD` | P2P order matching & execution |

## 🎨 Frontend Architecture (Feature-Based)

### Directory Structure
```
frontend/src/
├── features/[feature]/           # Self-contained feature modules
│   ├── data-access/              # React Query hooks + generated client consumption
│   │   ├── use-[feature]-[action]-query.ts      # Queries
│   │   ├── use-[feature]-[action]-mutation.ts   # Mutations
│   │   └── use-[feature]-accounts-query-key.ts  # Query key generation
│   ├── ui/                       # Pure React components
│   │   └── [feature]-ui-[component].tsx
│   └── [feature]-feature.tsx      # Feature entry point (lazy-loaded)
├── components/
│   ├── app-providers.tsx          # Provider hierarchy (ReactQuery → Theme → Solana)
│   ├── app-routes.tsx             # Route definitions
│   └── solana/use-solana.ts       # Context for cluster + signer access
└── app.tsx                        # Main App entry
```

### Feature-Based Naming Conventions
- **Hooks**: `use-[feature]-[action]-[type]` e.g., `use-registry-participants-query.ts`
- **Components**: `[feature]-ui-[component]` e.g., `registry-ui-list.tsx`
- **Queries**: `use-[feature]-accounts-query-key` returns `['[feature]', 'accounts', { cluster }]`

### Transaction & Query Patterns

**Mutations (state changes):**
```typescript
export function useRegistryRegisterMutation({ account }: { account: UiWalletAccount }) {
  const signer = useWalletUiSigner({ account })
  const signAndSend = useWalletUiSignAndSend()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
      const instruction = getRegisterInstruction({ payer: signer, ...data })
      return await signAndSend(instruction, signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)  // Toast feedback
      queryClient.invalidateQueries({ queryKey: ['registry', 'accounts'] })
    }
  })
}
```

**Queries (data fetching):**
```typescript
export function useRegistryAccountsQuery() {
  const { client } = useSolana()
  const queryKey = useRegistryAccountsQueryKey()  // ['registry', 'accounts', { cluster }]
  
  return useQuery({
    queryKey,
    queryFn: () => getRegistryProgramAccounts(client.rpc),
    staleTime: 30_000,
  })
}
```

## 🔌 Solana/Web3 Integration

### Provider Hierarchy
```tsx
<ReactQueryProvider>           // Queries + mutations
  <ThemeProvider>              // Dark/light mode
    <SolanaProvider>           // Cluster context
      <WalletUiGillProvider>   // Wallet UI + Signer
        <App />
```

- **Get signer**: `const signer = useWalletUiSigner({ account })`
- **Get RPC client**: `const { client } = useSolana()` → `client.rpc`
- **Sign & send**: `const signAndSend = useWalletUiSignAndSend()`

### Authority Patterns
- **REC operations** (Renewable Energy Certificates) are **authority-only**
- Engineering Department holds REC issuing authority
- Always validate authority before minting/validating RECs

## 🐳 Docker & Multi-Service Setup

**docker-compose.yml** provides complete local stack:
- `solana-validator` - Local test validator (port 8899)
- `postgres` - Relational DB (port 5432)
- `redis` - Cache layer (port 6379)
- `contact` - Smart contract deployer (runs once)
- `smart-meter-simulator` - Python AMI simulator with weather/trading

**Minimal local dev** (no Docker):
```bash
pnpm run anchor-localnet     # Starts validator + deploys programs
cd frontend && pnpm run dev  # In another terminal
```

## 🚀 Development Commands

### Setup & Build
```bash
make setup               # Complete setup (install + build + codegen)
make setup-minimal       # Frontend + blockchain only
make build              # Build all: anchor, frontend, api-gateway
make install-all        # Install all deps
```

### Development
```bash
make dev               # Frontend dev (requires localnet running)
make dev-full          # Localnet + API + Frontend (all processes)
make localnet          # Just the validator
make localnet-clean    # Clean validator restart
```

### Testing
```bash
make test              # All tests
make test-anchor       # Anchor program tests (vitest)
pnpm run anchor-test   # Direct anchor test
```

### API Gateway
```bash
make dev-api           # Rust API server
make build-api         # Production build
# Note: SQLX_OFFLINE=true skips compile-time DB checks
```

## 📚 Key Files to Understand Architecture

1. **Backend**: `api-gateway/src/lib.rs` - AppState with db/redis/config
2. **Code Gen**: `anchor/codama.js`, `anchor/src/create-codama-config.js`
3. **Frontend Config**: `frontend/src/components/app-providers.tsx`
4. **Routes**: `frontend/src/app-routes.tsx` (all lazy-loaded features)
5. **Query Keys**: `frontend/src/features/*/data-access/*query-key.ts`
6. **Example Feature**: `frontend/src/features/registry/` (complete reference implementation)

## ⚠️ Critical Gotchas & Patterns

1. **ALWAYS run `pnpm run setup`** after modifying Anchor programs - code generation is not automatic
2. **Query invalidation by cluster** - Query keys must include `{ cluster }` to re-fetch on network switch
3. **Toast notifications** - Use `toastTx(tx)` after successful mutations for user feedback
4. **Lazy-loaded routes** - All features imported as `lazy(() => import(...))` in `app-routes.tsx`
5. **Generated clients** - Never write raw instruction builders; use `get[Action]Instruction()` from generated exports
6. **Ed25519 polyfill** - Required for browser `generateKeyPairSigner()` compatibility
7. **Workspace vs Packages** - pnpm workspace: root scripts run all packages, use `cd [dir] && cmd` for specific ones
8. **API Gateway offline mode** - Uses `SQLX_OFFLINE=true` for build without database; `.sqlx` cache tracks schema

## 🌐 Environment Configuration

Key `.env` variables (see `.env.example`):
- Program IDs (5 programs)
- Database URLs: PostgreSQL, TimescaleDB
- RPC endpoints (localnet, devnet)
- Redis connection
- Smart meter simulator config
- API gateway ports

Default local RPC: `http://127.0.0.1:8899`