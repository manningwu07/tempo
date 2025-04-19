"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "~/types/kanbanBoard";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { MoreVertical, Trash2, GripVertical } from "lucide-react";
import { cn } from "~/lib/utils";
import { COLORS, type ColorKey } from "~/components/colorPicker";

interface TaskCardProps {
  task: Task;
  sortableId: string; // Required for dnd-kit
  isEditing?: boolean;
  isOverlay?: boolean; // Style differently when being dragged
  onEditStart?: () => void;
  onEditSave?: (updates: Partial<Task>) => void;
  onEditCancel?: () => void;
  onDelete?: () => void;
}

export function TaskCard({
  task,
  sortableId,
  isEditing = false,
  isOverlay = false,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
}: TaskCardProps) {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId, data: { type: "Task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const bgColor = COLORS[task.color as ColorKey]?.desaturated ?? "#ffffff";

  const handleSave = () => {
    onEditSave?.({ title: editTitle, description: editDesc });
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDesc(task.description);
    onEditCancel?.();
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: bgColor }}
      className={cn(
        'group relative rounded-md border p-2 shadow-sm', 
        isDragging && 'opacity-50',
        isOverlay && 'shadow-lg' 
      )}
      {...attributes} 
    >
      {/* Drag Handle */}
      <button
        {...listeners}
        className={cn(
          "focus-visible:ring-primary absolute top-1/2 -left-5 -translate-y-1/2 cursor-grab touch-none rounded p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2",
          isOverlay && "cursor-grabbing",
        )}
        aria-label="Drag task"
      >
        <GripVertical className="h-4 w-4 border-amber-500" />
      </button>

      {isEditing ? (
        // Edit Mode
        <div className="space-y-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="bg-white/80 text-sm"
            autoFocus
          />
          <Textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="bg-white/80 text-sm"
            rows={2}
          />
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        // View Mode
        <>
          <div className="absolute top-1 right-1 flex opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onEditStart}
              aria-label="Edit task"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-red-500 hover:text-red-600"
              onClick={onDelete}
              aria-label="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <h4 className="text-sm font-medium">{task.title}</h4>
          {task.description && (
            <p className="mt-1 text-xs text-gray-600">{task.description}</p>
          )}
        </>
      )}
    </div>
  );
}
