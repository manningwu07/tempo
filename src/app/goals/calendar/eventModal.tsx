// src/app/goals/calendar/EventEditModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label"; // Use Label for accessibility
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";
import type { CalendarEvent } from "./calendarView";
import { ColorPicker, type ColorKey } from "~/components/colorPicker";

// TODO: Import a proper Date/Time Picker component
// import { DateTimePicker } from "~/components/ui/datetime-picker";

const DEFAULT_TASK_COLOR: ColorKey = "blue";

type EventEditModalProps = {
  isOpen: boolean;
  eventData: (Partial<CalendarEvent> | { start: Date; end: Date }) & {
    taskColor?: ColorKey;
    goalColor?: ColorKey;
  } | null; // Adjusted type
  onClose: () => void;
  onSave: (
    eventData: Omit<CalendarEvent, "id" | "taskColor"> & {
      id?: string;
      taskColor?: ColorKey;
    },
  ) => void;
  onDelete?: (id: string) => void;
};

export function EventEditModal({
  isOpen,
  eventData,
  onClose,
  onSave,
  onDelete,
}: EventEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [taskColor, setTaskColor] = useState<ColorKey>(DEFAULT_TASK_COLOR);
  const [goalColor, setGoalColor] = useState<ColorKey | undefined>(undefined);

  const isEditing = eventData && "id" in eventData && eventData.id;

  useEffect(() => {
    if (eventData) {
      setTitle((eventData as Partial<CalendarEvent>).title ?? "");
      setDescription((eventData as Partial<CalendarEvent>).description ?? "");
      setStartDate(eventData.start ? new Date(eventData.start) : null);
      setEndDate(eventData.end ? new Date(eventData.end) : null);
      // Set colors, providing defaults if necessary
      setTaskColor(eventData.taskColor ?? DEFAULT_TASK_COLOR);
      setGoalColor(eventData.goalColor); // Can be undefined
    } else {
      // Reset form - should ideally not happen if modal opens with data
      setTitle("");
      setDescription("");
      setStartDate(null);
      setEndDate(null);
      setTaskColor(DEFAULT_TASK_COLOR);
      setGoalColor(undefined);
    }
  }, [eventData]);

  const handleSave = () => {
    if (!startDate || !endDate || !title.trim()) {
      console.error("Missing required fields"); // TODO: Better validation UI
      return;
    }

    const saveData = {
      title: title.trim(),
      description,
      start: startDate,
      end: endDate,
      taskColor: taskColor,
      goalColor: goalColor, // Include goal color (can be undefined)
      // Add other fields: type, goalId, etc. from state if added
    };

    // Add id only if editing
    const finalData = isEditing && eventData && "id" in eventData
        ? { ...saveData, id: eventData.id }
        : saveData;


    onSave(finalData);
  };

  const handleDelete = () => {
    if (isEditing && eventData && "id" in eventData && onDelete) {
      onDelete(eventData.id!);
    }
  };

  if (!isOpen || !eventData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Title Input */}
          <div className="col-span-full">
            <Label htmlFor="title" className="sr-only">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title"
            />
          </div>

          {/* Date/Time Pickers */}
          <div className="col-span-full grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="start-date">Start</Label>
              {/* TODO: Replace with <DateTimePicker date={startDate} setDate={setStartDate} /> */}
              <Input
                id="start-date"
                type="datetime-local"
                value={startDate ? toDatetimeLocal(startDate) : ""}
                onChange={(e) =>
                  setStartDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-date">End</Label>
              {/* TODO: Replace with <DateTimePicker date={endDate} setDate={setEndDate} /> */}
              <Input
                id="end-date"
                type="datetime-local"
                value={endDate ? toDatetimeLocal(endDate) : ""}
                onChange={(e) =>
                  setEndDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="mt-1"
              />
            </div>
          </div>

          {/* Description */}
          <div className="col-span-full">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description"
              className="mt-1"
            />
          </div>

          {/* Color Pickers */}
          <div className="col-span-full grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Event Color</Label>
              <ColorPicker
                value={taskColor}
                onChange={setTaskColor}
                variant="saturated"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Goal Color (Stripe)</Label>
              <ColorPicker
                value={goalColor}
                onChange={setGoalColor} // Allows unsetting if needed? Check ColorPicker logic
                variant="saturated"
                className="mt-1"
              />
              {/* Optional: Add a button to clear goalColor */}
            </div>
          </div>

          {/* Add fields for Guests, Location, Meet, Notifications, etc. here */}
        </div>
        <DialogFooter className="sm:justify-between">
          <div>
            {isEditing && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toDatetimeLocal(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}