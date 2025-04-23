"use client";

import { UserFeedback } from "@/types";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import CreatorFeedbackCheck from "../feedbacks/CreatorFeedbackCheck";
import { Switch } from "../ui/switch";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import * as Sentry from "@sentry/nextjs";
import GetRandomImage from "@/utils/GetRandomImage";
import { backendBaseUrl, isValidUrl } from "@/lib/utils";
import axios from "axios";
import { InfiniteData } from "@tanstack/react-query";
import { Button } from "../ui/button";
import CustomFeedback from "../forms/CustomFeedback";
import ContentLoading from "../shared/ContentLoading";

const reorder = (
  list: ExtendedUserFeedback[],
  startIndex: number,
  endIndex: number
) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  // Update the position field based on the new order
  return result.map((item, index) => ({ ...item, position: index + 1 }));
};

type FeedbackParams = {
  _id?: string;
  callId?: string;
  feedback: UserFeedback;
};

type ExtendedUserFeedback = UserFeedback & {
  callId: string;
};

const CreatorCallsFeedbacks = ({
  feedbackData,
  refetch,
}: {
  feedbackData: InfiniteData<any, unknown> | undefined;
  refetch?: any;
}) => {
  const [feedbacks, setFeedbacks] = useState<ExtendedUserFeedback[]>([]);
  const { creatorUser, fetchingUser } = useCurrentUsersContext();
  const [loadingFeedbackId, setLoadingFeedbackId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [toggleCustomForm, setToggleCustomForm] = useState(false);

  useEffect(() => {
    const getFeedbacks = async () => {
      try {
        setIsLoading(true);
        if (feedbackData) {
          const allFeedbacks = feedbackData.pages.flatMap(
            (page) => page.creatorFeedbacks
          );
          const feedbacksWithCallId =
            allFeedbacks?.map((item: FeedbackParams, index: number) => ({
              ...item.feedback,
              _id: item._id ?? "",
              callId: item.callId ?? "",
              position:
                item.feedback.position !== -1
                  ? item.feedback.position
                  : index + 1,
            })) || [];
          setFeedbacks(feedbacksWithCallId);
        }
      } catch (error) {
        Sentry.captureException(error);
        console.warn(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (creatorUser) {
      getFeedbacks();
    }
  }, [feedbackData, creatorUser, toggleCustomForm]);

  const handleSwitchToggle = async (
    feedback: ExtendedUserFeedback,
    showFeedback: boolean,
    index: number
  ) => {
    setLoadingFeedbackId(feedback.callId);

    // Calculate the new position based on `showFeedback`
    const newPosition = (() => {
      if (showFeedback) {
        // Calculate position just after the last toggled-on feedback
        const lastOnPosition = feedbacks
          .filter((fb) => fb.showFeedback)
          .reduce((maxPos, fb: any) => Math.max(maxPos, fb.position), 0);
        return lastOnPosition + 1;
      } else {
        // Calculate position after all feedbacks
        const maxPosition = feedbacks.reduce(
          (maxPos, fb: any) => Math.max(maxPos, fb.position),
          0
        );
        return maxPosition + 1;
      }
    })();

    // Now update feedbacks in a separate state update
    setFeedbacks((prevFeedbacks) => {
      const updatedFeedbacks = [...prevFeedbacks];
      updatedFeedbacks[index] = {
        ...updatedFeedbacks[index],
        showFeedback,
        position: newPosition,
      };
      // Sort based on updated positions
      return updatedFeedbacks.sort((a: any, b: any) => a.position - b.position);
    });

    try {
      const feedbackText = feedback.feedback || null;

      // Use `newPosition` in the API calls
      const response = await axios.post(
        `${backendBaseUrl}/feedback/creator/setFeedback`,
        {
          ...feedback,
          creatorId: creatorUser?._id,
          feedbackText: feedbackText,
          showFeedback: showFeedback,
          position: newPosition,
        }
      );

      if (response.status !== 200) {
        throw new Error("Failed to update feedback visibility");
      }

      await axios.post(`${backendBaseUrl}/feedback/call/create`, {
        ...feedback,
        creatorId: creatorUser?._id,
        feedbackText: feedbackText,
        showFeedback: showFeedback,
        position: newPosition,
      });
    } catch (error) {
      Sentry.captureException(error);
      console.error("Error updating feedback visibility:", error);
    } finally {
      setLoadingFeedbackId(null);
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) {
      return;
    }

    // Reorder the feedbacks based on the drag and drop result
    const items = reorder(
      feedbacks,
      result.source.index,
      result.destination.index
    );

    // Identify changed feedbacks by comparing the new order with the original order
    const changedFeedbacks = items.filter((item, index) => {
      return (
        new Date(item.createdAt).toISOString() !==
        new Date(feedbacks[index].createdAt).toISOString()
      );
    });

    if (changedFeedbacks.length === 0) {
      // No changes detected, no need to make API calls
      return;
    }

    // Update the local state with the reordered feedbacks
    setFeedbacks(items);

    // Prepare the changed feedbacks for the API request
    const updatedFeedbacks = changedFeedbacks.map((feedback) => ({
      creatorId: creatorUser?._id,
      ...feedback,
    }));

    try {
      await Promise.all(
        updatedFeedbacks.map(async (feedback) => {
          // Update feedback position in call feedbacks
          await axios.post(`${backendBaseUrl}/feedback/call/create`, {
            ...feedback,
          });

          // If showFeedback is true, update the position in creator feedbacks
          if (feedback.showFeedback) {
            await axios.post(`${backendBaseUrl}/feedback/creator/setFeedback`, {
              ...feedback,
            });
          }
        })
      );
    } catch (error) {
      Sentry.captureException(error);
      console.error("Error updating feedback positions:", error);
    }
  };

  if (isLoading || fetchingUser) {
    return (
      <div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center">
        <ContentLoading />
        <p className="text-green-1 font-semibold text-lg flex items-center gap-2">
          Fetching Creator&apos;s Feedbacks{" "}
          <Image
            src="/icons/loading-circle.svg"
            alt="Loading..."
            width={24}
            height={24}
            priority
          />
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start justify-center gap-4 px-4">
      <Button
        className="bg-black text-white rounded-full hoverScaleDownEffect flex items-center gap-2"
        onClick={() => setToggleCustomForm((prev) => !prev)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Add Custom Feedback
      </Button>

      {toggleCustomForm && (
        <CustomFeedback
          isOpen={toggleCustomForm}
          onOpenChange={setToggleCustomForm}
          creatorId={creatorUser?._id as string}
          refetch={refetch}
        />
      )}

      {feedbacks && feedbacks.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="feedbacks">
            {(provided) => (
              <section
                className={`grid grid-cols-1 items-start gap-5 xl:gap-10 w-full h-fit text-black overflow-x-hidden no-scrollbar`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {feedbacks.map((feedback, index) => (
                  <Draggable
                    key={feedback.callId}
                    draggableId={feedback.callId}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="relative flex flex-col items-start justify-center gap-4 border rounded-xl p-4 pl-10 shadow-lg border-gray-300 bg-white"
                      >
                        <Image
                          src="/icons/dragIndicator.svg"
                          alt="draggable"
                          height={100}
                          width={100}
                          className="w-7 h-7 absolute top-7 left-2"
                        />
                        <div className="flex h-full w-full items-start justify-between">
                          <div className="w-full flex items-center justify-start gap-4">
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
                              alt="User Image"
                              height={1000}
                              width={1000}
                              className="rounded-full w-12 h-12 object-cover"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "/images/defaultProfileImage.png";
                              }}
                            />

                            <div className="flex flex-col">
                              <span className="text-base text-green-1">
                                {feedback?.clientId?.phone.replace(
                                  /(\+91)(\d+)/,
                                  (match, p1, p2) =>
                                    `${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
                                ) ||
                                  feedback?.clientId?._id ||
                                  "Deleted Account"}
                              </span>
                              <p className="text-sm tracking-wide">
                                {feedback.isCustomAdded
                                  ? feedback.customUserName
                                    ? feedback.customUserName
                                    : "Flashcall User"
                                  : feedback?.clientId?.username.startsWith(
                                      "+91"
                                    )
                                  ? feedback.clientId.username.replace(
                                      /(\+91)(\d+)/,
                                      (match, p1, p2) =>
                                        `${p1} ${p2.replace(
                                          /(\d{5})$/,
                                          "xxxxx"
                                        )}`
                                    )
                                  : feedback?.clientId?.username ||
                                    "Deleted Account"}
                              </p>
                            </div>
                          </div>
                          <div className="w-fit flex flex-col items-end justify-between h-full gap-2">
                            {loadingFeedbackId === feedback?.callId ? (
                              <Image
                                src="/icons/isLoading-circle.svg"
                                alt="Loading..."
                                width={24}
                                height={24}
                                className="invert"
                                priority
                              />
                            ) : (
                              <Switch
                                checked={feedback?.showFeedback}
                                onCheckedChange={() =>
                                  handleSwitchToggle(
                                    feedback,
                                    !feedback.showFeedback,
                                    index
                                  )
                                }
                              />
                            )}
                            {!feedback.showFeedback && (
                              <span className="text-xs text-[#A7A8A1] whitespace-nowrap">
                                Add to Website
                              </span>
                            )}
                          </div>
                        </div>
                        <CreatorFeedbackCheck
                          feedback={feedback}
                          refetch={refetch}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}
              </section>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="h-[calc(100vh-6rem)] flex flex-col justify-center items-center w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            fill="none"
            version="1.1"
            width="60"
            height="60"
            viewBox="0 0 60 60"
          >
            <defs>
              <clipPath id="master_svg0_28_0452">
                <rect x="0" y="0" width="60" height="60" rx="0" />
              </clipPath>
            </defs>
            <g clipPath="url(#master_svg0_28_0452)">
              <g transform="matrix(1,0,0,-1,0,115.07815551757812)">
                <g>
                  <path
                    d="M30.1166984375,61.28907775878906Q38.5212984375,61.40626775878906,45.1749984375,64.57032775878906Q51.9454984375,67.85157775878906,55.9142984375,73.35937775878907Q59.8831984375,78.86717775878907,59.9998984375,85.66407775878906Q59.8831984375,92.46097775878906,55.9142984375,97.96877775878906Q51.9454984375,103.47657775878906,45.1749984375,106.75787775878906Q38.5212984375,109.92187775878907,30.1166984375,110.03907775878906Q21.7119984375,109.92187775878907,15.0582984375,106.75787775878906Q8.2878684375,103.47657775878906,4.3189984375,97.96877775878906Q0.3501304375,92.46097775878906,0.2333984375,85.66407775878906Q0.3501304375,77.57817775878907,5.8365084375,71.48437775878907Q5.2528584375,67.14845775878906,3.2684184375,64.10157775878906Q2.3345684375,62.460957758789064,1.5174484375,61.64063775878906Q1.1672504375,61.17188775878906,0.9337874375,60.93751775878906Q0.9337874375,60.82032775878906,0.8170564375,60.82032775878906L0.8170564375,60.70313775878906Q-0.00006456250000000385,59.88282775878906,0.3501304375,58.710957758789064Q0.9337874375,57.53907775878906,2.1010984375,57.53907775878906Q7.2372884375,57.77345275878906,11.6730984375,59.76563775878906Q15.7586984375,61.64063775878906,17.9765984375,63.398457758789064Q23.5796984375,61.28907775878906,30.1166984375,61.28907775878906ZM15.1749984375,89.41407775878906Q16.8092984375,89.41407775878906,17.8598984375,88.35937775878907Q18.9103984375,87.30467775878907,18.9103984375,85.66407775878906Q18.9103984375,84.02347775878906,17.8598984375,82.96877775878906Q16.8092984375,81.91407775878906,15.1749984375,81.91407775878906Q13.5407984375,81.91407775878906,12.4901984375,82.96877775878906Q11.4395984375,84.02347775878906,11.4395984375,85.66407775878906Q11.4395984375,87.30467775878907,12.4901984375,88.35937775878907Q13.5407984375,89.41407775878906,15.1749984375,89.41407775878906ZM30.1166984375,89.41407775878906Q31.7508984375,89.41407775878906,32.8014984375,88.35937775878907Q33.8520984375,87.30467775878907,33.8520984375,85.66407775878906Q33.8520984375,84.02347775878906,32.8014984375,82.96877775878906Q31.7508984375,81.91407775878906,30.1166984375,81.91407775878906Q28.4823984375,81.91407775878906,27.4317984375,82.96877775878906Q26.3812984375,84.02347775878906,26.3812984375,85.66407775878906Q26.3812984375,87.30467775878907,27.4317984375,88.35937775878907Q28.4823984375,89.41407775878906,30.1166984375,89.41407775878906ZM41.3228984375,85.66407775878906Q41.3228984375,87.30467775878907,42.3734984375,88.35937775878907Q43.4240984375,89.41407775878906,45.0582984375,89.41407775878906Q46.6924984375,89.41407775878906,47.7430984375,88.35937775878907Q48.7936984375,87.30467775878907,48.7936984375,85.66407775878906Q48.7936984375,84.02347775878906,47.7430984375,82.96877775878906Q46.6924984375,81.91407775878906,45.0582984375,81.91407775878906Q43.4240984375,81.91407775878906,42.3734984375,82.96877775878906Q41.3228984375,84.02347775878906,41.3228984375,85.66407775878906Z"
                    fill="#D1D5DB"
                    fillOpacity="1"
                  />
                </g>
              </g>
            </g>
          </svg>
          <h1 className="text-2xl font-semibold text-[#6B7280] mt-4 mb-2">
            No feedback yet
          </h1>
          <span className="text-sm text-[#9CA3AF]">
            User feedback will appear here once received
          </span>
        </div>
      )}
    </div>
  );
};

export default CreatorCallsFeedbacks;
