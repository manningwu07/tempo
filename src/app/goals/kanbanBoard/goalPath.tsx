"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Goal, Column } from "~/types/kanbanBoard";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ColorPicker, COLORS, type ColorKey } from "~/components/colorPicker";
import {
  GripVertical,
  Trash2,
  Check,
  X as CancelIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { KanbanBoard } from "./kanbanBoard";

// Interface definition (as provided before)
interface GoalItemProps {
  goal: Goal;
  isEditing: boolean;
  isDragging?: boolean;
  onStartEdit: (id: string) => void;
  onSaveEdit: (id: string, newTitle: string) => void;
  onCancelEdit: () => void;
  onDeleteRequest: (id: string) => void;
  onUpdateGoalColor: (id: string, color: ColorKey) => void;
  onUpdateGoalColumns: (id: string, columns: Column[]) => void;
}

// Component implementation (as provided before)
export function GoalItem({
  goal,
  isEditing,
  isDragging,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteRequest,
  onUpdateGoalColor,
  onUpdateGoalColumns,
}: GoalItemProps) {
  const [editTitle, setEditTitle] = useState(goal.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isSorting,
  } = useSortable({ id: goal.id, data: { type: "Goal", goal } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 250ms ease",
    opacity: isSorting ? 0.5 : 1,
    zIndex: isSorting ? 10 : "auto",
  };

  const handleSave = () => {
    if (editTitle.trim()) {
      onSaveEdit(goal.id, editTitle.trim());
    } else {
      setEditTitle(goal.title);
      onCancelEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    else if (e.key === "Escape") {
      setEditTitle(goal.title);
      onCancelEdit();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-white shadow transition-shadow duration-200",
        isDragging && "shadow-xl",
      )}
    >
      {/* Goal Header */}
      <div
        className="flex items-center justify-between border-b border-l-4 px-4 py-2"
        style={{
          borderLeftColor: COLORS[goal.color as ColorKey]?.saturated ?? "#ccc",
        }}
      >
        {/* Drag Handle */}
        <button
          {...listeners}
          className="absolute top-0 bottom-0 -left-0 z-10 flex cursor-grab items-center px-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          aria-label="Drag goal"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Title / Edit Input */}
        <div className="flex-1 pl-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-lg font-bold"
                autoFocus
                onBlur={handleSave}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={handleSave}
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  setEditTitle(goal.title);
                  onCancelEdit();
                }}
              >
                <CancelIcon className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ) : (
            <h2
              className="cursor-pointer text-lg font-bold hover:text-blue-600"
              onClick={() => {
                setEditTitle(goal.title);
                onStartEdit(goal.id);
              }}
              title="Click to rename"
            >
              {goal.title}
            </h2>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <ColorPicker
            variant="saturated"
            value={goal.color}
            onChange={(colorKey) => onUpdateGoalColor(goal.id, colorKey)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:bg-red-100 hover:text-red-600"
            onClick={() => onDeleteRequest(goal.id)}
            aria-label="Delete goal"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Kanban Board */}
      <KanbanBoard
        goalId={goal.id}
        initialColumns={goal.columns}
        onColumnsChange={(newColumns) =>
          onUpdateGoalColumns(goal.id, newColumns)
        }
      />
    </div>
  );
}
