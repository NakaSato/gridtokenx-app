import { GridtokenxappAccount } from '@project/anchor'
import { ellipsify, UiWalletAccount } from '@wallet-ui/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { GridtokenxappUiButtonClose } from './gridtokenxapp-ui-button-close'
import { GridtokenxappUiButtonDecrement } from './gridtokenxapp-ui-button-decrement'
import { GridtokenxappUiButtonIncrement } from './gridtokenxapp-ui-button-increment'
import { GridtokenxappUiButtonSet } from './gridtokenxapp-ui-button-set'

export function GridtokenxappUiCard({ account, gridtokenxapp }: { account: UiWalletAccount; gridtokenxapp: GridtokenxappAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gridtokenxapp: {gridtokenxapp.data.count}</CardTitle>
        <CardDescription>
          Account: <AppExplorerLink address={gridtokenxapp.address} label={ellipsify(gridtokenxapp.address)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-evenly">
          <GridtokenxappUiButtonIncrement account={account} gridtokenxapp={gridtokenxapp} />
          <GridtokenxappUiButtonSet account={account} gridtokenxapp={gridtokenxapp} />
          <GridtokenxappUiButtonDecrement account={account} gridtokenxapp={gridtokenxapp} />
          <GridtokenxappUiButtonClose account={account} gridtokenxapp={gridtokenxapp} />
        </div>
      </CardContent>
    </Card>
  )
}
