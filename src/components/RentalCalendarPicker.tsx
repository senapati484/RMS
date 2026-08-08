'use client'
import { useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Sparkles, Check
} from 'lucide-react'

interface RentalCalendarPickerProps {
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  onDatesChange: (start: string, end: string) => void
  onClose?: () => void
}

const PRESETS = [
  { label: '1 Day', days: 1, discount: 'Standard Rate' },
  { label: '3 Days', days: 3, discount: '10% Off' },
  { label: '1 Week', days: 7, discount: '20% Off' },
  { label: '2 Weeks', days: 14, discount: '30% Off' },
  { label: '1 Month', days: 30, discount: '40% Off' },
]

const TIME_SLOTS = ['09:00 AM', '11:00 AM', '02:00 PM', '05:00 PM', '07:00 PM']

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
  const [pickupTime, setPickupTime] = useState('10:00 AM')

  // Calculate Days Grid
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const lastDate = new Date(year, month + 1, 0).getDate()

    const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean; isPast: boolean }> = []

    // Empty padding days from previous month
    for (let i = 0; i < firstDay; i++) {
      days.push({ dateStr: '', dayNum: 0, isCurrentMonth: false, isPast: true })
    }

    // Days in current month
    for (let d = 1; d <= lastDate; d++) {
      const dateObj = new Date(year, month, d)
      // Format as YYYY-MM-DD
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
      // Set start date and default 3-day end
      const startObj = new Date(dateStr)
      const endObj = new Date(startObj.getTime() + 3 * 86400000)
      const defaultEnd = endObj.toISOString().slice(0, 10)
      onDatesChange(dateStr, defaultEnd)
    } else if (startDate && !endDate) {
      if (dateStr < startDate) {
        // Reset start date if clicked earlier date
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

  // Calculate rental duration in days
  const startMs = startDate ? new Date(startDate).getTime() : Date.now()
  const endMs = endDate ? new Date(endDate).getTime() : startMs + 3 * 86400000
  const durationDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)))

  return (
    <div className="bg-[#141414] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-5 text-white max-w-md w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F26522]/20 border border-[#F26522]/40 text-[#F26522] flex items-center justify-center">
            <CalendarIcon size={18} />
          </div>
          <div>
            <h4 className="text-white text-sm font-bold tracking-tight">Select Rental Period</h4>
            <p className="text-white/40 text-[11px]">Pick up & return schedule</p>
          </div>
        </div>
        <div className="text-right">
          <span className="bg-[#F26522] text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md">
            {durationDays} Day{durationDays > 1 ? 's' : ''} Rental
          </span>
        </div>
      </div>

      {/* Quick Duration Presets */}
      <div>
        <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
          <Sparkles size={11} className="text-[#F26522]" /> Quick Presets
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {PRESETS.map((preset) => {
            const active = durationDays === preset.days
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.days)}
                className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer border ${
                  active
                    ? 'bg-[#F26522] text-white border-[#F26522] shadow-lg shadow-[#F26522]/30 scale-105 font-bold'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">{preset.label}</div>
                <div className={`text-[9px] mt-0.5 ${active ? 'text-white/90' : 'text-[#F26522]'}`}>
                  {preset.discount}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-xs font-extrabold uppercase tracking-wide">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>

        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Days Grid */}
      <div>
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-white/40 mb-2">
          <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day, idx) => {
            if (!day.isCurrentMonth) {
              return <div key={idx} className="h-8" />
            }

            const isStart = day.dateStr === startDate
            const isEnd = day.dateStr === endDate
            const isInRange = startDate && endDate && day.dateStr > startDate && day.dateStr < endDate

            let btnClass = 'bg-white/5 text-white/80 hover:bg-white/15'
            if (day.isPast) {
              btnClass = 'bg-white/0 text-white/20 cursor-not-allowed pointer-events-none'
            } else if (isStart || isEnd) {
              btnClass = 'bg-[#F26522] text-white font-extrabold shadow-lg scale-105 z-10'
            } else if (isInRange) {
              btnClass = 'bg-[#F26522]/25 text-white font-semibold border-y border-[#F26522]/40'
            }

            return (
              <button
                key={day.dateStr}
                type="button"
                disabled={day.isPast}
                onClick={() => handleDateClick(day.dateStr)}
                className={`h-8 rounded-lg text-xs font-mono transition-all flex items-center justify-center cursor-pointer ${btnClass}`}
              >
                {day.dayNum}
              </button>
            )
          })}
        </div>
      </div>

      {/* Pickup Slot Selector */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <label className="text-white/60 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <Clock size={11} className="text-[#F26522]" /> Preferred Pickup Slot
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setPickupTime(slot)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border whitespace-nowrap cursor-pointer ${
                pickupTime === slot
                  ? 'bg-white text-black border-white font-bold'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Action */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#F26522] hover:bg-[#e05510] text-white py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Check size={14} /> Confirm Rental Period
        </button>
      )}
    </div>
  )
}
