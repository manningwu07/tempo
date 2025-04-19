'use client'

import { useState, useEffect } from 'react' // Import useEffect
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type UniqueIdentifier,
  type DragStartEvent,
  type DragEndEvent,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { Column, Task } from '~/types/kanbanBoard'
import { KanbanColumn } from './kanbanColumn'
import { Button } from '~/components/ui/button'
import { Plus } from 'lucide-react'
import { TaskCard } from './taskCard'
import { ConfirmationModal } from './confirmationModal'

const MAX_COLUMNS = 7 // Define limit

// default 3 columns factory function to ensure unique IDs if needed later
export const defaultColumns = [
  { id: 'todo', title: 'To Do', color: 'gray', tasks: [] },
  { id: 'in-progress', title: 'In Progress', color: 'gray', tasks: [] },
  { id: 'done', title: 'Done', color: 'gray', tasks: [] },
]

interface Props {
  goalId: string // Receive goalId
  initialColumns?: Column[]
  onColumnsChange: (newColumns: Column[]) => void // Callback to notify parent
}

export function KanbanBoard({ goalId, initialColumns, onColumnsChange }: Props) {
  // Use state derived from props, but manage updates locally and notify parent
  const [columns, setColumns] = useState<Column[]>(
    initialColumns ?? defaultColumns
  )
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null)

  // // Effect to update parent state when local columns change
  // useEffect(() => {
  //   onColumnsChange(columns)
  // }, [columns, onColumnsChange])


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const canAddColumn = columns.length < MAX_COLUMNS

  // --- findTaskAndColumn, handleDragStart, handleDragEnd remain the same ---
  const findTaskAndColumn = (
    id: UniqueIdentifier
  ): { task: Task; column: Column; taskIndex: number } | null => {
    const [colId, taskIdxStr] = String(id).split('|')
    if (!colId || taskIdxStr === undefined) return null
    const taskIndex = +taskIdxStr
    const column = columns.find(c => c.id === colId)
    const task = column?.tasks[taskIndex]
    if (!column || !task) return null
    return { task, column, taskIndex }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    // Ensure dragging is only for tasks within this board using goalId prefix if needed
    // For now, assume IDs are unique enough within the board context
    const taskData = findTaskAndColumn(active.id)
    if (taskData) {
      setActiveId(active.id)
      setActiveTask(taskData.task)
    } else {
      setActiveId(null); // Don't activate if it's not a task from this board
      setActiveTask(null);
    }
  }

   const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveTask(null)

    if (!active || !over) return // Check active exists too
    if (!String(active.id).includes('|')) return; // Ignore if not dragging a task

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)

    // Prevent dropping onto elements outside of this board's columns/tasks
    // This requires checking if over.id belongs to this board's columns/tasks
    const activeTaskData = findTaskAndColumn(active.id);
    if (!activeTaskData) return; // Dragged item isn't a task from this board

    let overColId: string | null = null;
    let overTaskIdxStr: string | undefined = undefined;

    if (overIdStr.includes('|')) { // Dropped onto a task
        const [parsedOverColId, parsedOverTaskIdxStr] = overIdStr.split('|');
        if (columns.some(c => c.id === parsedOverColId)) { // Check if task belongs to this board
            overColId = parsedOverColId!;
            overTaskIdxStr = parsedOverTaskIdxStr;
        }
    } else { // Dropped onto a column
        if (columns.some(c => c.id === overIdStr)) { // Check if column belongs to this board
            overColId = overIdStr;
        }
    }

    if (!overColId) return; // Dropped outside valid target in this board

    const [activeColId, activeTaskIdxStr] = activeIdStr.split('|')
    const activeTaskIndex = +activeTaskIdxStr!
    const overTaskIndex = overTaskIdxStr !== undefined ? +overTaskIdxStr : undefined


    // --- Rest of handleDragEnd logic remains the same ---
     setColumns(currentCols => {
      const activeColIndex = currentCols.findIndex(c => c.id === activeColId)
      const overColIndex = currentCols.findIndex(c => c.id === overColId)

      if (activeColIndex === -1 || overColIndex === -1) return currentCols

      const activeColumn = currentCols[activeColIndex]!
      const overColumn = currentCols[overColIndex]!
      const taskToMove = activeColumn.tasks[activeTaskIndex]

      if (!taskToMove) return currentCols

      // Scenario 1: Moving within the same column
      if (activeColId === overColId) {
        const targetIndex = overTaskIndex ?? overColumn.tasks.length // Use length if dropped on col
        if (activeTaskIndex === targetIndex) return currentCols

        const reorderedTasks = arrayMove(
          activeColumn.tasks,
          activeTaskIndex,
          targetIndex > activeTaskIndex ? targetIndex -1 : targetIndex // Adjust index for arrayMove
        )
        const newCols = [...currentCols]
        newCols[activeColIndex] = { ...activeColumn, tasks: reorderedTasks }
        return newCols
      }
      // Scenario 2: Moving to a different column
      else {
        const newCols = [...currentCols]
        const sourceTasks = activeColumn.tasks.filter((_, i) => i !== activeTaskIndex)
        newCols[activeColIndex] = { ...activeColumn, tasks: sourceTasks }

        const updatedTask = { ...taskToMove, color: overColumn.color }
        const destTasks = [...overColumn.tasks]
        const insertIndex = overTaskIndex ?? destTasks.length
        destTasks.splice(insertIndex, 0, updatedTask)
        newCols[overColIndex] = { ...overColumn, tasks: destTasks }
        return newCols
      }
    })
  }


  // --- handleColumnColor, handleAddTask, handleEditTask remain the same ---
   const handleColumnColor = (columnId: string, colorKey: ColorKey) => {
    setColumns(cols =>
      cols.map(col =>
        col.id === columnId
          ? {
              ...col,
              color: colorKey,
              tasks: col.tasks.map(task => ({ ...task, color: colorKey })),
            }
          : col
      )
    )
  }

  const handleAddTask = (columnId: string, task: Omit<Task, 'color'>) => {
    setColumns(cols =>
      cols.map(col => {
        if (col.id === columnId) {
          const newTask: Task = { ...task, color: col.color }
          return { ...col, tasks: [...col.tasks, newTask] }
        }
        return col
      })
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

  // --- Delete Column Handlers ---
  const handleDeleteColumnRequest = (columnId: string) => {
    setDeletingColumnId(columnId)
    setIsModalOpen(true)
  }

  const handleConfirmDeleteColumn = () => {
    if (deletingColumnId) {
      setColumns(cols => cols.filter(col => col.id !== deletingColumnId))
    }
    setIsModalOpen(false)
    setDeletingColumnId(null)
  }

  const handleCancelDelete = () => {
    setIsModalOpen(false)
    setDeletingColumnId(null)
  }

  return (
    <> {/* Use Fragment to wrap DndContext and Modal */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-wrap gap-4 p-4"> {/* Added padding */}
          {columns.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              onColorChange={handleColumnColor}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={() => {}} // Task deletion is handled by TaskCard now
              onDeleteRequest={handleDeleteColumnRequest} // Pass delete request handler
            />
          ))}

          {/* Add Column Button Area */}
          <div className="flex-shrink-0 basis-[280px] p-3">
            <Button
              variant="outline"
              className="h-full w-full border-dashed"
              onClick={() =>
                setColumns(cols => [
                  ...cols,
                  {
                    id: `col-${goalId}-${Date.now()}`, // Make ID more unique
                    title: 'New Column',
                    color: 'gray',
                    tasks: [],
                  },
                ])
              }
              disabled={!canAddColumn} // Disable based on limit
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Column {canAddColumn ? '' : `(Max ${MAX_COLUMNS})`}
            </Button>
          </div>
        </div>

        <DragOverlay>
          {activeTask && activeId ? (
            <TaskCard task={activeTask} isOverlay sortableId={String(activeId)} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDeleteColumn}
        title="Delete Column?"
        description={`Are you sure you want to delete this column and all its tasks? This action cannot be undone.`}
      />
    </>
  )
}

// Need ColorKey type if not globally available
type ColorKey = import('~/components/colorPicker').ColorKey;

