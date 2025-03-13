import React, { useState } from "react";
import axios from "axios";
import Image from "next/image"; // Only if you want to use Image for a loading icon, else remove
import { useToast } from "../ui/use-toast"; // Adjust the import if needed
import { backendBaseUrl } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/react-query/queryKeys";

interface AddNoteModalProps {
  isOpen: boolean;                      // Whether the modal is visible
  onClose: () => void;                  // Function to close the modal
  clientId: string;                     // Client ID
  creatorId: string;                    // Creator ID
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  clientId,
  creatorId,
}) => {
  const [title, setTitle] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [savingNote, setSavingNote] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const { toast } = useToast();

  const createNote = async () => {
    // Ensure both fields have content
    if (!text.trim()) return;

    try {
      setSavingNote(true);

      const payload = { clientId, creatorId, title, text };
      // Save the new note
      await axios.post(`${backendBaseUrl}/notes/create`, payload);

      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_NOTES, clientId, creatorId] });

      // Clear fields
      setTitle("");
      setText("");

      // Show success toast
      toast({
        variant: "destructive",
        title: "Note Saved",
        description: "Your note has been successfully updated.",
        toastStatus: "positive",
      });

      // Close modal after saving
      onClose();
    } catch (error) {
      // Show error toast
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Failed to save the note.",
        toastStatus: "negative",
      });
      console.error("Error creating note:", error);
    } finally {
      setSavingNote(false);
    }
  };

  // If modal should not be shown, return nothing
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* Modal container */}
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        {/* Header */}
        <h2 className="text-lg font-semibold mb-4">Add Note</h2>

        {/* Title input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Text textarea */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Text</label>
          <textarea
            className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={4}
            placeholder="Enter note text..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            type="button"
            className="px-4 py-2 mr-2 text-sm text-gray-700 bg-gray-200 rounded-full"
            onClick={onClose}
            disabled={savingNote}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm text-white bg-black rounded-full"
            onClick={createNote}
            disabled={savingNote}
          >
            {savingNote ? (
              // If you want a loading spinner icon:
              <Image
                src="/icons/loading-circle.svg"
                alt="Loading..."
                width={20}
                height={20}
                priority
              />
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNoteModal;
