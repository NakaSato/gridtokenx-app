import { GridtokenxappAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useGridtokenxappDecrementMutation } from '../data-access/use-gridtokenxapp-decrement-mutation'

export function GridtokenxappUiButtonDecrement({ account, gridtokenxapp }: { account: UiWalletAccount; gridtokenxapp: GridtokenxappAccount }) {
  const decrementMutation = useGridtokenxappDecrementMutation({ account, gridtokenxapp })

  return (
    <Button variant="outline" onClick={() => decrementMutation.mutateAsync()} disabled={decrementMutation.isPending}>
      Decrement
    </Button>
  )
}
