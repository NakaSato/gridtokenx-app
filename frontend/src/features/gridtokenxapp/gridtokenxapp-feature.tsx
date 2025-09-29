import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { GridtokenxappUiButtonInitialize } from './ui/gridtokenxapp-ui-button-initialize'
import { GridtokenxappUiList } from './ui/gridtokenxapp-ui-list'
import { GridtokenxappUiProgramExplorerLink } from './ui/gridtokenxapp-ui-program-explorer-link'
import { GridtokenxappUiProgramGuard } from './ui/gridtokenxapp-ui-program-guard'

export default function GridtokenxappFeature() {
  const { account } = useSolana()

  return (
    <GridtokenxappUiProgramGuard>
      <AppHero
        title="Gridtokenxapp"
        subtitle={
          account
            ? "Initialize a new gridtokenxapp onchain by clicking the button. Use the program's methods (increment, decrement, set, and close) to change the state of the account."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <GridtokenxappUiProgramExplorerLink />
        </p>
        {account ? (
          <GridtokenxappUiButtonInitialize account={account} />
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletDropdown />
          </div>
        )}
      </AppHero>
      {account ? <GridtokenxappUiList /> : null}
    </GridtokenxappUiProgramGuard>
  )
}
