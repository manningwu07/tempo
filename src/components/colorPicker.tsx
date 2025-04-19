import { useState, useRef, useEffect } from 'react'
import { Palette } from 'lucide-react'
import { cn } from '~/lib/utils'

// Color definitions with both saturated (goals) and desaturated (columns) variants
export const COLORS = {
  red: {
    saturated: '#ff4444',
    desaturated: '#ffeeee'
  },
  orange: {
    saturated: '#ff8c42',
    desaturated: '#fff4ec'
  },
  yellow: {
    saturated: '#ffd700',
    desaturated: '#fffbe6'
  },
  green: {
    saturated: '#4caf50',
    desaturated: '#edf7ee'
  },
  blue: {
    saturated: '#2196f3',
    desaturated: '#e9f5fe'
  },
  indigo: {
    saturated: '#3f51b5',
    desaturated: '#eceef8'
  },
  violet: {
    saturated: '#9c27b0',
    desaturated: '#f6e9f8'
  },
  gray: {
    saturated: '#4b5563',
    desaturated: '#f3f4f6'
  }
} as const

export type ColorKey = keyof typeof COLORS
type ColorVariant = 'saturated' | 'desaturated'

interface ColorPickerProps {
  variant?: ColorVariant
  value?: string
  onChange?: (color: ColorKey) => void
  className?: string
}

export function ColorPicker({
  variant = 'saturated',
  value,
  onChange,
  className
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get current color display value
  const getCurrentColor = () => {
    if (value) {
      return COLORS[value as ColorKey][variant]
    } else {
      return COLORS.gray[variant]
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md border',
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          className
        )}
        style={{ backgroundColor: getCurrentColor() }}
      >
        <Palette
          className="h-4 w-4"
          style={{ color: variant === 'saturated' ? 'white' : 'black' }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="grid grid-cols-7 gap-1">
            {/* Rainbow colors */}
            {(Object.keys(COLORS) as ColorKey[])
              .filter(key => key !== 'gray')
              .map(colorKey => (
                <button
                  key={colorKey}
                  className={cn(
                    'h-6 w-6 rounded-md border',
                    'hover:ring-2 hover:ring-primary hover:ring-offset-2',
                    value === colorKey && 'ring-2 ring-primary ring-offset-2'
                  )}
                  style={{ backgroundColor: COLORS[colorKey][variant] }}
                  onClick={() => {
                    onChange?.(colorKey)
                    setIsOpen(false)
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
