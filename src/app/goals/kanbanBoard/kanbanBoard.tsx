'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Column, Task } from '~/types/kanbanBoard'
import { KanbanColumn } from './kanbanColumn'
import { Button } from '~/components/ui/button'
import { Plus } from 'lucide-react'

// default 3 columns
export const defaultColumns: Column[] = [
  { id: 'todo', title: 'To Do', color: 'gray', tasks: [] },
  { id: 'in-progress', title: 'In Progress', color: 'gray', tasks: [] },
  { id: 'done', title: 'Done', color: 'gray', tasks: [] },
]

interface Props {
  title: string
  initialColumns?: Column[]
}

export function KanbanBoard({ initialColumns }: Props) {
  const [columns, setColumns] = useState<Column[]>(
    initialColumns ?? defaultColumns
  )
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  function handleDragEnd({ active, over }: any) {
    if (!over) return
    const [fromCol, fromIdx] = active.id.split('|')
    const [toCol, toIdx] = over.id.split('|')
    if (fromCol === toCol) {
      setColumns(cols =>
        cols.map(col =>
          col.id === fromCol
            ? { ...col, tasks: arrayMove(col.tasks, +fromIdx, +toIdx) }
            : col
        )
      )
    } else {
      let moved: Task
      setColumns(cols =>
        cols.map(col => {
          if (col.id === fromCol) {
            moved = col.tasks[+fromIdx]!
            return {
              ...col,
              tasks: col.tasks.filter((_, i) => i !== +fromIdx),
            }
          }
          if (col.id === toCol) {
            const newTasks = [...col.tasks]
            newTasks.splice(+toIdx, 0, moved!)
            return { ...col, tasks: newTasks }
          }
          return col
        })
      )
    }
    setActiveId(null)
  }

  const handleColumnColor = (columnId: string, colorKey: string) => {
    setColumns(cols =>
      cols.map(col =>
        col.id === columnId ? { ...col, color: colorKey } : col
      )
    )
  }

  const handleAddTask = (columnId: string, task: Task) => {
    setColumns(cols =>
      cols.map(col =>
        col.id === columnId
          ? { ...col, tasks: [...col.tasks, task] }
          : col
      )
    )
  }

  const handleEditTask = (
    columnId: string,
    idx: number,
    updates: Partial<Task>
  ) => {
    setColumns(cols =>
      cols.map(col =>
        col.id === columnId
          ? {
              ...col,
              tasks: col.tasks.map((t, i) =>
                i === idx ? { ...t, ...updates } : t
              ),
            }
          : col
      )
    )
  }

  const handleDeleteTask = (columnId: string, idx: number) => {
    setColumns(cols =>
      cols.map(col =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter((_, i) => i !== idx) }
          : col
      )
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded bg-white p-4 shadow">
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        onDragStart={({ active }) => setActiveId(active.id)}
      >
        <div className="flex gap-4 overflow-x-auto">
          <SortableContext
            items={columns.flatMap(col =>
              col.tasks.map((_, i) => `${col.id}|${i}`)
            )}
            strategy={verticalListSortingStrategy}
          >
            {columns.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                onColorChange={handleColumnColor}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </SortableContext>

          <Button
            variant="outline"
            className="flex-shrink-0 border-dashed"
            onClick={() =>
              setColumns(cols => [
                ...cols,
                {
                  id: `col-${Date.now()}`,
                  title: 'New Column',
                  color: 'gray',
                  tasks: [],
                },
              ])
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Column
          </Button>
        </div>

        <DragOverlay>
          {/* Optional: render a drag preview */}
          {activeId ? (
            <div className="rounded bg-white p-2 shadow-lg">
              {/* you could lookup active task text here */}
              Dragging…
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
