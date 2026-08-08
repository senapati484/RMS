'use client'
import { useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Sparkles, Check, X
} from 'lucide-react'

interface RentalCalendarPickerProps {
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  onDatesChange: (start: string, end: string) => void
  onClose?: () => void
}

const PRESETS = [
  { label: '1 Day', days: 1, tag: 'Std' },
  { label: '3 Days', days: 3, tag: '-10%' },
  { label: '1 Wk', days: 7, tag: '-20%' },
  { label: '2 Wks', days: 14, tag: '-30%' },
  { label: '1 Mo', days: 30, tag: '-40%' },
]

export default function RentalCalendarPicker({
  startDate,
  endDate,
  onDatesChange,
  onClose,
}: RentalCalendarPickerProps) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = startDate ? new Date(startDate) : new Date()
    return isNaN(d.getTime()) ? new Date() : d
  })

  // Calculate Days Grid
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const lastDate = new Date(year, month + 1, 0).getDate()

    const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean; isPast: boolean }> = []

    for (let i = 0; i < firstDay; i++) {
      days.push({ dateStr: '', dayNum: 0, isCurrentMonth: false, isPast: true })
    }

    for (let d = 1; d <= lastDate; d++) {
      const dateStr = [
        year,
        String(month + 1).padStart(2, '0'),
        String(d).padStart(2, '0'),
      ].join('-')
      const isPast = dateStr < todayStr
      days.push({ dateStr, dayNum: d, isCurrentMonth: true, isPast })
    }

    return days
  }, [currentMonth, todayStr])

  const handleDateClick = (dateStr: string) => {
    if (!dateStr || dateStr < todayStr) return

    if (!startDate || (startDate && endDate)) {
      const startObj = new Date(dateStr)
      const endObj = new Date(startObj.getTime() + 3 * 86400000)
      onDatesChange(dateStr, endObj.toISOString().slice(0, 10))
    } else if (startDate && !endDate) {
      if (dateStr < startDate) {
        onDatesChange(dateStr, startDate)
      } else {
        onDatesChange(startDate, dateStr)
      }
    }
  }

  const applyPreset = (days: number) => {
    const startObj = startDate ? new Date(startDate) : new Date()
    const endObj = new Date(startObj.getTime() + days * 86400000)
    const startStr = startObj.toISOString().slice(0, 10)
    const endStr = endObj.toISOString().slice(0, 10)
    onDatesChange(startStr < todayStr ? todayStr : startStr, endStr)
  }

  const startMs = startDate ? new Date(startDate).getTime() : Date.now()
  const endMs = endDate ? new Date(endDate).getTime() : startMs + 3 * 86400000
  const durationDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)))

  return (
    <div className="bg-[#111111]/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-3.5 shadow-2xl space-y-3 text-white max-w-[310px] w-full text-xs animate-in zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <CalendarIcon size={14} className="text-[#F26522]" />
          <span className="text-white font-bold text-xs">Rental Dates</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#F26522]/20 text-[#F26522] border border-[#F26522]/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
            {durationDays} Day{durationDays > 1 ? 's' : ''}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-white/40 hover:text-white rounded-md transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Duration Presets (Compact Pills) */}
      <div className="flex items-center justify-between gap-1">
        {PRESETS.map((preset) => {
          const active = durationDays === preset.days
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.days)}
              className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer border ${
                active
                  ? 'bg-[#F26522] text-white border-[#F26522] font-bold shadow-md'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              <div className="text-[10px] leading-tight font-bold">{preset.label}</div>
              <div className={`text-[8px] ${active ? 'text-white/90' : 'text-[#F26522]'}`}>
                {preset.tag}
              </div>
            </button>
          )
        })}
      </div>

      {/* Month Navigation Bar */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
        >
          <ChevronLeft size={14} />
        </button>

        <span className="text-[11px] font-bold text-white/90 uppercase tracking-wide">
          {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </span>

        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Grid */}
      <div>
        <div className="grid grid-cols-7 text-center text-[9px] font-bold text-white/30 mb-1">
          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day, idx) => {
            if (!day.isCurrentMonth) {
              return <div key={idx} className="h-6" />
            }

            const isStart = day.dateStr === startDate
            const isEnd = day.dateStr === endDate
            const isInRange = startDate && endDate && day.dateStr > startDate && day.dateStr < endDate

            let btnClass = 'bg-white/5 text-white/80 hover:bg-white/15'
            if (day.isPast) {
              btnClass = 'bg-white/0 text-white/20 cursor-not-allowed pointer-events-none'
            } else if (isStart || isEnd) {
              btnClass = 'bg-[#F26522] text-white font-black shadow-md scale-105 z-10'
            } else if (isInRange) {
              btnClass = 'bg-[#F26522]/30 text-white font-medium border-y border-[#F26522]/40'
            }

            return (
              <button
                key={day.dateStr}
                type="button"
                disabled={day.isPast}
                onClick={() => handleDateClick(day.dateStr)}
                className={`h-6.5 w-full rounded-md text-[10px] font-mono transition-all flex items-center justify-center cursor-pointer ${btnClass}`}
              >
                {day.dayNum}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Period Badge */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
        <div className="text-white/50 font-mono">
          {startDate ? new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
          {' → '}
          {endDate ? new Date(endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="bg-[#F26522] hover:bg-[#e05510] text-white px-3 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-md"
          >
            <Check size={11} /> Done
          </button>
        )}
      </div>
    </div>
  )
}
