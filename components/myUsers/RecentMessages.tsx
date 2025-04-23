import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Adjust with your firebase config file path
import Image from "next/image";
import { format } from "date-fns";

type Props = {
  clientId: string; // The receiver's ID
  creatorId: string; // The creator's ID (also the document id in userHelpChats)
};

type ChatEntry = {
  receiverId: string;
  chatId: string;
};

type UserHelpChats = {
  chats: ChatEntry[];
};

type Message = {
  text: string;
  senderId: string;
  createdAt: string; // ISO date string
};

type HelpChatData = {
  clientImg: string;
  clientName: string;
  creatorImg: string;
  creatorName: string;
  messages: Message[];
};

const RecentMessagesFirebase: React.FC<Props> = ({ clientId, creatorId }) => {
  const [helpChatData, setHelpChatData] = useState<HelpChatData | null>(null);
  const [latestMessages, setLatestMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMessages();
  }, [clientId, creatorId]);

  async function fetchMessages() {
    setLoading(true);
    try {
      // 1. Fetch the userHelpChats document for the given creatorId
      const userHelpChatsRef = doc(db, "userHelpChats", creatorId);
      const userHelpChatsSnap = await getDoc(userHelpChatsRef);
      if (!userHelpChatsSnap.exists()) {
        console.log(
          "No userHelpChats document found for creatorId:",
          creatorId
        );
        setLoading(false);
        return;
      }
      const userHelpChatsData = userHelpChatsSnap.data() as UserHelpChats;
      // 2. Find the chat entry where receiverId equals clientId
      const chatEntry = userHelpChatsData.chats.find(
        (entry) => entry.receiverId === clientId
      );
      if (!chatEntry) {
        console.log("No chat entry found for clientId:", clientId);
        setLoading(false);
        return;
      }
      // 3. Fetch the helpChat document using chatId from the entry
      const helpChatRef = doc(db, "helpChat", chatEntry.chatId);
      const helpChatSnap = await getDoc(helpChatRef);
      if (!helpChatSnap.exists()) {
        console.log("No helpChat found for chatId:", chatEntry.chatId);
        setLoading(false);
        return;
      }
      const helpChat = helpChatSnap.data() as HelpChatData;
      setHelpChatData(helpChat);

      // 4. Sort the messages by createdAt descending and take the latest three
      const sortedMessages = [...helpChat.messages].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLatestMessages(sortedMessages.slice(0, 3));
    } catch (error) {
      console.error("Error fetching messages from Firebase:", error);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!helpChatData) {
    return (
      <div className="flex border p-6 rounded-lg items-center justify-center flex-col">
        <div className="p-4 rounded-full bg-[#F3F4F6] mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            fill="none"
            version="1.1"
            width="29.81366539001465"
            height="24"
            viewBox="0 0 29.81366539001465 24"
          >
            <g transform="matrix(1,0,0,-1,0,48)">
              <path
                d="M9.68944,31.5Q13.7888,31.59375,16.5373,33.9375Q19.2857,36.2344,19.3789,39.75Q19.2857,43.2656,16.5373,45.5625Q13.7888,47.9062,9.68944,48Q5.59006,47.9062,2.84162,45.5625Q0.0931677,43.2656,0,39.75Q0.0465839,36.9844,1.86335,34.9219Q1.58385,34.2188,1.1646,33.75Q0.838509,33.32812,0.559006,33.09375Q0.419255,32.95312,0.372671,32.90625Q0.326087,32.85938,0.326087,32.85938L0.279503,32.85938Q-0.0931677,32.53125,0.0465839,32.01562Q0.232919,31.54688,0.745342,31.5Q2.32919,31.54688,3.63354,32.0625Q4.28571,32.34375,4.79814,32.625Q6.98758,31.54688,9.68944,31.5ZM20.8696,39.75Q20.7298,35.7188,17.8882,33.09375Q15,30.46875,10.8075,30.04688Q11.6925,27.375,14.2081,25.73438Q16.7236,24.046875,20.1242,24Q22.8261,24.046875,25.0155,25.125Q25.528,24.84375,26.1801,24.5625Q27.4845,24.046875,29.0683,24Q29.5807,24.046875,29.7671,24.515625Q29.9068,25.03125,29.4876,25.35938L29.4876,25.40625Q29.441,25.40625,29.441,25.40625Q29.3944,25.45312,29.2547,25.59375Q28.9752,25.82812,28.6491,26.25Q28.2298,26.76562,27.9503,27.42188Q29.7671,29.48438,29.8137,32.25Q29.7205,35.5781,27.205,37.875Q24.6894,40.1719,20.823,40.5Q20.8696,40.125,20.8696,39.75Z"
                fill="#9CA3AF"
                fillOpacity="1"
              />
            </g>
          </svg>
        </div>
        <span className="text-lg font-semibold mb-1">Recent Messages</span>
        <span className="text-[#6B7280]">
          Client will send you a message to start a chat
        </span>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Recent Messages</h2>
      <div className="border rounded-lg text-sm">
        {latestMessages.length > 0 ? (
          latestMessages.map((message, index) => {
            // Determine which details to display based on senderId
            const isClient = message.senderId === clientId;
            const senderImg = isClient
              ? helpChatData.clientImg
              : helpChatData.creatorImg;
            const senderName = isClient
              ? helpChatData.clientName
              : helpChatData.creatorName;
            return (
              <div
                key={index}
                className={`flex items-start px-4 py-3 ${
                  index !== 2 && "border-b"
                } space-x-3`}
              >
                <div className="w-9 h-9 relative rounded-full overflow-hidden">
                  <Image
                    src={senderImg}
                    alt={senderName}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <div>
                  <p className="font-semibold">
                    {message.senderId === creatorId ? "You" : senderName}
                  </p>
                  <p className="text-[#6B7280]">{message.text}</p>
                  <p className="text-[#9CA3AF] text-xs">
                    {format(new Date(message.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-gray-500">
            No messages found.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentMessagesFirebase;
