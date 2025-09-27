import { useSolana } from '@/components/solana/use-solana'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { getInitializeInstruction } from '@project/anchor'
import { toastTx } from '@/components/toast-tx'
import { toast } from 'sonner'

// Temporary example using gridtokenxapp until registry program codegen is complete
// This demonstrates the interaction pattern for P2P energy trading programs
export function useRegistryRegisterUserMutation({ account }: { account: UiWalletAccount }) {
  const { cluster } = useSolana()
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner({ account })
  const signAndSend = useWalletUiSignAndSend()

  return useMutation({
    mutationFn: async ({ userType, location }: { userType: 'Prosumer' | 'Consumer'; location: string }) => {
      // TODO: Replace with actual registry instruction when codegen is updated
      // const instruction = getRegisterUserInstruction({
      //   userAuthority: signer,
      //   userType,
      //   location,
      // })
      
      // For now, use the gridtokenxapp initialize as an example
      console.log('Registering user:', { userType, location })
      const { generateKeyPairSigner } = await import('gill')
      const gridtokenxapp = await generateKeyPairSigner()
      const instruction = getInitializeInstruction({ payer: signer, gridtokenxapp })

      return { tx: await signAndSend(instruction, signer), userType, location }
    },
    onSuccess: async ({ tx, userType, location }) => {
      toastTx(tx)
      await queryClient.invalidateQueries({ 
        queryKey: ['registry', 'accounts', { cluster }] 
      })
      toast.success(`User registered as ${userType} at ${location}`)
    },
    onError: (error) => {
      console.error('Registration failed:', error)
      toast.error('Failed to register user')
    },
  })
}