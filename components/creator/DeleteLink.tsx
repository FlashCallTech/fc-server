import React, { useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import { boolean } from "zod";

interface DeleteLinkProps {
  onClose: () => void;
  onSave: () => void;
  isLoading: boolean;
}

const DeleteLink: React.FC<DeleteLinkProps> = ({
  onClose,
  onSave,
  isLoading,
}) => {

  const handleSave = () => {
    onSave();
    isLoading;
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
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hoverScaleDownEffect"
              >
                No, Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-black text-white px-4 py-2 rounded-full hoverScaleDownEffect"
              >
                {isLoading ? (
                  <Image
                    src="/icons/loading-circle.svg"
                    alt="Loading..."
                    width={24}
                    height={24}
                    priority
                  />
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteLink;
