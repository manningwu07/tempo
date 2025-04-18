// components/KanbanBoard.tsx
import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useComponentSize } from '~/hooks/useComponentSize'
import type { Column, Task } from '~/types/kanbanBoard'
import SortableItem from './sortableItem'

// default columns factory
export const defaultColumns: Column[] = [
  { id: 'todo', title: 'To Do', tasks: [], color: 'gray-300' },
  { id: 'in-progress', title: 'In Progress', tasks: [], color: 'gray-500' },
  { id: 'done', title: 'Done', tasks: [], color: 'gray-700' },
]

type Props = {
  title: string
  initialColumns?: Column[]
}

export default function KanbanBoard({ title, initialColumns }: Props) {
  const [columns, setColumns] = useState<Column[]>(
    initialColumns ?? defaultColumns
  )

  // track which column is showing the "add task" form
  const [addingTaskFor, setAddingTaskFor] = useState<string | null>(null)
  const [taskForm, setTaskForm] = useState<{ title: string; description: string }>({
    title: '',
    description: '',
  })

  // component‐width‐aware layout
  const { ref, width } = useComponentSize<HTMLDivElement>()
  const colsToShow = width < 400 ? 1 : width < 800 ? 2 : columns.length

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return

    const [fromCol, fromIdx] = (active.id as string).split('|')
    const [toCol, toIdx] = (over.id as string).split('|')
    let moved: Task | undefined

    setColumns(cols =>
      cols.map(col => {
        if (col.id === fromCol) {
          moved = col.tasks[+fromIdx!]
          return { ...col, tasks: col.tasks.filter((_, i) => i !== +fromIdx!) }
        }
        if (col.id === toCol && moved) {
          const newTasks = [...col.tasks]
          newTasks.splice(+toIdx!, 0, moved)
          return { ...col, tasks: newTasks }
        }
        return col
      })
    )
  }

  function handleAddTask(colId: string) {
    if (!taskForm.title.trim()) return
    setColumns(cols =>
      cols.map(col =>
        col.id === colId
          ? {
              ...col,
              tasks: [
                ...col.tasks,
                { ...taskForm, color: col.color },
              ],
            }
          : col
      )
    )
    setAddingTaskFor(null)
    setTaskForm({ title: '', description: '' })
  }

  return (
    <div className="p-4 bg-white rounded shadow" ref={ref}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div
        className="flex gap-4 overflow-x-auto"
        style={{ flexWrap: colsToShow < columns.length ? 'nowrap' : 'wrap' }}
      >
        {columns.map(col => (
          <div
            key={col.id}
            className="bg-gray-50 rounded p-2 flex-shrink-0"
            style={{ width: `${100 / colsToShow}%`, minWidth: 250 }}
          >
            <h3 className={`font-semibold mb-2 text-${col.color}`}>{col.title}</h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={col.tasks.map((_, i) => `${col.id}|${i}`)}
                strategy={verticalListSortingStrategy}
              >
                {col.tasks.map((task, i) => (
                  <SortableItem
                    key={`${col.id}|${i}`}
                    id={`${col.id}|${i}`}
                    task={task}
                    color={col.color}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Add Task UI */}
            <div className="mt-2">
              {addingTaskFor === col.id ? (
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    handleAddTask(col.id)
                  }}
                  className="space-y-1"
                >
                  <input
                    className="w-full px-2 py-1 border rounded"
                    placeholder="Title"
                    value={taskForm.title}
                    onChange={e =>
                      setTaskForm(f => ({ ...f, title: e.target.value }))
                    }
                  />
                  <input
                    className="w-full px-2 py-1 border rounded"
                    placeholder="Description"
                    value={taskForm.description}
                    onChange={e =>
                      setTaskForm(f => ({ ...f, description: e.target.value }))
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 border rounded"
                      onClick={() => setAddingTaskFor(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => setAddingTaskFor(col.id)}
                >
                  + Add Task
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
