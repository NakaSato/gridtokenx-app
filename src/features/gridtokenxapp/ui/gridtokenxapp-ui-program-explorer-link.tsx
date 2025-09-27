import { GRIDTOKENXAPP_PROGRAM_ADDRESS } from '@project/anchor'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { ellipsify } from '@wallet-ui/react'

export function GridtokenxappUiProgramExplorerLink() {
  return <AppExplorerLink address={GRIDTOKENXAPP_PROGRAM_ADDRESS} label={ellipsify(GRIDTOKENXAPP_PROGRAM_ADDRESS)} />
}
