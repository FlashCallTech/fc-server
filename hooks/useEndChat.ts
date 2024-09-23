import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { analytics, db } from "@/lib/firebase";
import { creatorUser } from "@/types";
import { logEvent } from "firebase/analytics";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/mixpanel";
import { set } from "lodash";

interface User2 {
	_id: string;
	clientId: string;
	creatorId: string;
	request: string;
	fullName: string;
	photo: string;
	User_First_Seen: string;
}

interface Chat {
	startedAt: number;
	endedAt?: number;
	messages: {
		senderId: string;
		text: string;
		createdAt: number;
		img: string;
		audio: string;
		seen: boolean;
	}[];
}

const useEndChat = () => {
	const router = useRouter();
	const { currentUser } = useCurrentUsersContext();
	const { chatId } = useParams();
	const [user2, setUser2] = useState<User2>();
	const [chat, setChat] = useState<Chat | undefined>();
	const [chatEnded, setChatEnded] = useState(false);
	const [chatRatePerMinute, setChatRatePerMinute] = useState(0);
	const [endedAt, setEndedAt] = useState<number>();
	const [startedAt, setStartedAt] = useState<number>();
	const [loading, setLoading] = useState(false);
	const hasChatEnded = useRef(false);
	const [creatorPhone, setCreatorPhone] = useState("");

	// Function to update expert's status
	const updateExpertStatus = async (phone: string, status: string) => {
		try {
			const response = await fetch("/api/set-status", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ phone, status }),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || "Failed to update status");
			}

			console.log("Expert status updated to:", status);
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error updating expert status:", error);
		}
	};

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator.chatRate) {
				setChatRatePerMinute(parseInt(parsedCreator.chatRate, 10));
				setCreatorPhone(parsedCreator?.phone);
			}
		}
	}, [chatId]);

	useEffect(() => {
		if (chatId) {
			const unSub = onSnapshot(
				doc(db, "chats", chatId as string),
				(res: any) => {
					setChat(res.data());
					setStartedAt(res.data().startedAt as number);
					setChatEnded(res.data()?.status === "ended");
					if (res.data()?.status === "ended") {
						setEndedAt(res.data().endedAt); // Update endedAt using useState
					}
				}
			);
			return () => unSub();
		}
	}, [chatId]);

	useEffect(() => {
		if (hasChatEnded.current === true) return;

		if (chatEnded) {
			hasChatEnded.current = true;
			updateExpertStatus(creatorPhone, "Online");
			router.replace(`/chat-ended/${chatId}/${user2?.clientId}`);
		}
	}, [chatEnded]);

	useEffect(() => {
		const storedUser = localStorage.getItem("user2");
		if (storedUser) {
			setUser2(JSON.parse(storedUser));
		}
	}, [chatId]);

	const markMessagesAsSeen = async () => {
		if (!chatId) return;
		try {
			const chatRef = doc(db, "chats", chatId as string);
			const chatSnapshot = await getDoc(chatRef);
			if (chatSnapshot.exists()) {
				const chatData = chatSnapshot.data();
				const updatedMessages = chatData.messages.map((message: any) => ({
					...message,
					seen: true,
				}));
				await updateDoc(chatRef, { messages: updatedMessages });
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error marking messages as seen:", error);
		}
	};

	const handleEnd = async (
		chatId: string | string[],
		user2: User2 | undefined,
		endedBy: string
	) => {
		try {
			setLoading(true);
			const now = Date.now();

			await updateDoc(doc(db, "chats", chatId as string), {
				endedAt: now,
				status: "ended",
			});
			setEndedAt(now); // Update endedAt state

			await updateDoc(doc(db, "userchats", user2?.clientId as string), {
				online: false,
			});
			await updateDoc(doc(db, "userchats", user2?.creatorId as string), {
				online: false,
			});

			localStorage.removeItem("chatRequestId");

			trackEvent("BookCall_Chat_Ended", {
				Client_ID: user2?.clientId,
				User_First_Seen: user2?.User_First_Seen,
				Creator_ID: user2?.creatorId,
				Time_Duration_Available: (endedAt! - startedAt!).toString(),
				Walletbalace_Available: currentUser?.walletBalance,
				Endedby: endedBy,
			});

			// logEvent(analytics, "call_ended", {
			// 	userId: currentUser?._id,
			// 	// creatorId: creator._id,
			// });
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error ending chat:", error);
		}
	};

	return {
		chatId,
		chatEnded,
		handleEnd,
		user2,
		startedAt,
		endedAt,
		chat,
		markMessagesAsSeen,
		chatRatePerMinute,
		loading,
	};
};

export default useEndChat;
