import React, { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import Image from "next/image";

interface LinkActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const LinkActions: React.FC<LinkActionsProps> = ({ onEdit, onDelete, onClose }) => {
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [onClose]);

  return (
    <div
      ref={actionsRef}
      className="absolute z-10 flex flex-col items-start bg-white shadow-lg border rounded-lg py-1 px-3 right-0 mt-9 mr-4 w-40"
    >
      <Button
        className="w-full font-bold text-left border-b rounded-none border-gray-200 flex items-center justify-start gap-2 py-2 px-2 hover:bg-gray-100"
        onClick={onEdit}
      >
        <Image src={'/edit-link.svg'} width={16} height={16} alt="edit" />
        <span>Edit Link</span>
      </Button>
      <Button
        className="w-full font-bold text-left flex rounded-none items-center justify-start gap-2 py-2 px-2 hover:bg-gray-100"
        onClick={onDelete}
      >
        <Image src={'/delete-link.svg'} width={16} height={16} alt="delete" />
        <span>Delete Link</span>
      </Button>
    </div>
  );
};

export default LinkActions;
