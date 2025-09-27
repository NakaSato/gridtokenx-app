# GridTokenX App - AI Coding Agent Instructions

## Architecture Overview

This is a **dual-architecture project** combining:
- **Frontend**: React 18+/Vite app with TypeScript using Gill Solana SDK and Wallet UI
- **Backend**: Multi-program Anchor workspace with 5 Solana programs (energy-token, governance, oracle, registry, trading)

**Key Integration Pattern**: Anchor programs → Codama code generation → React app consumption via generated TypeScript clients.

## Essential Development Workflow

### 1. Program-First Development
Always start with Anchor programs when adding new functionality:
```bash
npm run setup  # Syncs program IDs, builds, generates TS clients
```

### 2. Code Generation Pipeline
- Anchor builds generate IDL files in `anchor/target/idl/`
- Codama (via `anchor/codama.js`) generates TypeScript clients in `anchor/src/client/js/`
- Frontend imports via `@project/anchor` alias from `anchor/src/gridtokenxapp-exports.ts`

### 3. Required Commands After Program Changes
```bash
npm run anchor-build    # Build Anchor programs
npm run codama:js      # Generate TS clients
```

## Project Structure Conventions

### Feature-Based Architecture
Each feature follows strict separation: `/src/features/[feature]/`
- `data-access/` - React Query hooks, mutations, program interactions
- `ui/` - Pure UI components specific to the feature
- `[feature]-feature.tsx` - Main feature entry point

### Naming Patterns
- **Hooks**: `use-[feature]-[action]-[type].ts` (e.g., `use-gridtokenxapp-initialize-mutation.ts`)
- **UI Components**: `[feature]-ui-[component].tsx` (e.g., `gridtokenxapp-ui-button-initialize.tsx`)
- **Program Methods**: Match Anchor instruction names exactly

## Solana/Web3 Integration Patterns

### Wallet & Provider Setup
- Uses `@wallet-ui/react` with Gill SDK integration
- Providers hierarchy: `ReactQuery` → `ThemeProvider` → `SolanaProvider` → `WalletUiGillProvider`
- Clusters: localnet (development) and devnet configured

### Transaction Pattern
Every mutation follows this structure:
```typescript
// 1. Get signer from wallet
const signer = useWalletUiSigner({ account })
const signAndSend = useWalletUiSignAndSend()

// 2. Use generated instruction helper
const instruction = getXxxInstruction({ payer: signer, /* other accounts */ })

// 3. Sign and send with toast feedback
await signAndSend(instruction, signer)
```

### Account Querying Pattern
- Use `getGridtokenxappProgramAccounts()` helper from generated exports
- All queries invalidate on cluster change via query keys: `['[program]', 'accounts', { cluster }]`

## Critical Dependencies & Integrations

### Gill SDK (Solana)
- Core Solana client and utilities
- **Note**: Local `create-codama-config.js` workaround for Gill issue #207

### Multi-Program Anchor Workspace
- 5 programs: energy-token, governance, oracle, registry, trading
- Shared workspace in `anchor/Cargo.toml` with `members = ["programs/*"]`
- Each program has independent `declare_id!()` and keypairs in `target/deploy/`

### Tailwind + Shadcn
- Components configured in `components.json` with New York style
- Custom path aliases: `@/components`, `@/lib`, `@/ui`

## Development Environment Setup

### Local Development
```bash
npm run anchor-localnet  # Starts test validator with programs deployed
npm run dev             # Starts Vite dev server
```

### Testing
```bash
npm run anchor-test     # Runs Anchor program tests
```

### Deployment to Devnet
```bash
npm run anchor deploy --provider.cluster devnet
```

## Key Files That Define Architecture

- `anchor/codama.js` - Code generation configuration
- `anchor/src/gridtokenxapp-exports.ts` - Main program exports and helpers
- `src/components/app-providers.tsx` - Provider hierarchy setup
- `src/features/*/data-access/use-*-program.ts` - Program integration patterns
- `package.json` scripts - Essential development commands

## Common Patterns to Follow

1. **Always run `npm run setup`** after program changes
2. **Use generated instruction helpers** instead of raw instruction building
3. **Follow feature/data-access/ui separation** for new features
4. **Query invalidation on cluster/transaction changes** for real-time UI updates
5. **Toast feedback** (`toastTx()`) for all transactions
6. **Ed25519 polyfill** required for browser compatibility with `generateKeyPairSigner`

When adding new programs or features, maintain the established patterns of code generation, feature separation, and React Query integration.