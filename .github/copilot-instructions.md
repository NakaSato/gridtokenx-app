# GridTokenX App - AI Coding Agent Instructions

## Architecture Overview

This is a **P2P Energy Trading System** with dual-architecture:
- **Frontend**: React 18+/Vite app with TypeScript using Gill Solana SDK and Wallet UI
- **Backend**: Multi-program Anchor workspace with 5 Solana programs for comprehensive energy trading

**Key Integration Pattern**: Anchor programs → Codama code generation → React app consumption via generated TypeScript clients.

## Essential Development Workflow

### 1. Program-First Development
Always start with Anchor programs when adding new functionality:
```bash
npm run setup  # Syncs program IDs, builds, generates TS clients (CRITICAL after program changes)
```

### 2. Code Generation Pipeline
- Anchor builds generate IDL files in `anchor/target/idl/`
- Codama (via `anchor/codama.js`) generates TypeScript clients in `anchor/src/client/js/`
- Frontend imports via `@project/anchor` alias from `anchor/src/gridtokenxapp-exports.ts`
- **Note**: Local `create-codama-config.js` workaround for Gill issue #207

### 3. Required Commands After Program Changes
```bash
npm run anchor-build    # Build Anchor programs
npm run codama:js      # Generate TS clients
npm run setup          # Complete pipeline (preferred)
```

## Multi-Program Architecture (P2P Energy Trading)

### 5 Core Programs:
1. **energy-token** (`FaELH72fUMRaLTX3ersmQLr4purfHGvJccm1BXfDPL6r`) - Token management, REC validation
2. **governance** (`EAcyEzfXXJCDnjZKUrgHsBEEHmnozZJXKs2wdW3xnWgb`) - Proof-of-Authority governance
3. **oracle** (`G365L8A4Y3xmp5aN2GGLj2SJr5KetgE5F57PaFvCgSgG`) - AMI data processing, REC authority validation
4. **registry** (`FSXdxk5uPUvJc51MzjtBaCDrFh7RSMcHFHKpzCG9LeuJ`) - Participant registration, smart meter management
5. **trading** (`CEWpf4Rvm3SU2zQgwsQpi5EMYBUrWbKLcAhAT2ouVoWD`) - P2P energy trading, order matching

### Smart Meter Integration
- Simulator located in `docker/smart-meter-simulator/`
- Python-based with weather simulation and prosumer/consumer capabilities
- Grid operator manages meters for consumer/prosumer roles

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

## Development Environment Setup

### Local Development (Verified Working)
```bash
npm run anchor-localnet  # Starts test validator at http://127.0.0.1:8899
npm run dev             # Starts Vite dev server
```

### Testing & Validation
```bash
npm run anchor-test     # Runs Anchor program tests
npm run anchor-build    # Verify build success
```

### REC Authority Validation
- REC (Renewable Energy Certificate) operations are authority-only
- Engineering Department has REC issuing authority
- Authority validation required for REC operations

## Key Files That Define Architecture

- `anchor/Anchor.toml` - Program IDs and cluster configuration
- `anchor/codama.js` - Code generation configuration
- `anchor/src/gridtokenxapp-exports.ts` - Main program exports and helpers
- `src/components/app-providers.tsx` - Provider hierarchy setup
- `.env.example` - Complete environment configuration template
- `docker/smart-meter-simulator/` - Smart meter simulation system

## Critical Development Patterns

1. **Always run `npm run setup`** after program changes (syncs IDs, builds, generates clients)
2. **Use generated instruction helpers** instead of raw instruction building
3. **Follow feature/data-access/ui separation** for new features
4. **Query invalidation on cluster/transaction changes** for real-time UI updates
5. **Toast feedback** (`toastTx()`) for all transactions
6. **Ed25519 polyfill** required for browser compatibility with `generateKeyPairSigner`
7. **Authority-only operations** for REC validation and issuance

## Environment Configuration

The system supports comprehensive configuration via `.env.example`:
- Program IDs for all 5 programs
- Database connections (PostgreSQL, TimescaleDB)
- Message queues (Redis, Kafka)
- Smart meter simulation parameters
- API gateway settings (Node.js and Rust)
- REC authority validation settings

When adding new programs or features, maintain the established patterns of code generation, feature separation, and React Query integration.