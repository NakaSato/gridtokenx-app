// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, getBase58Decoder, SolanaClient } from 'gill'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import { TokenInfo, TOKEN_INFO_DISCRIMINATOR, ENERGY_TOKEN_PROGRAM_ADDRESS, getTokenInfoDecoder } from './client/js'
import EnergyTokenIDL from '../target/idl/energy_token.json'

export type EnergyTokenAccount = Account<TokenInfo, string>

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
