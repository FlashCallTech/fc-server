import React, { useState } from "react";
import axios from "axios";
import Image from "next/image";
import { backendBaseUrl } from "@/lib/utils";
import { useToast } from "../ui/use-toast";
import { QUERY_KEYS } from "@/lib/react-query/queryKeys";
import { useQueryClient } from "@tanstack/react-query";

interface UpdateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  creatorId: string;
  note: { _id: string; title?: string; text: string };
}

const UpdateNoteModal: React.FC<UpdateNoteModalProps> = ({
  isOpen,
  onClose,
  clientId,
  creatorId,
  note,
}) => {
  const [title, setTitle] = useState(note.title || "");
  const [text, setText] = useState(note.text);
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();

  const { toast } = useToast();

  const updateNote = async () => {
    if ((!title || !title.trim()) && (!text || !text.trim())) return;

    try {
      setSaving(true);
      const payload = { title, text };
      await axios.put(`${backendBaseUrl}/notes/update/${note._id}`, payload);
      toast({
        variant: "destructive",
        title: "Note Updated",
        description: "Your note has been successfully updated.",
        toastStatus: "positive",
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_NOTES, clientId, creatorId] });

      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Failed to update the note.",
        toastStatus: "negative",
      });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Note</h2>
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
        <div className="flex justify-end">
          <button
            className="px-4 py-2 mr-2 text-sm text-gray-700 bg-gray-200 rounded-full"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm text-white bg-black rounded-full"
            onClick={updateNote}
            disabled={saving}
          >
            {saving ? (
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

export default UpdateNoteModal;
