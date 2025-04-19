"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type UniqueIdentifier,
  type DragStartEvent,
  type DragEndEvent,
  // Import collision detection strategies if needed, closestCenter is often good
  closestCorners,
} from "@dnd-kit/core";
// arrayMove is needed for intra-column sorting
import { arrayMove } from "@dnd-kit/sortable";
import type { Column, Task } from "~/types/kanbanBoard";
import { KanbanColumn } from "./kanbanColumn";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import { TaskCard } from "./taskCard";

// default 3 columns
export const defaultColumns: Column[] = [
  { id: "todo", title: "To Do", color: "gray", tasks: [] },
  { id: "in-progress", title: "In Progress", color: "gray", tasks: [] },
  { id: "done", title: "Done", color: "gray", tasks: [] },
];

interface Props {
  initialColumns?: Column[];
}

export function KanbanBoard({ initialColumns }: Props) {
  const [columns, setColumns] = useState<Column[]>(
    initialColumns ?? defaultColumns,
  );
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Small distance prevents accidental drags on click
        distance: 5,
      },
    }),
  );

  // Helper to find task and its column by ID
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
    console.log('Drag Start Fired:', event.active.id);
    const { active } = event;
    const taskData = findTaskAndColumn(active.id);
    if (taskData) {
      setActiveId(active.id);
      setActiveTask(taskData.task);
    }
  };

  const handleDragOver = (event: DragEndEvent) => {
    // Handle dragging over a different column (optional, for live visual feedback)
    // This can get complex, often handleDragEnd is sufficient
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);

    if (!over) return; // Dropped outside any droppable area

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const [activeColId, activeTaskIdxStr] = activeIdStr.split("|");
    // 'over' can be a column ID or a task ID depending on where you drop
    const [overColId, overTaskIdxStr] = overIdStr.includes("|")
      ? overIdStr.split("|") // Dropped onto a task
      : [overIdStr, undefined]; // Dropped onto a column area

    if (!activeColId || !overColId) return; // Invalid IDs

    const activeTaskIndex = +activeTaskIdxStr!;
    const overTaskIndex =
      overTaskIdxStr !== undefined ? +overTaskIdxStr : undefined;

    setColumns((currentCols) => {
      const activeColIndex = currentCols.findIndex((c) => c.id === activeColId);
      const overColIndex = currentCols.findIndex((c) => c.id === overColId);

      if (activeColIndex === -1 || overColIndex === -1) return currentCols;

      const activeColumn = currentCols[activeColIndex]!;
      const overColumn = currentCols[overColIndex]!;
      const taskToMove = activeColumn.tasks[activeTaskIndex];

      if (!taskToMove) return currentCols;

      // Scenario 1: Moving within the same column
      if (activeColId === overColId) {
        // Ensure overTaskIndex is valid for arrayMove
        const targetIndex = overTaskIndex ?? overColumn.tasks.length - 1; // Default to end if dropped on column
        if (activeTaskIndex === targetIndex) return currentCols; // No change

        const reorderedTasks = arrayMove(
          activeColumn.tasks,
          activeTaskIndex,
          targetIndex,
        );
        const newCols = [...currentCols];
        newCols[activeColIndex] = { ...activeColumn, tasks: reorderedTasks };
        return newCols;
      }
      // Scenario 2: Moving to a different column
      else {
        const newCols = [...currentCols];

        // Remove from source
        const sourceTasks = activeColumn.tasks.filter(
          (_, i) => i !== activeTaskIndex,
        );
        newCols[activeColIndex] = { ...activeColumn, tasks: sourceTasks };

        // Add to destination
        const updatedTask = { ...taskToMove, color: overColumn.color }; // Update color
        const destTasks = [...overColumn.tasks];
        // If dropped onto a task, insert before/after; if onto column, append.
        const insertIndex = overTaskIndex ?? destTasks.length;
        destTasks.splice(insertIndex, 0, updatedTask);
        newCols[overColIndex] = { ...overColumn, tasks: destTasks };

        return newCols;
      }
    });
  };

  // --- Other handlers (handleColumnColor, handleAddTask, etc.) remain the same ---
  const handleColumnColor = (columnId: string, colorKey: string) => {
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
    setColumns((cols) =>
      cols.map((col) => {
        if (col.id === columnId) {
          const newTask: Task = { ...task, color: col.color };
          return { ...col, tasks: [...col.tasks, newTask] };
        }
        return col;
      }),
    );
  };

  const handleEditTask = (
    columnId: string,
    idx: number,
    updates: Partial<Task>,
  ) => {
    setColumns((cols) =>
      cols.map((col) =>
        col.id === columnId
          ? {
              ...col,
              tasks: col.tasks.map((t, i) =>
                i === idx ? { ...t, ...updates } : t,
              ),
            }
          : col,
      ),
    );
  };

  const handleDeleteTask = (columnId: string, idx: number) => {
    setColumns((cols) =>
      cols.map((col) =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter((_, i) => i !== idx) }
          : col,
      ),
    );
  };

  return (
    // DndContext wraps everything that participates in drag/drop
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners} // Or another strategy
      onDragStart={handleDragStart}
      // onDragOver={handleDragOver} // Optional for live feedback
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-1">
        {/* Map columns directly, SortableContext is now INSIDE KanbanColumn */}
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            onColorChange={handleColumnColor}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        ))}

        {/* Add Column Button */}
        <Button
          variant="outline"
          className="h-fit flex-shrink-0 border-dashed p-2"
          onClick={() =>
            setColumns((cols) => [
              ...cols,
              {
                id: `col-${Date.now()}`,
                title: "New Column",
                color: "gray",
                tasks: [],
              },
            ])
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Column
        </Button>
      </div>

      {/* Drag Overlay renders the TaskCard being dragged */}
      <DragOverlay>
        {activeTask && activeId ? (
          <TaskCard task={activeTask} isOverlay sortableId={String(activeId)} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
