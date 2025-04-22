'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '~/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
  side?: 'left' | 'right'
  otherPanelCollapsed?: boolean
}

export function KanbanSlider({ 
  children, 
  className, 
  side = 'left',
  otherPanelCollapsed = false
}: Props) {
  // We'll control the sidebar in pixels instead of % – more predictable.
  const [width, setWidth] = useState(side === 'left' ? 350 : 0) // default 350px for left
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+E to toggle left panel
      if (e.ctrlKey && e.key === 'e' && side === 'left') {
        e.preventDefault()
        setIsCollapsed(prev => !prev)
      }
      
      // Ctrl+F to toggle right panel
      if (e.ctrlKey && e.key === 'f' && side === 'right') {
        e.preventDefault()
        setIsCollapsed(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [side])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    
    // Different calculations based on which side we're on
    let newW
    if (side === 'left') {
      // For left panel, drag to the right increases width
      newW = Math.max(0, e.clientX - rect.left)
    } else {
      // For right panel, drag to the left increases width
      const rightEdge = window.innerWidth - e.clientX
      newW = rightEdge
    }
    
    // Clamp between min and max values
    setWidth(Math.min(Math.max(newW, 0), 600))
  }

  const handleMouseUp = () => {
    isDragging.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex h-full transition-width duration-300', 
        side === 'right' ? 'flex-row-reverse' : 'flex-row',
        className
      )}
      style={{ 
        width: isCollapsed ? 0 : width,
        maxWidth: otherPanelCollapsed ? '100%' : '50%' // Allow more space when other panel is collapsed
      }}
    >
      {/* Panel content */}
      <div className="overflow-hidden h-full w-full">
        {children}
      </div>

      {/* Drag-handle */}
      {!isCollapsed && (
        <div
          className="w-1 cursor-col-resize bg-gray-200 hover:bg-gray-300"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Collapse/Expand button */}
      <button
        onClick={() => setIsCollapsed((c) => !c)}
        className={cn(
          "absolute top-4 z-10 bg-primary text-white rounded-full p-1 shadow",
          side === 'left' 
            ? "right-0 transform translate-x-1/2" 
            : "left-0 transform -translate-x-1/2"
        )}
        aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {isCollapsed ? (
          side === 'left' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
        ) : (
          side === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
