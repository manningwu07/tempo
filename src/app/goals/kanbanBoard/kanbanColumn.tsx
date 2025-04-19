'use client'

import { useState } from 'react'
// Import SortableContext and strategy here
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable, // Keep useSortable for the COLUMN if you want columns to be draggable later
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core' // Import useDroppable
import { CSS } from '@dnd-kit/utilities'
import type { Column, Task } from '~/types/kanbanBoard'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Plus } from 'lucide-react'
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
  onDeleteTask: (columnId: string, taskIndex: number) => void
}

export function KanbanColumn({
  column,
  onColorChange,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: Props) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '' })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Make the column itself a droppable area
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'Column', column }, // Add data for context if needed
  })

  // Generate IDs for tasks within this column
  const taskIds = column.tasks.map((_, idx) => `${column.id}|${idx}`)

  const columnBgColor = COLORS[column.color as ColorKey]?.desaturated ?? '#f3f4f6'

  return (
    <div
      ref={setDroppableNodeRef} // Use the ref from useDroppable
      className={cn(
        'flex h-full w-[280px] flex-none flex-col gap-3 rounded-lg bg-gray-100 p-3 shadow-sm transition-colors duration-200',
        isOver && 'bg-gray-200' // Highlight when dragging over
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-semibold">{column.title}</h3>
        <ColorPicker
          variant="desaturated"
          value={column.color as ColorKey}
          onChange={colorKey => onColorChange(column.id, colorKey)}
        />
      </div>

      {/* Task List - Wrap tasks in SortableContext */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 overflow-y-auto px-1 py-1 min-h-[50px]">
          {column.tasks.map((task, idx) => (
            <TaskCard
              key={`${column.id}|${idx}`} // Ensure key is stable and unique
              task={task}
              isEditing={editingIndex === idx}
              onEditStart={() => setEditingIndex(idx)}
              onEditSave={updates => {
                onEditTask(column.id, idx, updates)
                setEditingIndex(null)
              }}
              onEditCancel={() => setEditingIndex(null)}
              onDelete={() => onDeleteTask(column.id, idx)}
              sortableId={`${column.id}|${idx}`} // Pass the unique ID
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
            placeholder="Task title"
            value={newTask.title}
            onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
            className="bg-white/80"
            autoFocus
          />
          <Textarea
            placeholder="Description (optional)"
            value={newTask.description}
            onChange={e =>
              setNewTask(t => ({ ...t, description: e.target.value }))
            }
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
            <Button
              size="sm"
              onClick={() => {
                if (!newTask.title.trim()) return
                onAddTask(column.id, newTask)
                setNewTask({ title: '', description: '' })
                setIsAdding(false)
              }}
            >
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
