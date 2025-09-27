import { useSolana } from '@/components/solana/use-solana'
import { useQuery } from '@tanstack/react-query'
import { getGridtokenxappProgramAccounts } from '@project/anchor'
import { useGridtokenxappAccountsQueryKey } from './use-gridtokenxapp-accounts-query-key'

export function useGridtokenxappAccountsQuery() {
  const { client } = useSolana()

  return useQuery({
    queryKey: useGridtokenxappAccountsQueryKey(),
    queryFn: async () => await getGridtokenxappProgramAccounts(client.rpc),
  })
}
