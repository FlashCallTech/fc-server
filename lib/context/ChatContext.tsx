import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/mixpanel";
import { db } from "@/lib/firebase";
import { useCurrentUsersContext } from "./CurrentUsersContext";

interface ChatContextProps {
	chatId: string | null;
	chat: any;
	messages: any
	chatEnded: boolean;
	startedAt: number;
	loading: boolean;
	handleEnd: (chatId: string | string[], endedBy: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextProps | null>(null);

export const useChatContext = () => {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChatContext must be used within a ChatProvider");
	}
	return context;
};

export const ChatProvider = ({ children, chatId }: { children: React.ReactNode, chatId: string }) => {
	const [chat, setChat] = useState<any>(null);
	const [messages, setMessages] = useState<any>();
	const [chatEnded, setChatEnded] = useState(false);
	const [startedAt, setStartedAt] = useState<number>(0);
	const [loading, setLoading] = useState(false);
	const { userType } = useCurrentUsersContext();
	const router = useRouter();
	const hasChatEnded = useRef(false);

	// Sync chat data from Firestore
	useEffect(() => {
		if (chatId) {
			const officialChatDocRef = doc(db, "chats", chatId as string);
			const messagesDocRef = doc(db, "messages", chatId as string);
			const chatUnSub = onSnapshot(officialChatDocRef, (doc) => {
				if (doc.exists()) {
					const data = doc.data();
					setChat(data);
					setStartedAt(data.startedAt);
					if (data?.status === "ended") {
						setChatEnded(true);
						chatUnSub(); // Unsubscribe the listener
					}
				}
			});

			const messageUnSub = onSnapshot(messagesDocRef, (doc) => {
				if (doc.exists()) {
					const data = doc.data();
					setMessages(data.messages);
				}
			});

			return () => {
				chatUnSub();
				messageUnSub();
			};
		}
	}, [chatId]);

	// Handle chat end logic
	useEffect(() => {
		if (chatEnded && !hasChatEnded.current) {
			hasChatEnded.current = true;
			if (userType === "creator") {
				router.replace(`/home`);
			} else {
				const endedBy = localStorage.getItem("EndedBy");
				localStorage.removeItem("chatRequestId");
				localStorage.removeItem("chatId");
				localStorage.removeItem("user2");
				localStorage.removeItem("EndedBy");
				trackEvent("BookCall_Chat_Ended", {
					Client_ID: chat?.clientId,
					Creator_ID: chat?.creatorId,
					Time_Duration_Consumed: chat?.startedAt
						? (Date.now() - chat?.startedAt) / 1000
						: null,
					EndedBy: endedBy ?? "creator",
				});
				router.replace(`/chat-ended/${chatId}/${chat?.callId}/${chat?.clientId}/false`);
			}
		}
	}, [chatEnded, userType, router, chatId, chat]);

	// Function to end the chat
	const handleEnd = async (chatId: string | string[], endedBy: string) => {
		try {
			setLoading(true);
			const now = Date.now();

			if(endedBy === "low_balance" || endedBy === "time_over") {
				trackEvent("BookCall_Chat_Ended", {
					Client_ID: chat?.clientId,
					Creator_ID: chat?.creatorId,
					Time_Duration_Consumed: chat?.startedAt
						? (Date.now() - chat?.startedAt) / 1000
						: null,
					EndedBy: endedBy,
				});
			}

			// Update chat status
			await updateDoc(doc(db, "chats", chatId as string), {
				endedAt: now,
				status: "ended",
			});

			// Update user chats
			if (chat?.clientId) {
				await updateDoc(doc(db, "userchats", chat.clientId), {
					online: false,
				});
			}
			if (chat?.creatorId) {
				await updateDoc(doc(db, "userchats", chat.creatorId), {
					online: false,
				});
			}

			// Clear localStorage
			localStorage.removeItem("chatRequestId");
			localStorage.removeItem("chatId");
			localStorage.removeItem("user2");
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error ending chat:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<ChatContext.Provider
			value={{
				chatId,
				chat,
				messages,
				chatEnded,
				startedAt,
				loading,
				handleEnd,
			}}
		>
			{children}
		</ChatContext.Provider>
	);
};

export default ChatProvider;
