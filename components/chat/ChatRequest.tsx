import React, { useEffect, useRef, useState } from 'react';
import useChatRequest from '@/hooks/useChatRequest';
import Image from 'next/image';
import { doc, onSnapshot } from 'firebase/firestore';

const ChatRequest = ({ chatRequest }: { chatRequest: any }) => {
  const [chatState, setChatState] = useState("pending");
  const [shownNotification, setShownNotification] = useState(false);
  const { chatRequestsRef } = useChatRequest();
  const { handleAcceptChat, handleRejectChat } = useChatRequest();

  useEffect(() => {
    const registerServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker registered.");
        } catch (error) {
          console.error("Service Worker registration failed:", error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  const showNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification("Incoming Call", {
          body: `Call from ${chatRequest.clientName}`,
          // icon:
          // 	call?.state?.createdBy?.image || "/images/defaultProfileImage.png",
          tag: "incoming-chat",
          data: { url: `https://www.flashcall.me` },
        });
      });
    } else if ("Notification" in window) {
      Notification.requestPermission().then((result) => {
        if (result === "granted") {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification("Incoming Call", {
              body: `Call from ${chatRequest.clientName}`,
              // icon:
              // 	call?.state?.createdBy?.image ||
              // 	"/images/defaultProfileImage.png",
              tag: "incoming-chat",
              data: { url: `https://www.flashcall.me` },
            });
          });
        }
      });
    }
  };

  useEffect(() => {
    if (!chatRequest) return;

    const chatRequestDoc = doc(chatRequestsRef, chatRequest.id);

    const unsubscribe = onSnapshot(chatRequestDoc, (docSnapshot) => {
      const updatedChatRequest: any = { id: docSnapshot.id, ...docSnapshot.data() };
      setChatState(updatedChatRequest.status);
    });

    return () => unsubscribe(); // Cleanup subscription when chatRequest changes or is nullified
  }, [chatRequest]);

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;

    if (chatState === "pending") {
      audio = new Audio("/sounds/notification.mp3");
      audio.loop = true;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio autoplay started!");
          })
          .catch((error) => {
            console.error("Audio autoplay was prevented:", error);
            // Show a UI element or prompt user to play the sound manually if needed
          });
      }

      if (!shownNotification) {
        showNotification();
        setShownNotification(true);
      }
    }

    // Clean up when callState changes or on component unmount
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [shownNotification, chatState]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      {/* Mobile Layout */}
      <div className="flex flex-col justify-between bg-gray-800 text-white p-6 h-screen w-screen lg:hidden">
        <div className="flex flex-col gap-20 items-center justify-between">
          <h2 className="text-lg font-medium mb-2">Incoming Chat Request</h2>
          <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <span className="text-2xl">👤</span>
          </div>
          <p className="text-xs mb-6 text-center">
            Chat from <br />
            <strong className="text-lg">{chatRequest.clientName}</strong>
          </p>
        </div>
        <div className="flex justify-between p-8">
          <div className='flex flex-col gap-2'>
            <button
              onClick={() => handleRejectChat(chatRequest)}
              className="bg-red-500 text-white p-4 rounded-full hover:bg-red-600 transition"
            >
              <Image src={'/reject.svg'} width={0} height={0} alt='reject' className='w-auto h-auto' />
            </button>
            <span className='text-center'>Reject</span>
          </div>
          <div className='flex flex-col gap-1'>
            <button
              onClick={() => handleAcceptChat(chatRequest)}
              className="bg-green-500 text-white p-4 rounded-full hover:bg-green-600 transition"
            >
              <Image src={'/accept.svg'} width={0} height={0} alt='reject' className='w-auto h-auto' />
            </button>
            <span className='text-center'>Accept</span>
          </div>
        </div>
      </div>

      {/* Laptop and Larger Screens Layout */}
      <div className="hidden lg:flex lg:flex-col items-center bg-gray-800 text-white w-80 rounded-lg shadow-lg p-6">
        <div className="flex flex-col items-center">
          <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <span className="text-2xl">👤</span>
          </div>
          <h2 className="text-lg font-semibold mb-2">Incoming Chat Request</h2>
          <p className="text-sm mb-6">Chat from <strong>{chatRequest.clientName}</strong></p>
        </div>
        <div className="flex justify-between w-full">
          <button
            onClick={() => handleRejectChat(chatRequest)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Decline
          </button>
          <button
            onClick={() => handleAcceptChat(chatRequest)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRequest;
