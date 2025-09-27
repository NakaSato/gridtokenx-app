import { GridtokenxappAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useGridtokenxappSetMutation } from '@/features/gridtokenxapp/data-access/use-gridtokenxapp-set-mutation'

export function GridtokenxappUiButtonSet({ account, gridtokenxapp }: { account: UiWalletAccount; gridtokenxapp: GridtokenxappAccount }) {
  const setMutation = useGridtokenxappSetMutation({ account, gridtokenxapp })

  return (
    <Button
      variant="outline"
      onClick={() => {
        const value = window.prompt('Set value to:', gridtokenxapp.data.count.toString() ?? '0')
        if (!value || parseInt(value) === gridtokenxapp.data.count || isNaN(parseInt(value))) {
          return
        }
        return setMutation.mutateAsync(parseInt(value))
      }}
      disabled={setMutation.isPending}
    >
      Set
    </Button>
  )
}
