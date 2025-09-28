import { useSolana } from '@/components/solana/use-solana'
import { useQuery } from '@tanstack/react-query'

export function useRegistryParticipants() {
  const { client, cluster } = useSolana()

  return useQuery({
    queryKey: ['registry', 'participants', { cluster }],
    queryFn: async () => {
      try {
        // TODO: Replace with actual registry program accounts when registry program is complete
        // For now, return empty array as placeholder
        console.log('Fetching registry participants for cluster')
        return []
      } catch (error) {
        console.error('Failed to fetch registry participants:', error)
        return []
      }
    },
    enabled: !!client,
  })
}