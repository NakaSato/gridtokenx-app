import { Button } from '@/components/ui/button'
import { UiWalletAccount } from '@wallet-ui/react'

import { useGridtokenxappInitializeMutation } from '@/features/gridtokenxapp/data-access/use-gridtokenxapp-initialize-mutation'

export function GridtokenxappUiButtonInitialize({ account }: { account: UiWalletAccount }) {
  const mutationInitialize = useGridtokenxappInitializeMutation({ account })

  return (
    <Button onClick={() => mutationInitialize.mutateAsync()} disabled={mutationInitialize.isPending}>
      Initialize Gridtokenxapp {mutationInitialize.isPending && '...'}
    </Button>
  )
}
