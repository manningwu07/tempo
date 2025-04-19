'use client'

import { useState, useRef, useEffect } from 'react'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { Column, Task } from '~/types/kanbanBoard'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react' // Add Trash2
import { ColorPicker, COLORS, type ColorKey } from '~/components/colorPicker'
import { TaskCard } from './taskCard'
import { cn } from '~/lib/utils'

type Props = {
  column: Column
  onColorChange: (columnId: string, colorKey: ColorKey) => void
  onAddTask: (columnId: string, task: Omit<Task, 'color'>) => void
  onEditTask: (
    columnId: string,
    taskIndex: number,
    updates: Partial<Task>
  ) => void
  onDeleteTask: (columnId: string, taskIndex: number) => void // Keep this if TaskCard needs it
  onDeleteRequest: (columnId: string) => void // Handler to request deletion
}

export function KanbanColumn({
  column,
  onColorChange,
  onAddTask,
  onEditTask,
  onDeleteTask, // Keep receiving even if unused here
  onDeleteRequest, // Receive handler
}: Props) {
  
  const [isAdding, setIsAdding] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '' })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
  })

  const taskIds = column.tasks.map((_, idx) => `${column.id}|${idx}`)
  const columnBgColor = COLORS[column.color as ColorKey]?.desaturated ?? '#f3f4f6'

  useEffect(() => {
    if (isAdding) {
      titleInputRef.current?.focus()
    }
  }, [isAdding])

  const submitNewTask = () => {
    if (!newTask.title.trim()) {
      titleInputRef.current?.focus()
      return
    }
    onAddTask(column.id, newTask)
    setNewTask({ title: '', description: '' })
    setIsAdding(false)
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submitNewTask()
    } else if (event.key === 'Escape') {
      setIsAdding(false)
      setNewTask({ title: '', description: '' })
    }
  }


  return (
    <div
      ref={setDroppableNodeRef}
      className={cn(
        'flex h-full flex-none flex-col gap-3 rounded-lg bg-gray-100 p-3 shadow-sm transition-colors duration-200',
        'basis-[280px]',
        isOver && 'bg-gray-200'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-semibold">{column.title}</h3>
        <div className="flex items-center gap-1"> {/* Group buttons */}
          <ColorPicker
            variant="desaturated"
            value={column.color as ColorKey}
            onChange={colorKey => onColorChange(column.id, colorKey)}
          />
          {/* Delete Column Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:bg-red-100 hover:text-red-600"
            onClick={() => onDeleteRequest(column.id)} // Call request handler
            aria-label="Delete column"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Task List */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
         <div className="flex-1 space-y-2 overflow-y-auto px-1 py-1 min-h-[50px]">
          {column.tasks.map((task, idx) => (
            <TaskCard
              key={`${column.id}|${idx}`}
              task={task}
              isEditing={editingIndex === idx}
              onEditStart={() => setEditingIndex(idx)}
              onEditSave={updates => {
                onEditTask(column.id, idx, updates)
                setEditingIndex(null)
              }}
              onEditCancel={() => setEditingIndex(null)}
              // Pass task delete handler down if TaskCard implements it
              onDelete={() => onDeleteTask(column.id, idx)}
              sortableId={`${column.id}|${idx}`}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add Task Section */}
      {isAdding ? (
         <div
          className="space-y-2 rounded-md border bg-white p-2 shadow"
          style={{ backgroundColor: columnBgColor }}
        >
          <Input
            ref={titleInputRef}
            placeholder="Task title"
            value={newTask.title}
            onChange={e =>
              setNewTask(t => ({ ...t, title: e.target.value }))
            }
            onKeyDown={handleKeyDown}
            className="bg-white/80"
          />
          <Textarea
            placeholder="Description (optional)"
            value={newTask.description}
            onChange={e =>
              setNewTask(t => ({ ...t, description: e.target.value }))
            }
            onKeyDown={handleKeyDown}
            className="bg-white/80"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false)
                setNewTask({ title: '', description: '' })
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submitNewTask}>
              Add Task
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="mt-1 flex w-full items-center justify-center gap-1 text-gray-500 hover:text-gray-700"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      )}
    </div>
  )
}
