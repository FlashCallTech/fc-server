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
      const chatDocRef = doc(db, "chats", chat.chatId);

      // Determine the field to update based on userType
      const updateField =
        userType === "client"
          ? { "scheduledChatDetails.clientJoined": true }
          : { "scheduledChatDetails.creatorJoined": true };

      // Update the Firestore document
      await updateDoc(chatDocRef, updateField);

      console.log("Chat document updated successfully!");
    } catch (error) {
      console.error("Error updating chat document:", error);
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
      {/* Header Section */}
      <h1 className="text-4xl font-bold mb-6">
        {timeLeft === "The call has started!"
          ? "Your Call is Ready"
          : "Waiting for Your Scheduled Chat"}
      </h1>
      <p className="text-xl font-light mb-10">
        {timeLeft === "The call has started!"
          ? "Click below to join the call."
          : "Your chat will start soon!"}
      </p>

      {/* Timer Section */}
      <div className="flex flex-col items-center justify-center bg-white bg-opacity-20 rounded-lg p-8 shadow-lg">
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
            <p className="text-2xl font-semibold">Countdown to Start:</p>
            <p className="text-5xl font-bold mt-4">{timeLeft}</p>
          </>
        )}
      </div>

      {/* User Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 w-full max-w-4xl">
        {/* Client Info */}
        <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center shadow-md">
          <img
            src={chat?.clientImg}
            alt="Client"
            className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
          />
          <h2 className="text-xl font-bold">{chat?.clientName}</h2>
        </div>

        {/* Creator Info */}
        <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center shadow-md">
          <img
            src={chat?.creatorImg}
            alt="Creator"
            className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
          />
          <h2 className="text-xl font-bold">{chat?.creatorName}</h2>
        </div>
      </div>

      {/* Footer */}
      <p className="text-sm mt-12 opacity-75">
        Please stay on this page until the call begins.
      </p>
    </div>
  );
};

export default CountdownTimer;
