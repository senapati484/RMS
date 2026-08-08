'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus,
  Edit2, Clock, CheckCircle2, AlertTriangle, Package, Loader2
} from 'lucide-react'

interface ScheduleOrder {
  _id: string
  orderNumber: string
  status: string
  rentalStart: string
  rentalEnd: string
  totalAmount: number
  userId?: { name: string; email: string }
  items: Array<{ productName: string; quantity: number }>
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function RentalSchedulePage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<ScheduleOrder[]>([])
  const [loading, setLoading] = useState(true)

  // Current calendar month view state
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  // Selected Date / Date Range
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const [selectedDateRange, setSelectedDateRange] = useState<number[] | null>([today.getDate()])

  useEffect(() => {
    fetch('/api/orders?limit=100')
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Calendar Math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()

  // Map orders to calendar days
  const dayEventsMap = useMemo(() => {
    const map: Record<number, Array<{ order: ScheduleOrder; eventType: 'BOOKED' | 'PICKUP' | 'LATE_PICKUP' | 'LATE_DELIVERY' }>> = {}

    orders.forEach(order => {
      const start = new Date(order.rentalStart)
      const end = new Date(order.rentalEnd)

      // If order is in current month & year
      if (start.getFullYear() === currentYear && start.getMonth() === currentMonth) {
        const day = start.getDate()
        if (!map[day]) map[day] = []

        let eventType: 'BOOKED' | 'PICKUP' | 'LATE_PICKUP' | 'LATE_DELIVERY' = 'BOOKED'
        if (order.status === 'CONFIRMED') eventType = 'PICKUP'
        else if (order.status === 'PICKED_UP' && end < today) eventType = 'LATE_DELIVERY'
        else if (order.status === 'CONFIRMED' && start < today) eventType = 'LATE_PICKUP'

        map[day].push({ order, eventType })
      }

      if (end.getFullYear() === currentYear && end.getMonth() === currentMonth) {
        const day = end.getDate()
        if (!map[day]) map[day] = []

        let eventType: 'BOOKED' | 'PICKUP' | 'LATE_PICKUP' | 'LATE_DELIVERY' = 'BOOKED'
        if (order.status === 'RETURNED_LATE') eventType = 'LATE_DELIVERY'

        map[day].push({ order, eventType })
      }
    })

    return map
  }, [orders, currentYear, currentMonth])

  // Get events for selected day or date range
  const selectedEvents = useMemo(() => {
    if (!selectedDay) return []
    const eventsForDay = dayEventsMap[selectedDay] || []
    return eventsForDay
  }, [selectedDay, dayEventsMap])

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="text-[#F26522]" />
            Rental Scheduler
          </h1>
          <p className="text-white/40 text-xs mt-1">Calendar dispatch board, reservation timelines & product availability</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month / Year Selector */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 gap-2 text-xs font-bold text-white">
            <button onClick={handlePrevMonth} className="hover:text-[#F26522] cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[100px] text-center font-mono">
              {MONTH_NAMES[currentMonth].slice(0, 3)} {currentYear}
            </span>
            <button onClick={handleNextMonth} className="hover:text-[#F26522] cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>

          {user?.role !== 'PORTAL_USER' && (
            <Link
              href="/dashboard/orders/new"
              className="flex items-center gap-1.5 bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-[#F26522]/20 cursor-pointer"
            >
              <Plus size={15} />
              <span>New</span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Status Legend Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-white text-xs font-bold uppercase tracking-wider border-b border-white/10 pb-3">
              Status Legend
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-md shrink-0" />
                <span className="text-white font-medium">Booked</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-[#F26522] shadow-md shrink-0" />
                <span className="text-white font-medium">Pick up</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-red-500 bg-transparent shrink-0" />
                <span className="text-white font-medium">Late Pick up</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-md shrink-0" />
                <span className="text-white font-medium">Late Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Calendar Grid */}
        <div className="lg:col-span-5 liquid-glass border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-white text-sm font-bold">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <span className="text-white/40 text-xs">Click date to inspect schedule</span>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-white/50 border-b border-white/10 pb-2">
            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
          </div>

          {/* Calendar Month Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono">
            {/* Empty slots for offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14 opacity-0" />
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayEvents = dayEventsMap[day] || []
              const isSelected = selectedDay === day
              const isTodayDay = isToday(day)

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day)
                    setSelectedDateRange([day])
                  }}
                  className={`h-14 rounded-xl p-1.5 flex flex-col items-center justify-between transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#F26522]/20 border-[#F26522] text-white shadow-lg shadow-[#F26522]/20'
                      : isTodayDay
                      ? 'border-red-500 bg-red-500/10 text-white font-bold'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/10 text-white/80'
                  }`}
                >
                  <span className={`text-xs font-bold ${isTodayDay ? 'text-red-400' : ''}`}>
                    {day}
                  </span>

                  {/* Status Indicator Dots under date */}
                  <div className="flex items-center justify-center gap-1 flex-wrap max-w-full">
                    {dayEvents.slice(0, 4).map((evt, idx) => {
                      if (evt.eventType === 'BOOKED') {
                        return <span key={idx} className="w-2 h-2 rounded-full bg-purple-500" />
                      }
                      if (evt.eventType === 'PICKUP') {
                        return <span key={idx} className="w-2 h-2 rounded-full bg-[#F26522]" />
                      }
                      if (evt.eventType === 'LATE_PICKUP') {
                        return <span key={idx} className="w-2 h-2 rounded-full border border-red-500 bg-transparent" />
                      }
                      return <span key={idx} className="w-2 h-2 rounded-full bg-red-600" />
                    })}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Product Availability & Scheduled Events Panel */}
        <div className="lg:col-span-4 liquid-glass border border-white/10 rounded-2xl p-5 space-y-4 min-h-[420px]">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <h2 className="text-white text-xs font-bold uppercase tracking-wider">
              {selectedDay
                ? `${MONTH_NAMES[currentMonth].slice(0, 3)} ${selectedDay}, ${currentYear}`
                : 'Selected Schedule Details'}
            </h2>
            <span className="text-white/40 text-xs font-mono">
              {selectedEvents.length} Events
            </span>
          </div>

          <div className="space-y-3">
            {selectedEvents.map(({ order, eventType }, idx) => {
              const mainItem = order.items[0] || { productName: 'Rental Item', quantity: 1 }
              const customerName = order.userId?.name || 'Customer'
              const availStatus = order.status === 'CONFIRMED' ? 'Available' : order.status === 'PICKED_UP' ? 'Booked' : 'In Transit'
              const statusColor = availStatus === 'Available' ? 'text-emerald-400 font-bold' : 'text-purple-400 font-bold'

              return (
                <div
                  key={order._id || idx}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center justify-between transition-all group"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="font-mono text-[#F26522]">{idx + 1}. {order.orderNumber}:</span>
                      <span className="text-white font-semibold">{mainItem.productName}</span>
                    </div>

                    <div className="text-[11px] text-white/60">
                      Customer: <strong className="text-white">{customerName}</strong>, {mainItem.quantity} Unit{' '}
                      <span className={statusColor}>({availStatus})</span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/orders/${order._id}`}
                    className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </Link>
                </div>
              )
            })}

            {selectedEvents.length === 0 && (
              <div className="text-center py-16 space-y-2">
                <Package size={28} className="mx-auto text-white/20" />
                <p className="text-white/40 text-xs">No rental dispatches scheduled on this date</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5 text-[10px] text-white/30 text-center">
            ( all the status mentioned in the brackets are showing the product availability )
          </div>
        </div>
      </div>
    </div>
  )
}
