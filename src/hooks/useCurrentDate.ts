import { useEffect, useState } from 'react'

export function useCurrentDate() {
  const [currentDate, setCurrentDate] = useState(() => new Date())

  useEffect(() => {
    const now = new Date()
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timeout = window.setTimeout(
      () => setCurrentDate(new Date()),
      nextDay.getTime() - now.getTime() + 250,
    )

    return () => window.clearTimeout(timeout)
  }, [currentDate])

  return currentDate
}
