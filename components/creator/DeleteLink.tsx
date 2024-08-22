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
      <div className="flex bg-white border rounded-lg shadow-sm p-2">
        <div className="flex flex-col gap-4 items-center justify-center bg-white w-full">
          <Image src={'/link-delete.svg'} width={0} height={0} alt="link-delete" className="w-auto h-auto" />
          <div className="font-bold text-lg p-2 mb-2">
            Do you want to delete this link?
          </div>
          <div className="flex w-full">
            <div className="flex flex-row w-full justify-between">
              <Button
                onClick={onClose}
                className="text-black rounded-md px-6 bg-gray-300 hover:bg-gray-400"
              >
                No, Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gray-800 text-white rounded-md px-6 hover:bg-black"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteLink;
