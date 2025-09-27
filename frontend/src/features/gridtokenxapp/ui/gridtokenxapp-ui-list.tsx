import { GridtokenxappUiCard } from './gridtokenxapp-ui-card'
import { useGridtokenxappAccountsQuery } from '@/features/gridtokenxapp/data-access/use-gridtokenxapp-accounts-query'
import { UiWalletAccount } from '@wallet-ui/react'

export function GridtokenxappUiList({ account }: { account: UiWalletAccount }) {
  const gridtokenxappAccountsQuery = useGridtokenxappAccountsQuery()

  if (gridtokenxappAccountsQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!gridtokenxappAccountsQuery.data?.length) {
    return (
      <div className="text-center">
        <h2 className={'text-2xl'}>No accounts</h2>
        No accounts found. Initialize one to get started.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {gridtokenxappAccountsQuery.data?.map((gridtokenxapp) => (
        <GridtokenxappUiCard account={account} key={gridtokenxapp.address} gridtokenxapp={gridtokenxapp} />
      ))}
    </div>
  )
}
