'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '~/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
}

export function KanbanSlider({ children, className }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [width, setWidth] = useState(50) // default 50% width
  const sliderRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleMouseDown = () => {
    isDragging.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return
    const container = sliderRef.current.parentElement
    if (!container) return

    const newWidth = (e.clientX / container.offsetWidth) * 100
    setWidth(Math.min(Math.max(newWidth, 20), 80)) // Limit between 20% and 80%
  }

  const handleMouseUp = () => {
    isDragging.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="relative flex h-full w-full">
      <div
        ref={sliderRef}
        style={{ width: `${isCollapsed ? 0 : width}%` }}
        className={cn(
          'transition-[width] duration-300 ease-in-out',
          isCollapsed ? 'w-0' : '',
          className
        )}
      >
        {children}
      </div>

      {/* Slider Handle */}
      <div
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-gray-200 hover:bg-primary/50"
        onMouseDown={handleMouseDown}
      />

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-6 top-1/2 z-10 -translate-y-1/2 rounded-full bg-primary p-1 text-white shadow-lg"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
