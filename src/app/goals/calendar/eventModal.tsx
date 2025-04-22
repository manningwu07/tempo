// src/app/goals/calendar/EventEditModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog"; // Assuming Shadcn Dialog
import type { CalendarEvent } from "./calendarView";

type EventEditModalProps = {
  isOpen: boolean;
  // Can be a full event for editing, or partial {start, end} for creation
  eventData: Partial<CalendarEvent> | { start: Date; end: Date } | null;
  onClose: () => void;
  onSave: (
    eventData: Omit<CalendarEvent, "id"> & { id?: string }
  ) => void;
  onDelete?: (id: string) => void; // Optional delete handler
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
  // Add other fields as needed: type, goalId, taskId, notifications

  const isEditing = eventData && "id" in eventData && eventData.id;

  useEffect(() => {
    if (eventData) {
      setTitle((eventData as Partial<CalendarEvent>).title ?? "New Event");
      setDescription((eventData as Partial<CalendarEvent>).description ??  "");
      setStartDate(eventData.start ? new Date(eventData.start) : null);
      setEndDate(eventData.end ? new Date(eventData.end) : null);
      // Reset other fields based on eventData
    } else {
      // Reset form when modal is closed or opened for creation without data
      setTitle("New Event");
      setDescription("");
      setStartDate(null);
      setEndDate(null);
    }
  }, [eventData]); // Re-run effect when eventData changes

  const handleSave = () => {
    if (!startDate || !endDate || !title) {
      // Add proper validation feedback
      console.error("Missing required fields");
      return;
    }

    const saveData: Omit<CalendarEvent, "id"> & { id?: string } = {
      title,
      description,
      start: startDate,
      end: endDate,
      // Add other fields: type, goalId, etc.
    };

    if (isEditing && eventData && "id" in eventData) {
      saveData.id = eventData.id; // Include ID if editing
    }

    onSave(saveData);
  };

  const handleDelete = () => {
    if (isEditing && eventData && "id" in eventData && onDelete) {
      onDelete(eventData.id!);
    }
  };

  // Render nothing if not open or no data (or handle initial state differently)
  if (!isOpen || !eventData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "Create Event"}</DialogTitle>
          {/* Optional: Add DialogDescription */}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* --- Form Fields --- */}
          {/* Replace with Shadcn Input */}
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add title"
            className="col-span-3"
          />

          {/* Replace with Shadcn Textarea */}
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description"
            className="col-span-3"
          />

          {/* Date/Time Pickers - VERY basic example, replace with robust pickers */}
          <div className="col-span-3 grid grid-cols-2 gap-2">
            <Input
              type="datetime-local" // Basic, consider Shadcn DatePicker + TimeInput
              value={
                startDate
                  ? startDate.toISOString().substring(0, 16)
                  : ""
              }
              onChange={(e) =>
                setStartDate(e.target.value ? new Date(e.target.value) : null)
              }
            />
            <Input
              type="datetime-local" // Basic, consider Shadcn DatePicker + TimeInput
               value={
                endDate
                  ? endDate.toISOString().substring(0, 16)
                  : ""
              }
              onChange={(e) =>
                setEndDate(e.target.value ? new Date(e.target.value) : null)
              }
            />
          </div>

          {/* Add fields for Type (Select), Goal/Task linking, Notifications */}
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
