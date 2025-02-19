import React, { useCallback, useEffect, useRef, useState } from 'react';
import { format, isSameDay, isToday, subDays } from 'date-fns';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCurrentUsersContext } from '@/lib/context/CurrentUsersContext';
import { useToast } from '@/components/ui/use-toast';
import { fetchFCMToken, sendChatInquiryNotification, sendNotification } from '@/lib/utils';

interface FloatingChatProps {
  setIsAuthSheetOpen: any;
  initiating: boolean;
  chatId: string | null | undefined;
}

const FloatingChat: React.FC<FloatingChatProps> = ({ setIsAuthSheetOpen, chatId, initiating }) => {
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<any>();
  const [text, setText] = useState('');
  const [temporaryClientId, setTemporaryClientId] = useState<string | null>();
  const { toast } = useToast();
  const { currentUser } = useCurrentUsersContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set up the Firestore listener with cleanup.
  useEffect(() => {
    let unsubscribe = () => { };
    if (chatId) {
      setTemporaryClientId(localStorage.getItem("temporaryClientId"));
      const chatDocRef = doc(db, 'helpChat', chatId);
      unsubscribe = onSnapshot(chatDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          setChat(docSnapshot.data());
        } else {
          toast({
            variant: 'destructive',
            title: 'No such chat exists',
          });
        }
        setLoading(false);
      });
    }
    return () => unsubscribe();
  }, [chatId, toast]);

  // Scroll to the bottom when messages update.
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages, scrollToBottom]);

  const handleSend = async () => {
    if (!text.trim() || !chatId) return;
    try {
      const userIDs = [chat.clientId, chat.creatorId];

      // Update each user's chat record concurrently and wait for all updates.
      await Promise.all(
        userIDs.map(async (id: string) => {
          const userHelpChatsRef = doc(db, "userHelpChats", id);
          const userHelpChatsSnapshot = await getDoc(userHelpChatsRef);

          if (userHelpChatsSnapshot.exists()) {
            const userChatsData = userHelpChatsSnapshot.data();
            const chatIndex = userChatsData.chats.findIndex(
              (c: any) => c.chatId === chatId
            );

            if (chatIndex !== -1) {
              // Update the relevant chat data.
              userChatsData.chats[chatIndex].lastMessage = text;
              userChatsData.chats[chatIndex].isSeen = id === (currentUser?._id ?? temporaryClientId);
              userChatsData.chats[chatIndex].updatedAt = Date.now();

              return updateDoc(userHelpChatsRef, {
                chats: userChatsData.chats,
              });
            } else {
              console.warn(`Chat with chatId ${chatId} not found for user ${id}`);
            }
          }
        })
      );
      await updateDoc(doc(db, 'helpChat', chatId), {
        messages: arrayUnion({
          senderId: (currentUser?._id ?? temporaryClientId),
          createdAt: Date.now(),
          text,
        }),
      });
      setText('');
      scrollToBottom();
      const fcmToken = await fetchFCMToken(chat.creatorPhone as string);
      if (fcmToken) {
        await sendChatInquiryNotification(
          chatId,
          chat.creatorPhone as string,
          chat.clientName,
          chat.clientImg,
          chat.clientId,
          text,
          Date.now(),
          "inbox.chat",
          fetchFCMToken,
          sendNotification,
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setText('');
      scrollToBottom();
    }
  };

  return (
    <div className="w-[398px] h-[500px] flex flex-col shadow-lg bg-gray-100 overflow-hidden">
      {!currentUser && (
        <div className="w-full text-center text-xs p-2 bg-yellow-100 text-gray-500 border-b-2 border-yellow-200">
          <span>
            Your chat will be erased if you close the browser. <br />
            <button onClick={() => setIsAuthSheetOpen(true)} className="text-green-500">
              Log in
            </button>{" "}
            to save the chat.
          </span>
        </div>
      )}

      {/* Messages / Loading Placeholder */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2 gap-2 flex flex-col-reverse">
        {initiating || loading ? (
          // Show loading placeholders
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="px-4 py-2 shadow-sm rounded-2xl w-1/4 h-12 bg-gray-300 animate-pulse"
                style={{ alignSelf: index % 2 === 0 ? "flex-end" : "flex-start" }}
              ></div>
            ))}
          </div>
        ) : (
          chat?.messages &&
          [...chat.messages].reverse().map((msg: any, index, arr) => {
            const currentMsgDate = new Date(msg.createdAt);
            let showSeparator = false;

            if (index === arr.length - 1) {
              showSeparator = true;
            } else {
              const nextMsgDate = new Date(arr[index + 1].createdAt);
              if (!isSameDay(currentMsgDate, nextMsgDate)) {
                showSeparator = true;
              }
            }

            let dateLabel = "";
            if (showSeparator) {
              if (isToday(currentMsgDate)) {
                dateLabel = "Today";
              } else if (isSameDay(currentMsgDate, subDays(new Date(), 1))) {
                dateLabel = "Yesterday";
              } else {
                dateLabel = format(currentMsgDate, "d MMM, yyyy");
              }
            }

            return (
              <React.Fragment key={msg.createdAt + "-" + index}>
                <div className={`flex ${msg.senderId === (currentUser?._id ?? temporaryClientId) ? "justify-end" : "justify-start"}`}>
                  <div className={`px-4 py-2 text-sm shadow-sm rounded-2xl max-w-[70%] ${msg.senderId === (currentUser?._id ?? temporaryClientId) ? "text-black bg-white" : "bg-gray-200 text-black"}`}>
                    {msg.text}
                    <div className="text-[10px] text-right opacity-70 pl-10 mt-1">
                      {format(new Date(msg.createdAt), "hh:mm a")}
                    </div>
                  </div>
                </div>
                {index === 0 && <div ref={messagesEndRef} />} {/* Place ref after the latest message */}
                {showSeparator && (
                  <div className="flex justify-center py-4">
                    <div className="text-gray-600 font-semibold text-xs">{dateLabel}</div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-2 bg-white">
        <div className="flex justify-between rounded-lg border border-gray-300">
          <input
            type="text"
            placeholder="Start typing your message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 p-2 text-sm focus:outline-none bg-transparent"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={initiating} // Disable input when initiating is true
          />
          <div className="p-1">
            <button
              onClick={handleSend}
              className="flex items-center text-sm gap-2 bg-blue-500 text-white px-4 py-2 rounded-full"
              disabled={initiating || loading} // Disable button when initiating is true
            >
              {/* SVG Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="15.94" height="16.01" viewBox="0 0 15.94 16.01">
                <g transform="matrix(1,0,0,-1,0,32.02)">
                  <path
                    d="M15.5019,31.8283Q16,31.4846,15.9377,30.8596L13.9455,17.8595Q13.8521,17.3908,13.4475,17.1408Q13.0117,16.922,12.5759,17.1095L8.8405,18.6408L6.7237,16.3283Q6.2257,15.8595,5.6031,16.0783Q5.0117,16.3595,4.9805,17.0158L4.9805,19.6408Q4.9805,19.8283,5.1051,19.9533L10.3346,25.672Q10.5837,26.0158,10.3035,26.3596Q9.9922,26.6408,9.6187,26.3908L3.2996,20.7345L0.5603,22.1095Q0.0311,22.3908,0,22.9845Q0,23.5783,0.4981,23.8908L14.4436,31.8908Q15.0039,32.1721,15.5019,31.8283Z"
                    fill="#FFFFFF"
                    fillOpacity="1"
                  />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

  );
};

export default FloatingChat;
