// src/app/goals/calendar/EventQuickAddPopover.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger, // Keep trigger for structure, even if virtual
} from "~/components/ui/popover";
import type { CalendarEvent } from "~/types/calendar";
import { type ColorKey, ColorPicker } from "~/components/colorPicker";

const DEFAULT_TASK_COLOR: ColorKey = "blue"; // Default blue

type EventQuickAddPopoverProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    start: Date;
    end: Date;
    position: { x: number; y: number }; // Receive position
    initialTaskColor?: ColorKey; // Optional initial color
  };
  onSave: (eventData: {
    title: string;
    start: Date;
    end: Date;
    taskColor: ColorKey; // Popover always sets a task color
  }) => void;
  onOpenFullModal: (
    eventData: Partial<Omit<CalendarEvent, "id">> & {
      start: Date;
      end: Date;
    },
  ) => void;
};

export function EventQuickAddPopover({
  isOpen,
  onOpenChange,
  initialData,
  onSave,
  onOpenFullModal,
}: EventQuickAddPopoverProps) {
  const [title, setTitle] = useState("");
  const [taskColor, setTaskColor] = useState<ColorKey>(
    initialData.initialTaskColor ?? DEFAULT_TASK_COLOR,
  );
  // Keep track of start/end internally if needed for display/modification
  const start = initialData.start;
  const end = initialData.end;

  useEffect(() => {
    // Reset form when initial data changes (popover opens)
    setTitle(""); // Always start with empty title for quick add
    setTaskColor(initialData.initialTaskColor ?? DEFAULT_TASK_COLOR);
  }, [initialData]);

  const handleSave = () => {
    if (!title.trim()) {
      // TODO: Add better feedback
      console.warn("Title is required for quick add.");
      // Optionally focus the input or show a small error message
      return;
    }

    const eventToSave = {
      title: title.trim(),
      start: start,
      end: end,
      taskColor: taskColor,
      // description, goalColor etc. will be added in full modal if needed
    };
    onSave(eventToSave);
    // onOpenChange(false); // Hook's saveFromPopover handles closing
  };

  const handleOpenFullModal = () => {
    // Pass current state to the full modal
    onOpenFullModal({
      title: title.trim(), // Pass current title
      start,
      end,
      taskColor, // Pass selected color
      // Pass other fields if added here later
    });
    // onOpenChange(false); // Hook's requestOpenFullModal handles closing
  };

  // Simple positioning using inline styles on PopoverContent
  // Note: This doesn't account for screen edges well. More robust solutions exist.
  const popoverStyle = {
    position: "absolute" as const, // Use fixed if viewport-relative needed
    top: `${initialData.position.y}px`,
    left: `${initialData.position.x}px`,
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      {/* Virtual trigger - the popover is controlled externally */}
      <PopoverTrigger asChild>
        <div style={{ ...popoverStyle }} />
        {/* This invisible div acts as the anchor point */}
      </PopoverTrigger>

      <PopoverContent
        className="w-80"
        // style={popoverStyle} // Apply position style here
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus stealing from input
        side="top" // Try different sides based on where click occurs
        align="start"
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Add Event</h4>
            {/* Optional: Add description */}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <ColorPicker
                value={taskColor}
                onChange={setTaskColor}
                variant="saturated"
              />
              <Input
                id="quick-title"
                placeholder="Add title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1"
                autoFocus // Focus title input on open
              />
            </div>
            {/* Display Time Range */}
            <div className="text-muted-foreground pl-10 text-sm">
              {" "}
              {/* Indent time */}
              {start.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {end.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
              {/* Add date if spans multiple days */}
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={handleOpenFullModal}>
              More options
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
