// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, getBase58Decoder, SolanaClient } from 'gill'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import { TokenInfo, TOKEN_INFO_DISCRIMINATOR, ENERGY_TOKEN_PROGRAM_ADDRESS, getTokenInfoDecoder } from './client/js'
import EnergyTokenIDL from './energy_token.json'

// Alias for backwards compatibility
export const GRIDTOKENXAPP_PROGRAM_ADDRESS = ENERGY_TOKEN_PROGRAM_ADDRESS

// System Program addresses
export const SYSTEM_PROGRAM_ADDRESS = '11111111111111111111111111111111' as const
export const TOKEN_PROGRAM_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as const
export const ASSOCIATED_TOKEN_PROGRAM_ADDRESS = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as const
export const RENT_PROGRAM_ADDRESS = 'SysvarRent111111111111111111111111111111111' as const

export type EnergyTokenAccount = Account<TokenInfo, string>

// Alias for backwards compatibility
export type GridtokenxappAccount = EnergyTokenAccount

// Re-export the generated IDL and type
export { EnergyTokenIDL }
// For backwards compatibility
export { EnergyTokenIDL as GridtokenxappIDL }

export * from './client/js'

export function getGridtokenxappProgramAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getTokenInfoDecoder(),
    filter: getBase58Decoder().decode(TOKEN_INFO_DISCRIMINATOR),
    programAddress: ENERGY_TOKEN_PROGRAM_ADDRESS,
  })
}
