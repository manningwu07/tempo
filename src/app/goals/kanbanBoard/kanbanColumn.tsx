'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type Column, type Task } from '~/types/kanbanBoard'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Plus, MoreVertical } from 'lucide-react'
import { ColorPicker } from '~/components/colorPicker'

type Props = {
  column: Column
  onColorChange: (columnId: string, colorKey: string) => void
  onAddTask: (columnId: string, task: Task) => void
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

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex w-[280px] flex-none flex-col gap-2 rounded bg-gray-50 p-3 shadow"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{column.title}</h3>
        <ColorPicker
          variant="desaturated"
          value={column.color}
          onChange={colorKey => onColorChange(column.id, colorKey)}
        />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {column.tasks.map((task, idx) => (
          <div key={idx} className="relative group rounded bg-white p-2 shadow">
            {/* edit/delete buttons */}
            <div className="absolute right-2 top-2 flex opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                variant="ghost"
                className="p-1"
                onClick={() => setEditingIndex(idx)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="p-1"
                onClick={() => onDeleteTask(column.id, idx)}
              >
                🗑️
              </Button>
            </div>

            {editingIndex === idx ? (
              <div className="space-y-2">
                <Input
                  value={task.title}
                  onChange={e =>
                    onEditTask(column.id, idx, { title: e.target.value })
                  }
                />
                <Textarea
                  value={task.description}
                  onChange={e =>
                    onEditTask(column.id, idx, {
                      description: e.target.value,
                    })
                  }
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingIndex(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setEditingIndex(null)}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h4 className="font-medium">{task.title}</h4>
                <p className="text-sm text-gray-600">{task.description}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {isAdding ? (
        <div className="space-y-2">
          <Input
            placeholder="Task title"
            value={newTask.title}
            onChange={e =>
              setNewTask(t => ({ ...t, title: e.target.value }))
            }
          />
          <Textarea
            placeholder="Description"
            value={newTask.description}
            onChange={e =>
              setNewTask(t => ({ ...t, description: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
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
                onAddTask(column.id, {
                  ...newTask,
                  color: column.color,
                })
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
          className="mt-2 flex items-center justify-center gap-1"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      )}
    </div>
  )
}
