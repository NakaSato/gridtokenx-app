import { useRoutes } from 'react-router'
import { lazy } from 'react'

const AccountDetailFeature = lazy(() => import('@/features/account/account-feature-detail.tsx'))
const AccountIndexFeature = lazy(() => import('@/features/account/account-feature-index.tsx'))
const GridtokenxappFeature = lazy(() => import('@/features/gridtokenxapp/gridtokenxapp-feature'))
const LandingFeature = lazy(() => import('@/features/landing/landing-feature'))
const DashboardFeature = lazy(() => import('@/features/dashboard/dashboard-feature'))
const EnergyTradingFeature = lazy(() => import('@/features/energy-trading/energy-trading-feature.tsx'))
const PoAGovernanceFeature = lazy(() => import('@/features/governance/poa-governance-feature.tsx'))
const RegistryFeature = lazy(() => import('@/features/registry/registry-feature'))

export function AppRoutes() {
  return useRoutes([
    { index: true, element: <LandingFeature /> },
    { path: 'dashboard', element: <DashboardFeature /> },
    {
      path: 'account',
      children: [
        { index: true, element: <AccountIndexFeature /> },
        { path: ':address', element: <AccountDetailFeature /> },
      ],
    },
    {
      path: 'gridtokenxapp',
      element: <GridtokenxappFeature />,
    },
    {
      path: 'energy-trading',
      element: <EnergyTradingFeature />,
    },
    {
      path: 'governance',
      element: <PoAGovernanceFeature />,
    },
    {
      path: 'registry',
      element: <RegistryFeature />,
    },
  ])
}
