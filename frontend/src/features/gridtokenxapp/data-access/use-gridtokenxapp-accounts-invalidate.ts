import { useQueryClient } from '@tanstack/react-query'
import { useGridtokenxappAccountsQueryKey } from './use-gridtokenxapp-accounts-query-key'

export function useGridtokenxappAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = useGridtokenxappAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}
