'use client'

import React, { useState, useRef } from 'react'
import { cn } from '~/lib/utils'

export enum SliderDirection {
  Left,   // Slider on the left (kanban)
  Right,  // Slider on the right (calendar)
}

type Props = {
  children: React.ReactNode
  className?: string
  direction: SliderDirection
  defaultWidth?: number
  isCollapsed?: boolean // Is THIS slider collapsed?
  isCalendarCollapsed?: boolean // Is the OTHER (calendar) slider collapsed?
}

export function KanbanSlider({ 
  children, 
  className, 
  direction, 
  defaultWidth = 350,
  isCollapsed: externalIsCollapsed, // Controlled state for this slider
  isCalendarCollapsed = false, // Info about the other panel
}: Props) {
  // Use internal state if no external control is provided for THIS slider
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false)
  
  // Determine if THIS slider is collapsed (controlled or uncontrolled)
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed
  
  // Control the pixel width when not collapsed and not full-width
  const [width, setWidth] = useState(defaultWidth)  
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging if the calendar is collapsed (kanban should be full width)
    if (direction === SliderDirection.Left && isCalendarCollapsed) return;
    
    e.preventDefault()
    isDragging.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    // If calendar is collapsed, don't allow resizing the full-width kanban
    if (direction === SliderDirection.Left && isCalendarCollapsed) return;

    const rect = containerRef.current.getBoundingClientRect()
    
    let newW: number
    
    if (direction === SliderDirection.Left) {
      newW = e.clientX - rect.left
    } else { // Right slider (shouldn't be visible if calendar is collapsed anyway)
      newW = rect.right - e.clientX
    }
    
    // Clamp between min and max sizes
    setWidth(Math.min(Math.max(newW, 300), 700))
  }

  const handleMouseUp = () => {
    isDragging.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // Determine the final styles based on collapsed states
  const getContainerStyles = () => {
    if (isCollapsed) {
      // If THIS slider is collapsed, it's always width 0
      return {
        width: 0,
        minWidth: 0,
        maxWidth: 0,
      }
    } else if (direction === SliderDirection.Left && isCalendarCollapsed) {
      // If this is the LEFT slider and the CALENDAR is collapsed, go full width
      return {
        width: '100%',
        minWidth: '100%',
        maxWidth: '100%',
      }
    } else {
      // Otherwise, use the draggable width
      return {
        width: width,
        minWidth: undefined, // Allow shrinking/growing based on content/drag
        maxWidth: '100%', // Don't exceed parent
      }
    }
  }

  const containerStyles = getContainerStyles();

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex h-full transition-[width] duration-200 ease-in-out', // Only transition width now
        direction === SliderDirection.Right && 'flex-row-reverse',
        className
      )}
      style={containerStyles}
    >
      {/* Content area */}
      <div className="h-full flex-1 overflow-hidden">{children}</div>

      {/* Drag handle - only show when not collapsed AND not full-width */}
      {!isCollapsed && !(direction === SliderDirection.Left && isCalendarCollapsed) && (
        <div
          className={cn(
            "w-1 cursor-col-resize bg-gray-200 hover:bg-gray-300",
            direction === SliderDirection.Right && "order-first"
          )}
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  )
}
