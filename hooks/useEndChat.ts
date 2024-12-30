import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/mixpanel";

const useEndChat = () => {
	const [chat, setChat] = useState<any>();
	const [chatEnded, setChatEnded] = useState(false);
	const [startedAt, setStartedAt] = useState<number>(0);
	const [loading, setLoading] = useState(false);
	const { userType } = useCurrentUsersContext();
	const { chatId } = useParams();
	const router = useRouter();
	const hasChatEnded = useRef(false);

	// useEffect(() => {
	// 	if (chatId) {
	// 		const officialChatDocRef = doc(db, "chats", chatId as string);
	// 		const unSub = onSnapshot(officialChatDocRef, (doc) => {
	// 			if (doc.exists()) {
	// 				const data = doc.data();
	// 				setChat(data);
	// 				setStartedAt(data.startedAt);
	// 				if (data?.status === "ended") {
	// 					setChatEnded(true);
	// 					unSub(); // Unsubscribe the listener
	// 				}
	// 			}
	// 		}
	// 		);

	// 		return () => {
	// 			unSub();
	// 		};
	// 	}
	// }, [chatId]); // Dependency array to trigger only on chatId changes


	// useEffect(() => {
	// 	if (chatEnded && !hasChatEnded.current) {
	// 		hasChatEnded.current = true;
	// 		if (userType === "creator") router.replace(`/home`);
	// 		else {
	// 			const endedBy = localStorage.getItem("EndedBy");
	// 			localStorage.removeItem("chatRequestId");
	// 			localStorage.removeItem("chatId");
	// 			localStorage.removeItem("user2");
	// 			localStorage.removeItem("EndedBy");
	// 			router.replace(`/chat-ended/${chatId}/${chat?.callId}/${chat?.clientId}`);

	// 		}
	// 	}
	// }, [chatEnded]);

	// const handleEnd = async (
	// 	chatId: string | string[],
	// 	endedBy: string
	// ) => {
	// 	try {
	// 		setLoading(true);
	// 		const now = Date.now();

	// 		await updateDoc(doc(db, "chats", chatId as string), {
	// 			endedAt: now,
	// 			status: "ended",
	// 		});

	// 		await updateDoc(doc(db, "userchats", chat?.clientId as string), {
	// 			online: false,
	// 		});
	// 		await updateDoc(doc(db, "userchats", chat?.creatorId as string), {
	// 			online: false,
	// 		});

	// 		trackEvent("BookCall_Chat_Ended", {
	// 			Client_ID: chat?.clientId,
	// 			Creator_ID: chat?.creatorId,
	// 			Time_Duration_Consumed: chat?.startedAt ? (now - chat?.startedAt) / 1000 : null,
	// 			EndedBy: endedBy,
	// 		});

	// 		localStorage.removeItem("chatRequestId");
	// 		localStorage.removeItem("chatId");
	// 		localStorage.removeItem("user2");
	// 	} catch (error) {
	// 		Sentry.captureException(error);
	// 		console.error("Error ending chat:", error);
	// 	}
	// };

	return {
		chatId,
		chatEnded,
		startedAt,
		// handleEnd,
		chat,
		loading,
	};
};

export default useEndChat;
