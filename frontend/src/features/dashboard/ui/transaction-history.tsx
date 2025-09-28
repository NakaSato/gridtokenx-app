import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  ExternalLink,
  Search,
  Calendar,
  X,
  Copy,
  FileText,
  Activity,
} from 'lucide-react'
import { useTransactionHistory } from '../data-access/use-transaction-history'
import { usePendingTransactionsPolling } from '../data-access/use-transaction-status-polling'
import { Transaction, TransactionFilters, EnergyType } from '../data-access/types'
import { DateRangePicker } from './date-range-picker'
import { exportTransactions, getExplorerUrl, copyToClipboard, formatTransactionSummary } from './export-utils'
import { cn } from '@/lib/utils'

type SortField = 'timestamp' | 'totalAmount' | 'pricePerKwh' | 'quantity' | 'status'
type SortDirection = 'asc' | 'desc'

interface TransactionHistoryProps {
  className?: string
}

export function TransactionHistory({ className }: TransactionHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    status: 'all',
    energyType: [],
    dateRange: undefined,
  })

  const { data, isLoading, error } = useTransactionHistory(currentPage, pageSize, filters)
  const { pendingCount, isPolling } = usePendingTransactionsPolling(data?.transactions || [])

  // Filter and sort transactions based on local state
  const processedTransactions = useMemo(() => {
    if (!data?.transactions) return []

    let filtered = data.transactions

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.transactionHash.toLowerCase().includes(searchLower) ||
        tx.counterparty.toLowerCase().includes(searchLower) ||
        tx.energyType.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'timestamp') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [data?.transactions, searchTerm, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      energyType: [],
      dateRange: undefined,
    })
    setSearchTerm('')
    setCurrentPage(1)
  }

  const energyTypes: EnergyType[] = ['solar', 'wind', 'battery', 'grid']

  const handleEnergyTypeToggle = (energyType: EnergyType) => {
    setFilters(prev => ({
      ...prev,
      energyType: prev.energyType?.includes(energyType)
        ? prev.energyType.filter(type => type !== energyType)
        : [...(prev.energyType || []), energyType]
    }))
    setCurrentPage(1)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = (amount: number) => {
    return `${amount.toFixed(3)} SOL`
  }

  const getStatusBadge = (status: Transaction['status']) => {
    const variants = {
      confirmed: 'default',
      pending: 'secondary',
      failed: 'destructive',
    } as const

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    )
  }

  const getTypeBadge = (type: Transaction['type']) => {
    return (
      <Badge 
        variant={type === 'buy' ? 'default' : 'outline'}
        className={cn(
          'capitalize',
          type === 'buy' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
        )}
      >
        {type}
      </Badge>
    )
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />
  }

  const handleExport = (format: 'csv' | 'json') => {
    if (processedTransactions.length === 0) {
      return
    }
    
    exportTransactions(processedTransactions, { format })
  }

  const handleCopyHash = async (hash: string) => {
    try {
      await copyToClipboard(hash)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy hash:', error)
    }
  }

  const openExplorer = (hash: string) => {
    const url = getExplorerUrl(hash)
    window.open(url, '_blank')
  }

  const totalPages = data?.totalPages || 1
  const hasFilters = filters.type !== 'all' || filters.status !== 'all' || 
                    (filters.energyType && filters.energyType.length > 0) || 
                    filters.dateRange || searchTerm

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Failed to load transaction history</p>
            <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Transaction History</CardTitle>
              {isPolling && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Activity className="h-3 w-3 animate-pulse" />
                  <span>Updating {pendingCount} pending</span>
                </div>
              )}
            </div>
            <CardDescription>
              View and manage your energy trading transactions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={processedTransactions.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileText className="mr-2 h-4 w-4" />
                  CSV File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileText className="mr-2 h-4 w-4" />
                  JSON File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 pt-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by hash, counterparty, or energy type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {/* Filter Row */}
          <div className="flex flex-wrap gap-2">
            {/* Date Range Filter */}
            <DateRangePicker
              value={filters.dateRange}
              onChange={(range) => handleFilterChange('dateRange', range)}
            />

            {/* Transaction Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Type: {filters.type === 'all' ? 'All' : filters.type}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Transaction Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleFilterChange('type', 'all')}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('type', 'buy')}>
                  Buy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('type', 'sell')}>
                  Sell
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Energy Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Energy: {filters.energyType?.length === 0 ? 'All' : 
                          filters.energyType?.length === 1 ? filters.energyType[0] :
                          `${filters.energyType?.length} selected`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Energy Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {energyTypes.map((energyType) => (
                  <DropdownMenuCheckboxItem
                    key={energyType}
                    checked={filters.energyType?.includes(energyType) || false}
                    onCheckedChange={() => handleEnergyTypeToggle(energyType)}
                    className="capitalize"
                  >
                    {energyType}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Status: {filters.status === 'all' ? 'All' : filters.status}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleFilterChange('status', 'all')}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('status', 'confirmed')}>
                  Confirmed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('status', 'pending')}>
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('status', 'failed')}>
                  Failed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium"
                        onClick={() => handleSort('timestamp')}
                      >
                        Date
                        {getSortIcon('timestamp')}
                      </Button>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Energy</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium"
                        onClick={() => handleSort('quantity')}
                      >
                        Quantity
                        {getSortIcon('quantity')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium"
                        onClick={() => handleSort('pricePerKwh')}
                      >
                        Price/kWh
                        {getSortIcon('pricePerKwh')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium"
                        onClick={() => handleSort('totalAmount')}
                      >
                        Total
                        {getSortIcon('totalAmount')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        {getSortIcon('status')}
                      </Button>
                    </TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {hasFilters ? 'No transactions match your filters' : 'No transactions found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    processedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {formatDate(transaction.timestamp)}
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(transaction.type)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {transaction.energyType}
                        </TableCell>
                        <TableCell>
                          {transaction.quantity} kWh
                        </TableCell>
                        <TableCell>
                          {transaction.pricePerKwh.toFixed(4)} SOL
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatAmount(transaction.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {transaction.counterparty}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-1 py-0.5 rounded max-w-[100px] truncate">
                              {transaction.transactionHash}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleCopyHash(transaction.transactionHash)}
                              title="Copy hash"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => openExplorer(transaction.transactionHash)}
                              title="View on Solana Explorer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, data?.totalCount || 0)} of {data?.totalCount || 0} transactions
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-sm">Page</span>
                    <Input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value)
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page)
                        }
                      }}
                      className="w-16 h-8 text-center"
                    />
                    <span className="text-sm">of {totalPages}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}