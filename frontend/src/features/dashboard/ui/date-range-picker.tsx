import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  value?: [Date, Date] | null
  onChange: (range: [Date, Date] | null) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [startDate, setStartDate] = useState(value?.[0]?.toISOString().split('T')[0] || '')
  const [endDate, setEndDate] = useState(value?.[1]?.toISOString().split('T')[0] || '')

  const formatDateRange = (range: [Date, Date] | null) => {
    if (!range) return 'Select date range'
    const [start, end] = range
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${startStr} - ${endStr}`
  }

  const handleApply = () => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // Set start time to beginning of day
      start.setHours(0, 0, 0, 0)
      // Set end time to end of day
      end.setHours(23, 59, 59, 999)
      
      if (start <= end) {
        onChange([start, end])
        setIsOpen(false)
      }
    }
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    onChange(null)
    setIsOpen(false)
  }

  const handleQuickSelect = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    
    // Set times
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
    onChange([start, end])
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {formatDateRange(value)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Select Date Range</h4>
            {value && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Quick Select Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(7)}
            >
              Last 7 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(30)}
            >
              Last 30 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(90)}
            >
              Last 90 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(365)}
            >
              Last year
            </Button>
          </div>

          {/* Custom Date Inputs */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!startDate || !endDate}
            >
              Apply
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}