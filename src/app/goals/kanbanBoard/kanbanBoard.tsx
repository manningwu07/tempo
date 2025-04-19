"use client";

import { useState, useEffect } from "react"; // Import useEffect
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
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Column, Task } from "~/types/kanbanBoard";
import { KanbanColumn } from "./kanbanColumn";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import { TaskCard } from "./taskCard";
import { ConfirmationModal } from "./confirmationModal";

const MAX_COLUMNS = 7; // Define limit

// default 3 columns factory function to ensure unique IDs if needed later
// This allows user to change their default settings (may need to move into different file for "settings" page)
export const defaultColumns = [
  { id: "todo", title: "To Do", color: "red", tasks: [] },
  { id: "in-progress", title: "In Progress", color: "orange", tasks: [] },
  { id: "done", title: "Done", color: "yellow", tasks: [] },
];

interface Props {
  goalId: string; // Receive goalId
  initialColumns?: Column[];
  onColumnsChange: (newColumns: Column[]) => void;
}

export function KanbanBoard({
  goalId,
  initialColumns,
  onColumnsChange,
}: Props) {
  // Use state derived from props, but manage updates locally and notify parent
  const [columns, setColumns] = useState<Column[]>(
    initialColumns ?? defaultColumns,
  );

  const updateColumns = (newCols: Column[]) => {
    setColumns(newCols);
    onColumnsChange(newCols);
  };

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);

  // // Effect to update parent state when local columns change
  // useEffect(() => {
  //   onColumnsChange(columns)
  // }, [columns, onColumnsChange])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const canAddColumn = columns.length < MAX_COLUMNS;

  // --- findTaskAndColumn, handleDragStart, handleDragEnd remain the same ---
  const findTaskAndColumn = (
    id: UniqueIdentifier,
  ): { task: Task; column: Column; taskIndex: number } | null => {
    const [colId, taskIdxStr] = String(id).split("|");
    if (!colId || taskIdxStr === undefined) return null;
    const taskIndex = +taskIdxStr;
    const column = columns.find((c) => c.id === colId);
    const task = column?.tasks[taskIndex];
    if (!column || !task) return null;
    return { task, column, taskIndex };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Ensure dragging is only for tasks within this board using goalId prefix if needed
    // For now, assume IDs are unique enough within the board context
    const taskData = findTaskAndColumn(active.id);
    if (taskData) {
      setActiveId(active.id);
      setActiveTask(taskData.task);
    } else {
      setActiveId(null); // Don't activate if it's not a task from this board
      setActiveTask(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    // reset drag state
    setActiveId(null)
    setActiveTask(null)
  
    if (!active || !over) return
    const activeIdStr = String(active.id)
    const overIdStr   = String(over.id)
  
    // ignore drags that aren't tasks (we encode tasks as "colId|taskIdx")
    if (!activeIdStr.includes('|')) return
  
    // make sure the active item is really one of our tasks
    const activeTaskData = findTaskAndColumn(active.id)
    if (!activeTaskData) return
  
    // figure out which column/task we dropped onto
    let overColId: string | null = null
    let overTaskIdxStr: string | undefined
  
    if (overIdStr.includes('|')) {
      const [cId, tIdx] = overIdStr.split('|')
      if (columns.some(c => c.id === cId)) {        
        overColId = cId as string
        overTaskIdxStr = tIdx
      }
    } else {
      if (columns.some(c => c.id === overIdStr)) {
        overColId = overIdStr
      }
    }
    if (!overColId) return
  
    const [activeColId, activeTaskIdxStr] = activeIdStr.split('|')
    const activeTaskIndex = Number(activeTaskIdxStr)
    const overTaskIndex   = overTaskIdxStr !== undefined
      ? Number(overTaskIdxStr)
      : undefined
  
    // locate source/target columns & the task to move
    const activeColIndex = columns.findIndex(c => c.id === activeColId)
    const overColIndex   = columns.findIndex(c => c.id === overColId)
    if (activeColIndex === -1 || overColIndex === -1) return
  
    const activeColumn = columns[activeColIndex]
    const overColumn   = columns[overColIndex]
    const taskToMove   = activeColumn?.tasks[activeTaskIndex]
    if (!taskToMove) return
  
    let newCols: Column[]
  
    if (activeColId === overColId) {
      // same column → reorder
      const targetIndex = overTaskIndex ?? activeColumn.tasks.length
      if (activeTaskIndex === targetIndex) return
  
      const reordered = arrayMove(
        activeColumn.tasks,
        activeTaskIndex,
        targetIndex > activeTaskIndex ? targetIndex - 1 : targetIndex
      )
      newCols = [...columns]
      newCols[activeColIndex] = {
        ...activeColumn,
        tasks: reordered,
      }
    } else {
      // moving across columns
      const newColsCopy = [...columns]
  
      // remove from source
      const sourceTasks = activeColumn.tasks.filter((_, i) => i !== activeTaskIndex)
      newColsCopy[activeColIndex] = {
        ...activeColumn,
        tasks: sourceTasks,
      }
  
      // insert into destination (and inherit new column color)
      const updatedTask = { ...taskToMove, color: overColumn!.color }
      const destTasks = [...overColumn!.tasks]
      const insertAt = overTaskIndex ?? destTasks.length
      destTasks.splice(insertAt, 0, updatedTask)
      newColsCopy[overColIndex] = {
        ...overColumn,
        tasks: destTasks,
      } as Column
  
      newCols = newColsCopy
    }
  
    // **the single source of truth update**
    updateColumns(newCols)
  }

  // --- handleColumnColor, handleAddTask, handleEditTask remain the same ---
  const handleColumnColor = (columnId: string, colorKey: ColorKey) => {
    setColumns((cols) =>
      cols.map((col) =>
        col.id === columnId
          ? {
              ...col,
              color: colorKey,
              tasks: col.tasks.map((task) => ({ ...task, color: colorKey })),
            }
          : col,
      ),
    );
  };

  const handleAddTask = (columnId: string, task: Omit<Task, "color">) => {
    const newCols = columns.map((col) =>
      col.id === columnId
        ? { ...col, tasks: [...col.tasks, { ...task, color: col.color }] }
        : col,
    );
    updateColumns(newCols);
  };

  const handleEditTask = (
    columnId: string,
    idx: number,
    updates: Partial<Task>,
  ) => {
    const newCols = columns.map((col) =>
      col.id === columnId
        ? {
            ...col,
            tasks: col.tasks.map((t, i) =>
              i === idx ? { ...t, ...updates } : t,
            ),
          }
        : col,
    );
    updateColumns(newCols);
  };

  const handleDeleteTask = (columnId: string, idx: number) => {
    const newCols = columns.map((col) =>
      col.id === columnId
        ? { ...col, tasks: col.tasks.filter((_, i) => i !== idx) }
        : col,
    );
    updateColumns(newCols);
  };

  const handleRenameColumn = (columnId: string, newTitle: string) => {
    const newCols = columns.map((col) =>
      col.id === columnId ? { ...col, title: newTitle } : col,
    );
    updateColumns(newCols);
  };

  // --- Delete Column Handlers ---
  const handleDeleteColumnRequest = (columnId: string) => {
    setDeletingColumnId(columnId);
    setIsModalOpen(true);
  };

  const handleConfirmDeleteColumn = () => {
    if (!deletingColumnId) return
    const newCols = columns.filter(c => c.id !== deletingColumnId)
    updateColumns(newCols)

    setIsModalOpen(false);
    setDeletingColumnId(null);
  };

  const handleCancelDelete = () => {
    setIsModalOpen(false);
    setDeletingColumnId(null);
  };

  return (
    <>
      {" "}
      {/* Use Fragment to wrap DndContext and Modal */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-wrap gap-4 p-4">
          {" "}
          {/* Added padding */}
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              onColorChange={handleColumnColor}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onRenameColumn={handleRenameColumn}
              onDeleteRequest={handleDeleteColumnRequest}
            />
          ))}
          {/* Add Column Button Area */}
          <div className="flex-shrink-0 basis-[280px] p-3">
            <Button
              variant="outline"
              className="h-full w-full border-dashed"
              onClick={() =>
                setColumns((cols) => [
                  ...cols,
                  {
                    id: `col-${goalId}-${Date.now()}`, // Make ID more unique
                    title: "New Column",
                    color: "gray",
                    tasks: [],
                  },
                ])
              }
              disabled={!canAddColumn} // Disable based on limit
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Column {canAddColumn ? "" : `(Max ${MAX_COLUMNS})`}
            </Button>
          </div>
        </div>

        <DragOverlay>
          {activeTask && activeId ? (
            <TaskCard
              task={activeTask}
              isOverlay
              sortableId={String(activeId)}
            />
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
  );
}

// Need ColorKey type if not globally available
type ColorKey = import("~/components/colorPicker").ColorKey;
