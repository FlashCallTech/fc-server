import React, { useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";

interface DeleteLinkProps {
  onClose: () => void;
  onSave: () => void;
}

const DeleteLink: React.FC<DeleteLinkProps> = ({
  onClose,
  onSave,
}) => {

  const handleSave = () => {
    onClose();
    onSave();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40">
      <div className="flex bg-white border rounded-lg shadow-sm p-4">
        <div className="flex flex-col gap-4 items-center justify-center bg-white w-full">
          <Image src={'/link-delete.svg'} width={0} height={0} alt="link-delete" className="w-auto h-auto" />
          <div className="font-bold text-lg p-2 mb-2">
            Do you want to delete this link?
          </div>
          <div className="flex w-full">
            <div className="flex flex-row w-full gap-2 justify-end text-sm">
              <button
                onClick={onClose}
                className="text-black border border-gray-300 rounded-md p-2 bg-white hoverScaleDownEffect"
              >
                No, Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-black text-white rounded-md p-2 hoverScaleDownEffect"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteLink;
