'use client'

import { useEffect, useState } from 'react'

export default function IndiaClock() {
  const [timeStr, setTimeStr] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const formatted = new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      setTimeStr(formatted)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return <span>{timeStr || '12:00 PM'} in India (IST)</span>
}
