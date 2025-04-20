import React, { useEffect, useMemo, useState } from 'react'
import styles from "~/styles/calendarView.module.css"

export type CalendarEvent = {
  id: string
  title: string
  description: string
  start: Date
  end: Date
  notifications?: Date[]
  goalId?: string
  taskId?: string
  type?: 'goal' | 'task'
}

type Props = {
  events: CalendarEvent[]
  onCreate: (start: Date, end: Date) => void
  onEdit: (evt: CalendarEvent) => void
  onDelete: (id: string) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function CalendarView({
  events,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  const [now, setNow] = useState(new Date())

  // tick every minute for "now" indicator
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // days Mon–Sun, starting today’s week
  const weekDays = useMemo(() => {
    const start = new Date(now)
    const day = start.getDay() || 7 // Sun=7
    start.setDate(start.getDate() - day + 1)
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [now])

  const renderEvent = (evt: CalendarEvent) => {
    const dayIndex = weekDays.findIndex(
      (d) =>
        d.getFullYear() === evt.start.getFullYear() &&
        d.getMonth() === evt.start.getMonth() &&
        d.getDate() === evt.start.getDate()
    )
    if (dayIndex === -1) return null

    const topPerc =
      ((evt.start.getHours() * 60 + evt.start.getMinutes()) /
        (24 * 60)) *
      100
    const heightPerc =
      ((evt.end.getTime() - evt.start.getTime()) / (1000 * 60 * 24 * 60)) *
      100

    // stub colors; replace with your kanban color lookup
    const color =
      evt.type === 'goal' ? '#FF7043' : evt.type === 'task' ? '#42A5F5' : '#9575CD'

    return (
      <div
        key={evt.id}
        className={styles.event}
        style={{
          top: `${topPerc}%`,
          height: `${heightPerc}%`,
          left: `${(dayIndex / 7) * 100}%`,
          width: `${100 / 7}%`,
          backgroundColor: color,
        }}
        onClick={() => onEdit(evt)}
      >
        <strong>{evt.title}</strong>
        <button
          className={styles.deleteBtn}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(evt.id)
          }}
        >
          ×
        </button>
      </div>
    )
  }

  const handleGridClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const { top, height } = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - top
    const minutes = Math.floor((y / height) * 24 * 60)
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    start.setMinutes(minutes)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + 60) // default 1h slot
    onCreate(start, end)
  }

  const nowTop = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100

  return (
    <div className={styles.wrapper}>
      <div className={styles.timeCol}>
        {HOURS.map((h) => (
          <div key={h} className={styles.hourLabel}>
            {h % 12 === 0 ? 12 : h % 12}
            {h < 12 ? ' AM' : ' PM'}
          </div>
        ))}
      </div>
      <div className={styles.grid} onDoubleClick={handleGridClick}>
        {/* day headers */}
        <div className={styles.headers}>
          {weekDays.map((d) => (
            <div key={d.toDateString()} className={styles.headerCell}>
              {d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
            </div>
          ))}
        </div>

        {/* time slots */}
        {HOURS.map((_) => (
          <div key={_} className={styles.row} />
        ))}

        {/* events */}
        {events.map(renderEvent)}

        {/* now indicator */}
        <div className={styles.nowLine} style={{ top: `${nowTop}%` }}>
          <span className={styles.nowDot} />
        </div>
      </div>
    </div>
  )
}
