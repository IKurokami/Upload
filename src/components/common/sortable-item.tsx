import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  url: string;
  index: number;
  id: string;
}

export const SortableItem: React.FC<SortableItemProps> = ({
  url,
  index,
  id,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: "inline-block",
    opacity: isDragging ? 0.5 : 1,
    marginRight: "8px",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab relative"
    >
      <img src={url} alt="" className="w-18 border rounded-md" />
      <span className="absolute top-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
        {index + 1}
      </span>
    </div>
  );
};
