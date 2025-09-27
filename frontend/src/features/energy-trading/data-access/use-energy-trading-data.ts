import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWalletUiCluster } from '@wallet-ui/react'
import { useState } from 'react'
import type { Address } from 'gill'

// Types for Energy Trading System
export interface EnergyMeter {
  publicKey: Address
  account: {
    meterId: string
    meterType: 'Solar_Prosumer' | 'Grid_Consumer' | 'Hybrid_Prosumer' | 'Battery_Storage'
    location: string
    userType: 'Prosumer' | 'Consumer' | 'Storage_Provider'
    status: 'Active' | 'Inactive' | 'Maintenance'
    capacity: number
    lastReading: number
    totalGeneration: number
    totalConsumption: number
    owner: Address
    registrationDate: number
  }
}

export interface EnergyReading {
  timestamp: number
  meterId: string
  energyGenerated: number
  energyConsumed: number
  energyAvailableForSale: number
  energyNeededFromGrid: number
  batteryLevel: number
  surplusEnergy: number
  deficitEnergy: number
  maxSellPrice: number
  maxBuyPrice: number
  weatherCondition: string
  recEligible: boolean
  carbonOffset: number
}

export interface TradingOpportunity {
  id: string
  sellerMeter: string
  buyerMeter: string
  energyAmount: number
  suggestedPrice: number
  status: 'Available' | 'Matched' | 'Completed' | 'Cancelled'
  timestamp: number
  compatibilityScore: number
  estimatedSavings: number
}

export interface RECCertificate {
  id: string
  meterId: string
  energyGenerated: number
  carbonOffset: number
  certificationDate: number
  status: 'Pending' | 'Certified' | 'Traded' | 'Retired'
  verificationHash: string
  engineeringDeptSignature?: string
}

// Hooks for Energy Trading Data
export function useEnergyMeterProgramAccounts() {
  const cluster = useWalletUiCluster()
  
  return useQuery({
    queryKey: ['energy-meters', 'all', { cluster }],
    queryFn: async (): Promise<EnergyMeter[]> => {
      // This would typically fetch from your Solana program
      // For now, returning mock data
      return [
        {
          publicKey: 'HqjJd5CJLjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj' as Address,
          account: {
            meterId: 'AMI_METER_001',
            meterType: 'Solar_Prosumer',
            location: 'Zone_1_Building_A',
            userType: 'Prosumer',
            status: 'Active',
            capacity: 8.5,
            lastReading: Date.now() - 300000, // 5 minutes ago
            totalGeneration: 2450.75,
            totalConsumption: 1980.25,
            owner: 'OwnerPublicKeyHere' as Address,
            registrationDate: Date.now() - 86400000 * 30 // 30 days ago
          }
        },
        {
          publicKey: 'HqjJd5CJLjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjk' as Address,
          account: {
            meterId: 'AMI_METER_002',
            meterType: 'Grid_Consumer',
            location: 'Zone_2_Building_B',
            userType: 'Consumer',
            status: 'Active',
            capacity: 0,
            lastReading: Date.now() - 600000, // 10 minutes ago
            totalGeneration: 0,
            totalConsumption: 3250.80,
            owner: 'OwnerPublicKeyHere2' as Address,
            registrationDate: Date.now() - 86400000 * 45 // 45 days ago
          }
        }
      ]
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useEnergyReadings(meterId?: string) {
  const cluster = useWalletUiCluster()
  
  return useQuery({
    queryKey: ['energy-readings', meterId, { cluster }],
    queryFn: async (): Promise<EnergyReading[]> => {
      // Fetch real-time energy readings from AMI simulator
      try {
        const response = await fetch('/api/energy-readings' + (meterId ? `/${meterId}` : ''))
        if (!response.ok) {
          throw new Error('Failed to fetch energy readings')
        }
        return await response.json()
      } catch (error) {
        console.warn('Using mock energy readings:', error)
        // Return mock data for development
        return generateMockEnergyReadings(meterId)
      }
    },
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    enabled: true,
  })
}

export function useTradingOpportunities() {
  const cluster = useWalletUiCluster()
  
  return useQuery({
    queryKey: ['trading-opportunities', { cluster }],
    queryFn: async (): Promise<TradingOpportunity[]> => {
      // This would fetch from your trading analysis service
      return generateMockTradingOpportunities()
    },
    refetchInterval: 45 * 1000, // Refresh every 45 seconds
  })
}

export function useRECCertificates(meterId?: string) {
  const cluster = useWalletUiCluster()
  
  return useQuery({
    queryKey: ['rec-certificates', meterId, { cluster }],
    queryFn: async (): Promise<RECCertificate[]> => {
      // Fetch REC certificates from blockchain
      return generateMockRECCertificates(meterId)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutations for Energy Trading Actions
export function useCreateTradingOrder() {
  const queryClient = useQueryClient()
  const cluster = useWalletUiCluster()
  
  return useMutation({
    mutationFn: async (order: {
      meterId: string
      orderType: 'sell' | 'buy'
      energyAmount: number
      pricePerKwh: number
      validUntil: number
    }) => {
      // This would create an order on the blockchain
      console.log('Creating trading order:', order)
      return { success: true, orderId: 'order_' + Date.now() }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-opportunities', { cluster }] })
    },
  })
}

export function useAcceptTradingOpportunity() {
  const queryClient = useQueryClient()
  const cluster = useWalletUiCluster()
  
  return useMutation({
    mutationFn: async (opportunityId: string) => {
      // This would execute the trade on the blockchain
      console.log('Accepting trading opportunity:', opportunityId)
      return { success: true, transactionId: 'tx_' + Date.now() }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-opportunities', { cluster }] })
      queryClient.invalidateQueries({ queryKey: ['energy-meters', 'all', { cluster }] })
    },
  })
}

export function useRequestRECCertification() {
  const queryClient = useQueryClient()
  const cluster = useWalletUiCluster()
  
  return useMutation({
    mutationFn: async (request: {
      meterId: string
      energyGenerated: number
      generationPeriod: {
        start: number
        end: number
      }
    }) => {
      // This would request REC certification from the Engineering Department
      console.log('Requesting REC certification:', request)
      return { success: true, requestId: 'rec_req_' + Date.now() }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rec-certificates', { cluster }] })
    },
  })
}

// Real-time data hooks
export function useEnergyTradingWebSocket() {
  const [realTimeData] = useState<{
    energyReadings: EnergyReading[]
    tradingOpportunities: TradingOpportunity[]
    systemStats: {
      totalGeneration: number
      totalConsumption: number
      activeTraders: number
      carbonOffset: number
    }
  }>({
    energyReadings: [],
    tradingOpportunities: [],
    systemStats: {
      totalGeneration: 0,
      totalConsumption: 0,
      activeTraders: 0,
      carbonOffset: 0
    }
  })
  
  // This would establish WebSocket connection to real-time data feed
  // For now, we'll simulate with periodic updates
  
  return realTimeData
}

// Mock data generators (for development)
function generateMockEnergyReadings(meterId?: string): EnergyReading[] {
  const readings: EnergyReading[] = []
  const now = Date.now()
  
  for (let i = 0; i < 24; i++) {
    const timestamp = now - (i * 60 * 60 * 1000) // Hourly readings for 24 hours
    const isSolar = Math.random() > 0.4
    const isDaytime = new Date(timestamp).getHours() >= 6 && new Date(timestamp).getHours() <= 18
    const weatherConditions = ['Sunny', 'Partly_Cloudy', 'Cloudy', 'Overcast', 'Rainy']
    
    const energyGenerated = isSolar && isDaytime ? Math.random() * 8 + 1 : 0
    const energyConsumed = Math.random() * 4 + 1.5
    const surplusEnergy = Math.max(0, energyGenerated - energyConsumed)
    const deficitEnergy = Math.max(0, energyConsumed - energyGenerated)
    
    readings.push({
      timestamp,
      meterId: meterId || `AMI_METER_${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`,
      energyGenerated,
      energyConsumed,
      energyAvailableForSale: surplusEnergy * 0.8,
      energyNeededFromGrid: deficitEnergy,
      batteryLevel: Math.random() * 100,
      surplusEnergy,
      deficitEnergy,
      maxSellPrice: 0.15 + Math.random() * 0.2,
      maxBuyPrice: 0.20 + Math.random() * 0.2,
      weatherCondition: weatherConditions[Math.floor(Math.random() * weatherConditions.length)],
      recEligible: isSolar && energyGenerated > 0,
      carbonOffset: energyGenerated * 0.7
    })
  }
  
  return readings.reverse() // Most recent first
}

function generateMockTradingOpportunities(): TradingOpportunity[] {
  const opportunities: TradingOpportunity[] = []
  
  for (let i = 0; i < 15; i++) {
    const energyAmount = Math.random() * 10 + 0.5
    const suggestedPrice = 0.18 + Math.random() * 0.15
    
    opportunities.push({
      id: `opp_${Date.now()}_${i}`,
      sellerMeter: `AMI_METER_${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
      buyerMeter: `AMI_METER_${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
      energyAmount,
      suggestedPrice,
      status: Math.random() > 0.7 ? 'Matched' : 'Available',
      timestamp: Date.now() - Math.random() * 3600 * 1000,
      compatibilityScore: Math.random() * 0.4 + 0.6,
      estimatedSavings: energyAmount * (0.28 - suggestedPrice)
    })
  }
  
  return opportunities.sort((a, b) => b.compatibilityScore - a.compatibilityScore)
}

function generateMockRECCertificates(meterId?: string): RECCertificate[] {
  const certificates: RECCertificate[] = []
  
  for (let i = 0; i < 8; i++) {
    const energyGenerated = Math.random() * 50 + 10
    
    certificates.push({
      id: `REC_${Date.now()}_${i}`,
      meterId: meterId || `AMI_METER_${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
      energyGenerated,
      carbonOffset: energyGenerated * 0.7,
      certificationDate: Date.now() - Math.random() * 86400 * 7 * 1000, // Within last week
      status: ['Pending', 'Certified', 'Traded'][Math.floor(Math.random() * 3)] as RECCertificate['status'],
      verificationHash: `0x${Math.random().toString(16).substr(2, 40)}`,
      engineeringDeptSignature: Math.random() > 0.3 ? `eng_sig_${Date.now()}` : undefined
    })
  }
  
  return certificates.sort((a, b) => b.certificationDate - a.certificationDate)
}