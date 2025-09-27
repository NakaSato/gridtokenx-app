import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWalletUiCluster } from '@wallet-ui/react'
import { useSolana } from '@/components/solana/use-solana'
import { useToast } from '@/hooks/use-toast'
import type { Address } from 'gill'

// Governance interfaces
export interface RecValidatorInfo {
  pubkey: string
  authorityName: string
  certificationAuthority: boolean
  active: boolean
  addedAt: number
}

export interface PoAConfig {
  universityAuthority: string
  authorizedRecValidators: RecValidatorInfo[]
  minRecValidators: number
  emergencyPaused: boolean
  createdAt: number
}

export interface GovernanceData extends PoAConfig {
  programId: string
  configPda: string
}

// Mock data generator for development
function generateMockGovernanceData(): GovernanceData {
  return {
    programId: "EAcyEzfXXJCDnjZKUrgHsBEEHmnozZJXKs2wdW3xnWgb",
    configPda: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    universityAuthority: "4rL4RCWHz3iNCdCaveD8KcHfV9YWGsqSHFPo7X2zBNx",
    emergencyPaused: false,
    minRecValidators: 2,
    createdAt: Math.floor(Date.now() / 1000) - 86400, // Yesterday
    authorizedRecValidators: [
      {
        pubkey: "8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR",
        authorityName: "University Sustainability Office",
        certificationAuthority: true,
        active: true,
        addedAt: Math.floor(Date.now() / 1000) - 86400,
      },
      {
        pubkey: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
        authorityName: "University Engineering Department",
        certificationAuthority: true,
        active: true,
        addedAt: Math.floor(Date.now() / 1000) - 86400,
      },
      {
        pubkey: "CenYq6bDRB4qtOBkVJ5kJh5ZkRCzfXt9A7AwuCNZWoRh",
        authorityName: "University Facilities Management",
        certificationAuthority: true,
        active: true,
        addedAt: Math.floor(Date.now() / 1000) - 86400,
      },
      {
        pubkey: "D1s4HL5S7rXBQqFBdz8QtFn9qQnFRsYdTqfyxGPQr9A",
        authorityName: "University IT Department",
        certificationAuthority: false,
        active: false,
        addedAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      },
    ]
  }
}

// Hook to fetch governance configuration
export function useGovernanceConfig() {
  const cluster = useWalletUiCluster()
  
  return useQuery({
    queryKey: ['governance-config', { cluster }],
    queryFn: async (): Promise<GovernanceData | null> => {
      try {
        // This would normally fetch from the blockchain
        // For now, using mock data for development
        const response = await fetch('/api/governance/config')
        if (!response.ok && response.status !== 404) {
          throw new Error('Failed to fetch governance config')
        }
        
        if (response.status === 404) {
          // Return null if not initialized
          return null
        }
        
        return await response.json()
      } catch (error) {
        console.warn('Using mock governance data for development:', error)
        // Return mock data for development
        return generateMockGovernanceData()
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  })
}

// Hook for governance data with mutations
export function useGovernanceData() {
  const cluster = useWalletUiCluster()
  const { account } = useSolana()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const governanceQuery = useGovernanceConfig()
  
  // Emergency pause mutation
  const emergencyPauseMutation = useMutation({
    mutationFn: async () => {
      // This would call the actual blockchain transaction
      console.log('Emergency pause initiated by:', account?.publicKey)
      
      // Simulate API call
      const response = await fetch('/api/governance/emergency-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          authority: account?.publicKey,
          action: 'pause'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to activate emergency pause')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      toast.success('Emergency pause activated', {
        description: 'All energy trading operations have been paused'
      })
      queryClient.invalidateQueries({ queryKey: ['governance-config', { cluster }] })
    },
    onError: (error) => {
      toast.error('Failed to activate emergency pause', {
        description: error.message
      })
    }
  })
  
  // Emergency unpause mutation  
  const emergencyUnpauseMutation = useMutation({
    mutationFn: async () => {
      console.log('Emergency unpause initiated by:', account?.publicKey)
      
      // Simulate API call
      const response = await fetch('/api/governance/emergency-unpause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authority: account?.publicKey,
          action: 'unpause'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to deactivate emergency pause')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      toast.success('Emergency pause deactivated', {
        description: 'Energy trading operations have been restored'
      })
      queryClient.invalidateQueries({ queryKey: ['governance-config', { cluster }] })
    },
    onError: (error) => {
      toast.error('Failed to deactivate emergency pause', {
        description: error.message
      })
    }
  })
  
  // Add validator mutation
  const addValidatorMutation = useMutation({
    mutationFn: async (params: { 
      validatorPubkey: string
      authorityName: string 
    }) => {
      console.log('Adding validator:', params)
      
      const response = await fetch('/api/governance/add-validator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authority: account?.publicKey,
          validatorPubkey: params.validatorPubkey,
          authorityName: params.authorityName
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add validator')
      }
      
      return await response.json()
    },
    onSuccess: (data, variables) => {
      toast.success('Validator added successfully', {
        description: `${variables.authorityName} has been added as a REC validator`
      })
      queryClient.invalidateQueries({ queryKey: ['governance-config', { cluster }] })
    },
    onError: (error) => {
      toast.error('Failed to add validator', {
        description: error.message
      })
    }
  })
  
  // Remove validator mutation
  const removeValidatorMutation = useMutation({
    mutationFn: async (validatorPubkey: string) => {
      console.log('Removing validator:', validatorPubkey)
      
      const response = await fetch('/api/governance/remove-validator', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authority: account?.publicKey,
          validatorPubkey
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to remove validator')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      toast.success('Validator removed successfully')
      queryClient.invalidateQueries({ queryKey: ['governance-config', { cluster }] })
    },
    onError: (error) => {
      toast.error('Failed to remove validator', {
        description: error.message
      })
    }
  })
  
  // Activate validator mutation
  const activateValidatorMutation = useMutation({
    mutationFn: async (validatorPubkey: string) => {
      console.log('Activating validator:', validatorPubkey)
      
      const response = await fetch('/api/governance/activate-validator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authority: account?.publicKey,
          validatorPubkey
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to activate validator')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      toast.success('Validator activated successfully')
      queryClient.invalidateQueries({ queryKey: ['governance-config', { cluster }] })
    },
    onError: (error) => {
      toast.error('Failed to activate validator', {
        description: error.message
      })
    }
  })
  
  // Deactivate validator mutation
  const deactivateValidatorMutation = useMutation({
    mutationFn: async (validatorPubkey: string) => {
      console.log('Deactivating validator:', validatorPubkey)
      
      const response = await fetch('/api/governance/deactivate-validator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authority: account?.publicKey,
          validatorPubkey
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to deactivate validator')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      toast.success('Validator deactivated successfully')
      queryClient.invalidateQueries({ queryKey: ['governance-config', { cluster }] })
    },
    onError: (error) => {
      toast.error('Failed to deactivate validator', {
        description: error.message
      })
    }
  })

  return {
    data: governanceQuery.data,
    isLoading: governanceQuery.isLoading,
    error: governanceQuery.error,
    emergencyPauseMutation,
    emergencyUnpauseMutation,
    addValidatorMutation,
    removeValidatorMutation,
    activateValidatorMutation,
    deactivateValidatorMutation,
  }
}

// Hook to check if current user is university authority
export function useIsUniversityAuthority() {
  const { account } = useSolana()
  const { data: governance } = useGovernanceConfig()
  
  return account && governance && account.publicKey === governance.universityAuthority
}

// Hook to get validator status
export function useValidatorStatus(validatorPubkey?: string) {
  const { data: governance } = useGovernanceConfig()
  
  if (!validatorPubkey || !governance) {
    return null
  }
  
  return governance.authorizedRecValidators.find(v => v.pubkey === validatorPubkey) || null
}