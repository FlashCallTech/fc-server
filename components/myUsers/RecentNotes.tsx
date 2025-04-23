import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useToast } from '../ui/use-toast';
import axios from 'axios';
import { backendBaseUrl } from '@/lib/utils';

type Note = {
    _id: string;
    text: string;
    createdAt: string;
};

type Props = {
    clientId: string;
    creatorId: string;
};

const RecentNotes: React.FC<Props> = ({ clientId, creatorId }) => {
    const [text, setText] = useState<string>("");
    const [savingNote, setSavingNote] = useState<boolean>(false);
    const [notes, setNotes] = useState<Note[]>([]);

    const { toast } = useToast();

    useEffect(() => {
        const getNotes = async () => {
            try {
                const response = await axios.get(`${backendBaseUrl}/notes/get/${clientId}/${creatorId}`);
                setNotes(response.data);
            } catch (error) {
                console.log(error);
            }
        };

        if (clientId && creatorId) getNotes();
    }, [clientId, creatorId]);

    const createNote = async () => {
        if (!text || !text.trim()) return;

        try {
            setSavingNote(true);
            const payload = { clientId, creatorId, text };

            await axios.post(`${backendBaseUrl}/notes/create`, payload);
            setText("");

            // Re-fetch notes to display the new one
            const response = await axios.get(`${backendBaseUrl}/notes/get/${clientId}/${creatorId}`);
            setNotes(response.data);

            toast({
                variant: "destructive",
                title: "Note Saved",
                description: "Your note has been successfully saved.",
                toastStatus: "positive",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed",
                description: "Failed to save the note.",
                toastStatus: "negative",
            });
            console.log(error);
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <div className="border rounded-lg p-4">
                <textarea
                    className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="Add your note here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <button
                    className="mt-3 w-full px-4 py-2 bg-black text-white text-sm rounded-full"
                    onClick={createNote}
                >
                    {savingNote ? (
                        <Image
                            src="/icons/loading-circle.svg"
                            alt="Loading..."
                            width={24}
                            height={24}
                            priority
                        />
                    ) : (
                        "Save"
                    )}
                </button>
                {/* Render Existing Notes */}
                <div className="mt-4 space-y-4 text-sm">
                    {notes.map((note) => {
                        const dateOptions: Intl.DateTimeFormatOptions = {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        };
                        const formattedDate = new Date(note.createdAt).toLocaleDateString('en-US', dateOptions);

                        return (
                            <div key={note._id} className="pt-4 border-t">
                                <p>{note.text}</p>
                                <p className="text-[#9CA3AF] text-xs">Added {formattedDate}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RecentNotes;
