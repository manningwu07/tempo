import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '~/types/kanbanBoard';

type Props = {
  id: string;
  task: Task;
  color: string;
};

export default function SortableItem({ id, task, color }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeft: `4px solid var(--tw-text-opacity)`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-2 p-2 bg-${color} bg-opacity-10 rounded cursor-grab`}
      {...attributes}
      {...listeners}
    >
      <strong className="block">{task.title}</strong>
      <p className="text-sm">{task.description}</p>
    </div>
  );
}
