import { GridtokenxappAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'
import { useGridtokenxappIncrementMutation } from '../data-access/use-gridtokenxapp-increment-mutation'

export function GridtokenxappUiButtonIncrement({ account, gridtokenxapp }: { account: UiWalletAccount; gridtokenxapp: GridtokenxappAccount }) {
  const incrementMutation = useGridtokenxappIncrementMutation({ account, gridtokenxapp })

  return (
    <Button variant="outline" onClick={() => incrementMutation.mutateAsync()} disabled={incrementMutation.isPending}>
      Increment
    </Button>
  )
}
