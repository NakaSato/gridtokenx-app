// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, getBase58Decoder, SolanaClient } from 'gill'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import { Gridtokenxapp, GRIDTOKENXAPP_DISCRIMINATOR, GRIDTOKENXAPP_PROGRAM_ADDRESS, getGridtokenxappDecoder } from './client/js'
import GridtokenxappIDL from '../target/idl/gridtokenxapp.json'

export type GridtokenxappAccount = Account<Gridtokenxapp, string>

// Re-export the generated IDL and type
export { GridtokenxappIDL }

export * from './client/js'

export function getGridtokenxappProgramAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getGridtokenxappDecoder(),
    filter: getBase58Decoder().decode(GRIDTOKENXAPP_DISCRIMINATOR),
    programAddress: GRIDTOKENXAPP_PROGRAM_ADDRESS,
  })
}
