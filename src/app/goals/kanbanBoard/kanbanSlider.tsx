'use client'

import React, { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '~/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
}

export function KanbanSlider({ children, className }: Props) {
  // We'll control the sidebar in pixels instead of % – more predictable.
  const [width, setWidth] = useState(350)       // default 300px
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    // new width is pointer X relative to container's left
    const newW = e.clientX - rect.left
    // clamp between 200px and 600px
    setWidth(Math.min(Math.max(newW, 300), 700))
  }

  const handleMouseUp = () => {
    isDragging.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative flex h-full', className)}
      style={{ width: isCollapsed ? 0 : width }}
    >
      {/* Your kanban sidebar */}
      <div className="overflow-hidden h-full">{children}</div>

      {/* Drag‐handle */}
      {!isCollapsed && (
        <div
          className="w-1 cursor-col-resize bg-gray-200 hover:bg-gray-300"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Collapse/Expand button */}
      <button
        onClick={() => setIsCollapsed((c) => !c)}
        className="absolute top-4 right-0 transform translate-x-1/2 
                   bg-primary text-white rounded-full p-1 shadow"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
