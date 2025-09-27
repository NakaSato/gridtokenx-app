import { GridtokenxappAccount, getSetInstruction } from '@project/anchor'
import { useMutation } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { toastTx } from '@/components/toast-tx'
import { useGridtokenxappAccountsInvalidate } from './use-gridtokenxapp-accounts-invalidate'

export function useGridtokenxappSetMutation({ account, gridtokenxapp }: { account: UiWalletAccount; gridtokenxapp: GridtokenxappAccount }) {
  const invalidateAccounts = useGridtokenxappAccountsInvalidate()
  const signAndSend = useWalletUiSignAndSend()
  const signer = useWalletUiSigner({ account })

  return useMutation({
    mutationFn: async (value: number) =>
      await signAndSend(
        getSetInstruction({
          gridtokenxapp: gridtokenxapp.address,
          value,
        }),
        signer,
      ),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}
