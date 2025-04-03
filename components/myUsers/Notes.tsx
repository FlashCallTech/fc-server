import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { backendBaseUrl } from "@/lib/utils";
import AddNoteModal from "./AddNoteModal";
import { useToast } from "../ui/use-toast";
import UpdateNoteModal from "./UpdateNoteModal";
import { useGetNotes } from "@/lib/react-query/queries";
import { useInView } from "react-intersection-observer";
import { QUERY_KEYS } from "@/lib/react-query/queryKeys";
import { useQueryClient } from "@tanstack/react-query";

type Note = {
  _id: string;
  title?: string; // If your note has a 'title' field
  text: string; // The main note text
  createdAt: string; // The date the note was created
  attachments?: string[]; // An array of attachment URLs (optional)
};

interface Props {
  clientId: string;
  creatorId: string;
}

const NotesList: React.FC<Props> = ({ clientId, creatorId }) => {
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showUpdateNoteModal, setShowUpdateNoteModal] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const queryClient = useQueryClient();

  const { toast } = useToast();

  const {
    data: notes,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isError,
    isLoading,
  } = useGetNotes(clientId, creatorId);

  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching]);

  // Helper to format dates (e.g., "Dec 16, 2023")
  const formatDate = (dateString: string): string => {
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", dateOptions);
  };

  const handleDelete = async (noteId: string) => {
    try {
      await axios.delete(`${backendBaseUrl}/notes/delete/${noteId}`);
      toast({
        variant: "destructive",
        title: "Note Deleted",
        description: "Your note has been successfully deleted.",
        toastStatus: "positive",
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_NOTES, clientId, creatorId],
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Failed to delete the note.",
        toastStatus: "negative",
      });
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Notes</h2>
        <button
          className="bg-black text-white px-4 py-2 rounded-full text-sm"
          onClick={() => setShowAddNoteModal(true)}
        >
          + Add Note
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <p>Loading...</p>
      ) : notes && notes?.pages[0]?.total === 0 ? (
        <div className="flex border rounded-lg p-6 items-center justify-center flex-col">
          <span className="text-lg font-semibold mb-1">Your Notes</span>
          <span className="text-[#6B7280] text-sm">Add a note to see here</span>
        </div>
      ) : (
        <>
          {notes?.pages?.flatMap((page: any) =>
            page?.notes?.map((note: Note) => {
              return (
                <div
                  key={note._id}
                  className="border rounded-lg p-6 mb-6 bg-white"
                >
                  {/* Top Row: Title & Edit Icon */}
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-[#111827]">
                      {note.title || "Untitled Note"}
                    </h3>
                    {/* Edit Icon - replace /icons/edit.svg with your own path */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowUpdateNoteModal(true);
                          setNoteToEdit(note);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          fill="none"
                          version="1.1"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                        >
                          <defs>
                            <clipPath id="master_svg0_142_6758">
                              <rect x="0" y="0" width="16" height="16" rx="0" />
                            </clipPath>
                          </defs>
                          <g clip-path="url(#master_svg0_142_6758)">
                            <g transform="matrix(1,0,0,-1,0,32.68752670288086)">
                              <g>
                                <path
                                  d="M14.8955,31.65626335144043Q14.3274,32.18756335144043,13.6331,32.18756335144043Q12.9389,32.18756335144043,12.3708,31.65626335144043L11.4241,30.71876335144043L14.5168,27.65626335144043L15.4635,28.59376335144043Q16,29.15626335144043,16,29.84376335144043Q16,30.53126335144043,15.4635,31.09376335144043L14.8955,31.65626335144043ZM5.42801,24.78126335144043Q5.14398,24.50001335144043,5.01775,24.09376335144043L4.07101,21.34376335144043Q3.94477,20.90626335144043,4.26035,20.56251335144043Q4.6075,20.25001335144043,5.04931,20.37501335144043L7.85799,21.31251335144043Q8.23669,21.43751335144043,8.52071,21.71876335144043L13.8225,26.96876335144043L10.7298,30.03126335144043L5.42801,24.78126335144043ZM3.02959,30.34376335144043Q1.7357,30.31256335144043,0.883629,29.46876335144043Q0.0315582,28.624963351440428,0,27.34376335144043L0,19.34376335144043Q0.0315582,18.06251335144043,0.883629,17.21876335144043Q1.7357,16.37501335144043,3.02959,16.34376335144043L11.1085,16.34376335144043Q12.4024,16.37501335144043,13.2544,17.21876335144043Q14.1065,18.06251335144043,14.1381,19.34376335144043L14.1381,22.34376335144043Q14.1381,22.78126335144043,13.854,23.06251335144043Q13.57,23.34376335144043,13.1282,23.34376335144043Q12.6864,23.34376335144043,12.4024,23.06251335144043Q12.1183,22.78126335144043,12.1183,22.34376335144043L12.1183,19.34376335144043Q12.1183,18.90626335144043,11.8343,18.62501335144043Q11.5503,18.34376335144043,11.1085,18.34376335144043L3.02959,18.34376335144043Q2.58777,18.34376335144043,2.30375,18.62501335144043Q2.01972,18.90626335144043,2.01972,19.34376335144043L2.01972,27.34376335144043Q2.01972,27.78126335144043,2.30375,28.06256335144043Q2.58777,28.34376335144043,3.02959,28.34376335144043L6.05917,28.34376335144043Q6.50099,28.34376335144043,6.78501,28.624963351440428Q7.06903,28.90626335144043,7.06903,29.34376335144043Q7.06903,29.78126335144043,6.78501,30.06256335144043Q6.50099,30.34376335144043,6.05917,30.34376335144043L3.02959,30.34376335144043Z"
                                  fill="#6B7280"
                                  fillOpacity="1"
                                />
                              </g>
                            </g>
                          </g>
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(note._id)}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          fill="none"
                          version="1.1"
                          width="14"
                          height="16"
                          viewBox="0 0 14 16"
                        >
                          <defs>
                            <clipPath id="master_svg0_142_6754">
                              <rect x="0" y="0" width="14" height="16" rx="0" />
                            </clipPath>
                          </defs>
                          <g clip-path="url(#master_svg0_142_6754)">
                            <g transform="matrix(1,0,0,-1,0,32.6875)">
                              <g>
                                <path
                                  d="M4.21875,31.78125L4,31.34375L4.21875,31.78125L4,31.34375L1,31.34375Q0.5625,31.34375,0.28125,31.06255Q0,30.78125,0,30.34375Q0,29.90625,0.28125,29.62495Q0.5625,29.34375,1,29.34375L13,29.34375Q13.4375,29.34375,13.7188,29.62495Q14,29.90625,14,30.34375Q14,30.78125,13.7188,31.06255Q13.4375,31.34375,13,31.34375L10,31.34375L9.78125,31.78125Q9.5,32.31255,8.875,32.34375L5.125,32.34375Q4.5,32.31255,4.21875,31.78125ZM13,28.34375L1,28.34375L13,28.34375L1,28.34375L1.65625,17.75Q1.71875,17.15625,2.125,16.75Q2.5625,16.34375,3.15625,16.34375L10.8438,16.34375Q11.4375,16.34375,11.875,16.75Q12.2812,17.15625,12.3438,17.75L13,28.34375Z"
                                  fill="#6B7280"
                                  fillOpacity="1"
                                />
                              </g>
                            </g>
                          </g>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Date */}
                  <p className="text-[#6B7280] text-[13px] mb-4">
                    {formatDate(note.createdAt)}
                  </p>

                  {/* Main Note Text */}
                  <p className="text-[#374151] text-[13px] text-medium">
                    {note.text}
                  </p>

                  {/* Attachments (Optional) */}
                  {note.attachments && note.attachments.length > 0 && (
                    <div className="mt-2">
                      {note.attachments.map((attachmentUrl, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 mb-1"
                        >
                          {/* Attachment icon - replace /icons/attachment.svg with your own path */}
                          <Image
                            src="/icons/attachment.svg"
                            alt="Attachment"
                            width={16}
                            height={16}
                          />
                          <a
                            href={attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline text-sm"
                          >
                            {attachmentUrl.split("/").pop()}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}
      {hasNextPage && isFetching && (
        <Image
          src="/icons/loading-circle.svg"
          alt="Loading..."
          width={50}
          height={50}
          className="mx-auto invert my-5 mt-10 z-20"
        />
      )}

      {!hasNextPage &&
        !isFetching &&
        notes?.pages.flatMap((page: any) => page.totalCalls)[0] >= 6 && (
          <div className=" text-center text-gray-500 pt-4">
            You have reached the end of the list
          </div>
        )}

      {hasNextPage && <div ref={ref} className="w-full" />}
      {showAddNoteModal && (
        <AddNoteModal
          isOpen={showAddNoteModal}
          onClose={() => setShowAddNoteModal(false)}
          clientId={clientId}
          creatorId={creatorId}
        />
      )}
      {showUpdateNoteModal && noteToEdit && (
        <UpdateNoteModal
          isOpen={showUpdateNoteModal}
          onClose={() => setShowUpdateNoteModal(false)}
          clientId={clientId}
          creatorId={creatorId}
          note={noteToEdit}
        />
      )}
    </div>
  );
};

export default NotesList;
