import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import Image from "next/image";
import React from "react";

interface CountdownProps {
  chat: any;
  timeLeft: string;
  userType: string | null;
  joinLoading: boolean;
  setJoinLoading: any;
}

const CountdownTimer: React.FC<CountdownProps> = ({ chat, timeLeft, userType, joinLoading, setJoinLoading }) => {
  const handleJoinNow = async () => {
    if (!userType || !chat) return;

    try {
      setJoinLoading(true);
      console.log("Joining the call...");

      // Reference to the chat document in Firestore
      const scheduledChatsDocRef = doc(db, "scheduledChats", chat.callId);

      // Determine the field to update based on userType
      const updateField =
        userType === "client"
          ? { "clientJoined": true }
          : { "creatorJoined": true };

      // Update the Firestore document
      await updateDoc(scheduledChatsDocRef, updateField);

      console.log("Chat document updated successfully!");
    } catch (error) {
      console.error("Error updating chat document:", error);
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="flex size-full items-center justify-center">
      <div className="flex flex-col px-6 py-12 items-center justify-center">
        {/* Header Section */}
        <h1 className="text-3xl text-center font-semibold mb-3">
          {timeLeft === "The call has started!"
            ? "Your Call is Ready"
            : "Waiting for Your Scheduled Chat"}
        </h1>
        <p className="text-lg font-light mb-12">
          {timeLeft === "The call has started!"
            ? "Click below to join the call."
            : "Your chat will start soon!"}
        </p>

        {/* Timer Section */}
        <div
          className="flex flex-col w-full items-center justify-centerrounded-lg p-8"
          style={{
            background: "linear-gradient(0deg, rgba(0, 0, 0, 0.001), rgba(0, 0, 0, 0.001)), #F9FAFB",
            boxShadow: "0px 4px 6px -4px rgba(0, 0, 0, 0.1), 0px 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        >
          {timeLeft === "The call has started!" ? (
            <button
              onClick={handleJoinNow}
              className="bg-black text-white px-4 py-2 rounded-full hoverScaleDownEffect"
            >
              {
                joinLoading ? (
                  <Image
                    src="/icons/loading-circle.svg"
                    alt="Loading..."
                    width={24}
                    height={24}
                    priority
                  />

                ) : (
                  "Join Now"
                )
              }
            </button>
          ) : (
            <>
              <p className="text-xl font-normal">Countdown to Start:</p>
              <p className="text-5xl font-semibold tracking-3px mt-4">{timeLeft}</p>
            </>
          )}
        </div>

        {/* User Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 w-full">
          {/* Client Info */}
          <div
            className="rounded-lg p-6 text-center"
            style={{
              background: "linear-gradient(0deg, rgba(0, 0, 0, 0.001), rgba(0, 0, 0, 0.001)), #F9FAFB",
              boxShadow: "0px 4px 6px -4px rgba(0, 0, 0, 0.1), 0px 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <img
              src={chat?.clientImg}
              alt="Client"
              className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
            />
            <h2 className="text-base font-semibold">{chat?.clientName}</h2>
          </div>

          {/* Creator Info */}
          <div
            className="rounded-lg p-6 text-center"
            style={{
              background: "linear-gradient(0deg, rgba(0, 0, 0, 0.001), rgba(0, 0, 0, 0.001)), #F9FAFB",
              boxShadow: "0px 4px 6px -4px rgba(0, 0, 0, 0.1), 0px 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <img
              src={chat?.creatorImg}
              alt="Creator"
              className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
            />
            <h2 className="text-base font-semibold">{chat?.creatorName}</h2>
          </div>
        </div>

        {/* Footer */}
        <p className="text-base mt-12 text-[#4B5563] text-center">
          Please stay on this page until the call begins.
        </p>
      </div>
    </div>
  );
};

export default CountdownTimer;
