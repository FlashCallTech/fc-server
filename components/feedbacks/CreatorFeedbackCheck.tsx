"use client";

import React, { useState } from "react";
import { backendBaseUrl, formatDateTime, isValidUrl } from "@/lib/utils";
import { UserFeedback } from "@/types";
import { Rating } from "@smastrom/react-rating";
import Image from "next/image";
import GetRandomImage from "@/utils/GetRandomImage";
import DeleteFeedbackAlert from "../alerts/DeleteFeedbackAlert";
import { useToast } from "../ui/use-toast";
import axios from "axios";

const CreatorFeedbackCheck = ({
  feedback,
  refetch,
}: {
  feedback: UserFeedback;
  refetch?: any;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState(false);
  const [deletingFeedback, setDeletingFeedback] = useState(false);
  const toggleReadMore = () => {
    setIsExpanded(!isExpanded);
  };
  const { toast } = useToast();

  const handleConfirmRemove = async (feedbackId: string) => {
    try {
      setDeletingFeedback(true);
      await axios.delete(`${backendBaseUrl}/feedback/call/${feedbackId}`);

      toast({
        variant: "destructive",
        title: "Feedback deleted successfully",
        description: "Feedback was removed.",
        toastStatus: "positive",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to delete feedback",
        description: "Feedback was not removed.",
        toastStatus: "negative",
      });
      console.warn(error);
    } finally {
      refetch();
      setDeletingFeedback(false);
    }
  };

  let dummyFeedback =
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa consequuntur ducimus repellendus non nam, laboriosam et ullam veniam? Voluptatum laboriosam mollitia expedita fugit iste repellendus suscipit nostrum. Inventore repudiandae, quibusdam voluptatibus facere minus officiis tenetur, obcaecati quos assumenda similique commodi magni maxime nobis suscipit distinctio eaque quisquam vel omnis. Eos, temporibus odit! Odit mollitia dolores repudiandae, pariatur magni dolorem, vel necessitatibus, beatae sequi aut iste culpa doloribus. Ab iusto quaerat officiis, id maxime ratione voluptatum quasi ex voluptas beatae ipsam et quo quia esse facilis quibusdam inventore error, magnam atque totam tenetur. Sed, vel delectus voluptatum earum autem quia inventore!";

  return (
    <>
      <DeleteFeedbackAlert
        showDeleteFeedbackAlert={deleteFeedback}
        setShowDeleteFeedbackAlert={setDeleteFeedback}
        handleConfirmRemove={handleConfirmRemove}
        loading={deletingFeedback}
        feedbackId={feedback?._id}
      />

      <div className="flex items-center justify-start w-full">
        <div className="flex flex-col gap-2 items-start justify-center w-full">
          <Rating
            style={{ maxWidth: 150, fill: "white" }}
            value={feedback.rating}
            items={5}
            spaceBetween="medium"
            transition="zoom"
            readOnly
          />
          <div className="ml-1 flex flex-col items-start justify-start gap-2 w-full h-full overflow-scroll no-scrollbar">
            <span
              className={`no-scrollbar text-base  text-[#374151] max-w-[95%] ${
                isExpanded
                  ? "whitespace-pre-wrap overflow-x-hidden max-h-[150px]"
                  : "text-ellipsis whitespace-nowrap overflow-x-hidden "
              }`}
            >
              {feedback.feedback}
            </span>
            {!isExpanded &&
              feedback?.feedback !== null &&
              feedback?.feedback?.length > 100 && (
                <button
                  onClick={toggleReadMore}
                  className="text-green-1 text-sm"
                >
                  Read More
                </button>
              )}
            {isExpanded && (
              <button onClick={toggleReadMore} className="text-red-500 text-sm">
                Show Less
              </button>
            )}
            <div className="w-full flex items-center justify-between  gap-4">
              <div className="flex items-center justify-start gap-2 flex-wrap">
                <div className="flex items-center justify-start gap-2">
                  <Image
                    src={
                      feedback.isCustomAdded
                        ? feedback.customUserImage &&
                          isValidUrl(feedback.customUserImage)
                          ? feedback.customUserImage
                          : GetRandomImage()
                        : feedback?.clientId?.photo &&
                          isValidUrl(feedback.clientId.photo)
                        ? feedback.clientId.photo
                        : GetRandomImage()
                    }
                    alt={feedback?.clientId?.username}
                    width={44}
                    height={44}
                    className="w-5 h-5 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/defaultProfileImage.png";
                    }}
                  />

                  <span className="text-sm">
                    {feedback.isCustomAdded
                      ? feedback.customUserName
                        ? feedback.customUserName
                        : "Flashcall User"
                      : feedback?.clientId?.username.startsWith("+91")
                      ? feedback.clientId.username.replace(
                          /(\+91)(\d+)/,
                          (match, p1, p2) =>
                            `${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
                        )
                      : feedback?.clientId?.username || "Deleted Account"}
                  </span>
                </div>
                <span className="text-sm">|</span>
                <span className="text-sm">
                  {formatDateTime(feedback?.createdAt).dateTime}
                </span>
              </div>
              {feedback.isCustomAdded && (
                <button
                  className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition"
                  onClick={() => setDeleteFeedback(true)}
                >
                  {deletingFeedback ? (
                    <Image
                      src="/icons/loading-circle.svg"
                      alt="Loading..."
                      width={50}
                      height={50}
                      className="w-5 h-5 invert"
                    />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatorFeedbackCheck;
