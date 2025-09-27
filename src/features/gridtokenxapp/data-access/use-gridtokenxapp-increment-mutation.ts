import { GridtokenxappAccount, getIncrementInstruction } from '@project/anchor'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { useMutation } from '@tanstack/react-query'
import { toastTx } from '@/components/toast-tx'
import { useGridtokenxappAccountsInvalidate } from './use-gridtokenxapp-accounts-invalidate'

export function useGridtokenxappIncrementMutation({
  account,
  gridtokenxapp,
}: {
  account: UiWalletAccount
  gridtokenxapp: GridtokenxappAccount
}) {
  const invalidateAccounts = useGridtokenxappAccountsInvalidate()
  const signAndSend = useWalletUiSignAndSend()
  const signer = useWalletUiSigner({ account })

  return useMutation({
    mutationFn: async () => await signAndSend(getIncrementInstruction({ gridtokenxapp: gridtokenxapp.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}
