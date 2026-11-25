import type { RowDataPacket } from 'mysql2/promise'
import { useDb } from './db'

export interface TrafficDay {
  date: string
  count: number
}

export interface TrafficSummary {
  today: number
  days: TrafficDay[]
  total: number
}

export interface RecentDays {
  today: string
  start: string
  dates: string[]
}

export async function recentDays(): Promise<RecentDays> {
  const [rows] = await useDb().query<RowDataPacket[]>(
    "SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS `today`"
  )
  const today = String(rows[0]?.today || '')
  if (!today) throw new Error('Could not resolve the database date.')

  const end = new Date(`${today}T00:00:00Z`)
  const dates = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(end)
    day.setUTCDate(end.getUTCDate() - (6 - index))
    return day.toISOString().slice(0, 10)
  })

  return { today, start: dates[0]!, dates }
}

export function summarizeTraffic(window: RecentDays, counts: Map<string, number>): TrafficSummary {
  const days = window.dates.map(date => ({
    date,
    count: Number(counts.get(date) || 0)
  }))

  return {
    today: days[days.length - 1]?.count || 0,
    days,
    total: days.reduce((sum, day) => sum + day.count, 0)
  }
}
