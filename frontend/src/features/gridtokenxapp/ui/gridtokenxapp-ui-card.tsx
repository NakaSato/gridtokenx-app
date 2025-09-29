import { GridtokenxappAccount } from '@project/anchor'
import { ellipsify } from '@wallet-ui/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppExplorerLink } from '@/components/app-explorer-link'
// import { GridtokenxappUiButtonClose } from './gridtokenxapp-ui-button-close'
// import { GridtokenxappUiButtonDecrement } from './gridtokenxapp-ui-button-decrement'
// import { GridtokenxappUiButtonIncrement } from './gridtokenxapp-ui-button-increment'
// import { GridtokenxappUiButtonSet } from './gridtokenxapp-ui-button-set'

export function GridtokenxappUiCard({ gridtokenxapp }: { gridtokenxapp: GridtokenxappAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Token</CardTitle>
        <CardDescription>
          Account: <AppExplorerLink address={gridtokenxapp.address} label={ellipsify(gridtokenxapp.address)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Authority:</strong> {ellipsify(gridtokenxapp.data.authority)}</p>
          <p><strong>Mint:</strong> {ellipsify(gridtokenxapp.data.mint)}</p>
          <p><strong>Total Supply:</strong> {gridtokenxapp.data.totalSupply.toString()}</p>
          <p><strong>Created At:</strong> {new Date(Number(gridtokenxapp.data.createdAt) * 1000).toLocaleString()}</p>
        </div>
        {/* <div className="flex gap-4 justify-evenly">
          <GridtokenxappUiButtonIncrement account={account} gridtokenxapp={gridtokenxapp} />
          <GridtokenxappUiButtonSet account={account} gridtokenxapp={gridtokenxapp} />
          <GridtokenxappUiButtonDecrement account={account} gridtokenxapp={gridtokenxapp} />
        </div> */}
      </CardContent>
    </Card>
  )
}
