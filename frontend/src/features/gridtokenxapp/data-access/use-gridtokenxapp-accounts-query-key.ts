import { useSolana } from '@/components/solana/use-solana'

export function useGridtokenxappAccountsQueryKey() {
  const { cluster } = useSolana()

  return ['gridtokenxapp', 'accounts', { cluster }]
}
