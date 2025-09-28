import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NetworkStatus } from '../network-status'
import * as useNetworkStatusModule from '../../data-access/use-network-status'
import * as walletUiModule from '@wallet-ui/react'

// Mock the wallet UI hooks
const mockSetCluster = vi.fn()
const mockRefetch = vi.fn()

const mockWalletUi = {
  cluster: { id: 'devnet', label: 'Devnet' },
  connection: { endpoint: 'https://api.devnet.solana.com' }
}

const mockWalletUiCluster = {
  clusters: [
    { id: 'mainnet-beta', label: 'Mainnet' },
    { id: 'devnet', label: 'Devnet' },
    { id: 'testnet', label: 'Testnet' }
  ],
  setCluster: mockSetCluster
}

const mockNetworkStatus = {
  info: {
    network: 'devnet' as const,
    blockHeight: 245678901,
    gasPrice: 5000,
    transactionThroughput: 2847,
    networkCongestion: 'low' as const,
    lastBlockTime: Date.now() - 400,
    epochInfo: {
      epoch: 512,
      slotIndex: 123456,
      slotsInEpoch: 432000
    },
    validators: {
      total: 1200,
      active: 1185
    }
  },
  health: {
    uptime: 99.97,
    averageBlockTime: 400,
    transactionSuccessRate: 98.5,
    networkCapacity: 87.3
  },
  connectionStatus: 'connected' as const,
  lastUpdated: Date.now()
}

const mockNetworkStatusQuery = {
  data: mockNetworkStatus,
  isLoading: false,
  error: null,
  refetch: mockRefetch
}

const mockNetworkHealth = {
  ...mockNetworkStatusQuery,
  isHealthy: true,
  isCongested: false,
  isConnected: true
}

vi.mock('@wallet-ui/react', () => ({
  useWalletUi: vi.fn(() => mockWalletUi),
  useWalletUiCluster: vi.fn(() => mockWalletUiCluster)
}))

vi.mock('../../data-access/use-network-status', () => ({
  useNetworkStatus: vi.fn(() => mockNetworkStatusQuery),
  useNetworkHealth: vi.fn(() => mockNetworkHealth)
}))

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('NetworkStatus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders network status information correctly', () => {
    render(
      <TestWrapper>
        <NetworkStatus />
      </TestWrapper>
    )

    expect(screen.getByText('Network Status')).toBeInTheDocument()
    expect(screen.getByText('Devnet')).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByText('245M')).toBeInTheDocument() // Block height formatted
    expect(screen.getByText('2.8K')).toBeInTheDocument() // TPS formatted
    expect(screen.getByText('LOW')).toBeInTheDocument() // Congestion level
  })

  it('shows loading state correctly', () => {
    (useNetworkStatusModule.useNetworkStatus as Mock).mockReturnValue({
      ...mockNetworkStatusQuery,
      isLoading: true,
      data: undefined
    })

    render(
      <TestWrapper>
        <NetworkStatus />
      </TestWrapper>
    )

    expect(screen.getByText('Network Status')).toBeInTheDocument()
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows error state correctly', () => {
    (useNetworkStatusModule.useNetworkStatus as Mock).mockReturnValue({
      ...mockNetworkStatusQuery,
      error: new Error('Network error'),
      data: undefined
    })

    render(
      <TestWrapper>
        <NetworkStatus />
      </TestWrapper>
    )

    expect(screen.getByText('Failed to load network information')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('handles network switching correctly', async () => {
    render(
      <TestWrapper>
        <NetworkStatus />
      </TestWrapper>
    )

    // Click on network dropdown
    const networkButton = screen.getByRole('button', { name: /devnet/i })
    fireEvent.click(networkButton)

    // Select mainnet
    const mainnetOption = screen.getByText('Mainnet')
    fireEvent.click(mainnetOption)

    expect(mockSetCluster).toHaveBeenCalledWith('mainnet-beta')
  })

  it('calls onNetworkSwitch callback when network changes', async () => {
    const onNetworkSwitch = vi.fn()
    
    render(
      <TestWrapper>
        <NetworkStatus onNetworkSwitch={onNetworkSwitch} />
      </TestWrapper>
    )

    // Click on network dropdown
    const networkButton = screen.getByRole('button', { name: /devnet/i })
    fireEvent.click(networkButton)

    // Select testnet
    const testnetOption = screen.getByText('Testnet')
    fireEvent.click(testnetOption)

    expect(onNetworkSwitch).toHaveBeenCalledWith('testnet')
  })

  it('handles refresh functionality', async () => {
    render(
      <TestWrapper>
        <NetworkStatus />
      </TestWrapper>
    )

    const refreshButton = screen.getByRole('button', { name: '' }) // Refresh button has no text, just icon
    fireEvent.click(refreshButton)

    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows disconnected state correctly', () => {
    (useNetworkStatusModule.useNetworkHealth as Mock).mockReturnValue({
      ...mockNetworkHealth,
      isConnected: false
    });

    (useNetworkStatusModule.useNetworkStatus as Mock).mockReturnValue({
      ...mockNetworkStatusQuery,
      data: {
        ...mockNetworkStatus,
        connectionStatus: 'disconnected'
      }
    })

    render(
      <TestWrapper>
        <NetworkStatus />
      </TestWrapper>
    )

    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByText('Connection lost')).toBeInTheDocument()
    expect(screen.getByText('Reconnect')).toBeInTheDocument()
  })

  it('shows network health warnings', () => {
    (useNetworkStatusModule.useNetworkHealth as Mock).mockReturnValue({
      ...mockNetworkHealth,
      isHealthy: false
    });

    (useNetworkStatusModule.useNetworkStatus as Mock).mockReturnValue({
      ...mockNetworkStatusQuery,
      data: {
        ...mockNetworkStatus,
        health: {
          ...mockNetworkStatus.health,
          uptime: 94.5
        }
      }
    })

    render(
      <TestWrapper>
        <NetworkStatus />
      </TestWrapper>
    )

    expect(screen.getByText('Network health below 95%')).toBeInTheDocument()
  })

  it('shows congestion warnings', () => {
    (useNetworkStatusModule.useNetworkHealth as Mock).mockReturnValue({
      ...mockNetworkHealth,
      isCongested: true
    });

    (useNetworkStatusModule.useNetworkStatus as Mock).mockReturnValue({
      ...mockNetworkStatusQuery,
      data: {
        ...mockNetworkStatus,
        info: {
          ...mockNetworkStatus.info,
          networkCongestion: 'high'
        }
      }
    })

    render(
      <TestWrapper>
        <NetworkStatus />
      </TestWrapper>
    )

    expect(screen.getByText('High network congestion detected')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
  })

  it('hides network switcher when showNetworkSwitcher is false', () => {
    render(
      <TestWrapper>
        <NetworkStatus showNetworkSwitcher={false} />
      </TestWrapper>
    )

    expect(screen.queryByText('Network:')).not.toBeInTheDocument()
  })

  it('formats numbers correctly', () => {
    render(
      <TestWrapper>
        <NetworkStatus />
      </TestWrapper>
    )

    // Block height should be formatted as 245M
    expect(screen.getByText('245M')).toBeInTheDocument()
    
    // TPS should be formatted as 2.8K
    expect(screen.getByText('2.8K')).toBeInTheDocument()
    
    // Gas price should show full number with lamports
    expect(screen.getByText('5.0K lamports')).toBeInTheDocument()
  })

  it('shows validator information', () => {
    render(
      <TestWrapper>
        <NetworkStatus />
      </TestWrapper>
    )

    expect(screen.getByText('1185/1200')).toBeInTheDocument() // Active/Total validators
  })

  it('shows epoch information', () => {
    render(
      <TestWrapper>
        <NetworkStatus />
      </TestWrapper>
    )

    expect(screen.getByText('512')).toBeInTheDocument() // Epoch number
  })

  it('shows progress bars for health metrics', () => {
    render(
      <TestWrapper>
        <NetworkStatus />
      </TestWrapper>
    )

    expect(screen.getByText('99.9%')).toBeInTheDocument() // Network health percentage
    expect(screen.getByText('87.3%')).toBeInTheDocument() // Network capacity percentage
  })
})

// Test utility functions
describe('Network Status Utility Functions', () => {
  describe('formatNumber', () => {
    // We need to import the function or test it indirectly through the component
    it('formats large numbers correctly', () => {
      render(
        <TestWrapper>
          <NetworkStatus />
        </TestWrapper>
      )
      
      // Test through component rendering
      expect(screen.getByText('245M')).toBeInTheDocument() // 245678901 -> 245M
      expect(screen.getByText('2.8K')).toBeInTheDocument() // 2847 -> 2.8K
    })
  })

  describe('getCongestionColor', () => {
    it('returns correct colors for congestion levels', () => {
      // Test through component rendering with different congestion levels
      const testCases = [
        { level: 'low', expectedClass: 'LOW' },
        { level: 'medium', expectedClass: 'MEDIUM' },
        { level: 'high', expectedClass: 'HIGH' }
      ]

      testCases.forEach(({ level, expectedClass }) => {
        (useNetworkStatusModule.useNetworkStatus as Mock).mockReturnValue({
          ...mockNetworkStatusQuery,
          data: {
            ...mockNetworkStatus,
            info: {
              ...mockNetworkStatus.info,
              networkCongestion: level as any
            }
          }
        })

        const { unmount } = render(
          <TestWrapper>
            <NetworkStatus />
          </TestWrapper>
        )

        expect(screen.getByText(expectedClass)).toBeInTheDocument()
        unmount()
      })
    })
  })
})