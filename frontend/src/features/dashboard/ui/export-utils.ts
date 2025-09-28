import { Transaction } from '../data-access/types'

export interface ExportOptions {
  format: 'csv' | 'json'
  filename?: string
  includeHeaders?: boolean
}

export function exportTransactions(
  transactions: Transaction[], 
  options: ExportOptions = { format: 'csv' }
): void {
  const { format, filename, includeHeaders = true } = options
  
  const timestamp = new Date().toISOString().split('T')[0]
  const defaultFilename = `transactions-${timestamp}.${format}`
  const finalFilename = filename || defaultFilename

  if (format === 'csv') {
    exportToCSV(transactions, finalFilename, includeHeaders)
  } else if (format === 'json') {
    exportToJSON(transactions, finalFilename)
  }
}

function exportToCSV(transactions: Transaction[], filename: string, includeHeaders: boolean): void {
  const headers = [
    'Date',
    'Type',
    'Energy Type',
    'Quantity (kWh)',
    'Price per kWh (SOL)',
    'Total Amount (SOL)',
    'Status',
    'Counterparty',
    'Transaction Hash',
    'Block Height',
    'Gas Used'
  ]

  const csvRows: string[] = []

  // Add headers if requested
  if (includeHeaders) {
    csvRows.push(headers.join(','))
  }

  // Add data rows
  transactions.forEach(tx => {
    const row = [
      formatDateForExport(tx.timestamp),
      tx.type,
      tx.energyType,
      tx.quantity.toString(),
      tx.pricePerKwh.toString(),
      tx.totalAmount.toString(),
      tx.status,
      `"${tx.counterparty}"`, // Wrap in quotes to handle commas
      tx.transactionHash,
      tx.blockHeight?.toString() || '',
      tx.gasUsed?.toString() || ''
    ]
    csvRows.push(row.join(','))
  })

  const csvContent = csvRows.join('\n')
  downloadFile(csvContent, filename, 'text/csv')
}

function exportToJSON(transactions: Transaction[], filename: string): void {
  const exportData = {
    exportDate: new Date().toISOString(),
    totalTransactions: transactions.length,
    transactions: transactions.map(tx => ({
      ...tx,
      formattedDate: formatDateForExport(tx.timestamp),
      explorerUrl: getExplorerUrl(tx.transactionHash)
    }))
  }

  const jsonContent = JSON.stringify(exportData, null, 2)
  downloadFile(jsonContent, filename, 'application/json')
}

function formatDateForExport(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  })
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up the URL object
  URL.revokeObjectURL(url)
}

export function getExplorerUrl(transactionHash: string, network: 'mainnet' | 'devnet' | 'testnet' = 'mainnet'): string {
  if (network === 'mainnet') {
    return `https://explorer.solana.com/tx/${transactionHash}`
  } else {
    return `https://explorer.solana.com/tx/${transactionHash}?cluster=${network}`
  }
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers or non-secure contexts
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        textArea.remove()
        resolve()
      } catch (error) {
        textArea.remove()
        reject(error)
      }
    })
  }
}

export function formatTransactionSummary(transactions: Transaction[]): string {
  const totalTransactions = transactions.length
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0)
  const buyTransactions = transactions.filter(tx => tx.type === 'buy').length
  const sellTransactions = transactions.filter(tx => tx.type === 'sell').length
  
  const energyTypeCounts = transactions.reduce((counts, tx) => {
    counts[tx.energyType] = (counts[tx.energyType] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  const statusCounts = transactions.reduce((counts, tx) => {
    counts[tx.status] = (counts[tx.status] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  return `
Transaction Summary:
- Total Transactions: ${totalTransactions}
- Total Volume: ${totalVolume.toFixed(3)} SOL
- Buy Orders: ${buyTransactions}
- Sell Orders: ${sellTransactions}

Energy Types:
${Object.entries(energyTypeCounts)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

Status Distribution:
${Object.entries(statusCounts)
  .map(([status, count]) => `- ${status}: ${count}`)
  .join('\n')}
  `.trim()
}