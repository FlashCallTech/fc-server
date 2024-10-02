import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useParams, usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import { MemberRequest, clientUser, creatorUser } from "@/types";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { getCreatorById } from "@/lib/actions/creator.actions";
import { getDefaultLocale } from "react-datepicker";
import { getUserById } from "@/lib/actions/client.actions";

interface Chat {
	startedAt: number;
	endedAt?: number;
	messages: {
		senderId: string;
		text: string;
		createdAt: Timestamp;
		img: string;
		audio: string;
		seen: boolean;
	}[];
}

interface User2 {
	_id: string;
	clientId: string;
	creatorId: string;
	request: string;
	fullName: string;
	photo: string;
}

const useChat = () => {
	const [chat, setChat] = useState<Chat | undefined>();
	const [chatEnded, setChatEnded] = useState(false);
	const [startedAt, setStartedAt] = useState<number>();
	const [creator, setCreator] = useState<creatorUser>();
	const [client, setClient] = useState<clientUser>();
	const [endedAt, setEndedAt] = useState<number | undefined>();
	const [duration, setDuration] = useState<number | undefined>();
	const [amount, setAmount] = useState<number | undefined>(); // Use state for amount
	const [rejected, setRejected] = useState<boolean>(false);
	const [chatRatePerMinute, setChatRatePerMinute] = useState(0);
	const [user2, setUser2] = useState<User2 | undefined>();
	const [flag, setFlag] = useState(true);
	const [ended, setEnded] = useState<boolean>(false);
	const [chatRejected, setChatRejected] = useState<boolean>(false);
	const [chatRequestId, setChatRequestId] = useState<string>();
	const { chatId } = useParams();

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			setCreator(parsedCreator);
			if (parsedCreator.chatRate) {
				setChatRatePerMinute(parseInt(parsedCreator.chatRate, 10));
			}
		} else {
			const creatorId = localStorage.getItem("currentUserID");
			const getCreator = async () => {
				const response = await getCreatorById(creatorId as string);
				setCreator(response);
			};
			getCreator();
		}
		const userType = localStorage.getItem("userType");
		if (userType === "client") {
			const clientId = localStorage.getItem("currentUserID");
			const getClient = async () => {
				const response = await getUserById(clientId as string);
				setClient(response);
			};
			getClient();
		} else if (userType === "creator" && rejected === true) {
			const clientId = user2?.clientId;
			const getClient = async () => {
				const response = await getUserById(clientId as string);
				setClient(response);
			};
			getClient();
		}
	}, [chatId, rejected]);

	const members: MemberRequest[] = [
		{
			user_id: user2?.creatorId!,
			// user_id: "66681d96436f89b49d8b498b",
			custom: {
				name: String(creator?.username),
				type: "expert",
				image: String(creator?.photo),
			},
			role: "call_member",
		},
		{
			user_id: String(client?._id),
			custom: {
				name: String(client?.username),
				type: "client",
				image: String(client?.photo),
			},
			role: "admin",
		},
	];

	useEffect(() => {
		const storedUser = localStorage.getItem("user2");
		if (storedUser) {
			setUser2(JSON.parse(storedUser));
		}
	}, [chatId]);

	useEffect(() => {
		const handleChatRequestIdUpdate = () => {
			const storedChatRequestId = localStorage.getItem("chatRequestId");
			if (storedChatRequestId) {
				setChatRequestId(storedChatRequestId);
			}
		};

		// Listen for the custom event
		window.addEventListener("chatRequestIdUpdated", handleChatRequestIdUpdate);

		// Optionally, check on initial mount as well
		const storedChatRequestId = localStorage.getItem("chatRequestId");
		if (storedChatRequestId) {
			setChatRequestId(storedChatRequestId);
		}

		return () => {
			window.removeEventListener(
				"chatRequestIdUpdated",
				handleChatRequestIdUpdate
			);
		};
	}, []);

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

	// useEffect(() => {
	// 	if (chatRequestId) {
	// 		const unSub = onSnapshot(
	// 			doc(db, "chatRequests", chatRequestId as string),
	// 			(res: any) => {
	// 				setChatRejected(res.data()?.status === "rejected");
	// 			}
	// 		);
	// 		return () => unSub();
	// 	}
	// }, [chatRequestId]);

	useEffect(() => {
		if (chatEnded && startedAt && endedAt) {
			const chatDuration = endedAt - startedAt;
			setDuration(chatDuration);
			const chatDurationMinutes = chatDuration / (1000 * 60); // Convert milliseconds to minutes
			const calculatedAmount = chatDurationMinutes * chatRatePerMinute;
			setAmount(calculatedAmount);
			setEnded(true);
		}
	}, [chatEnded, startedAt, endedAt, chatRatePerMinute]);

	const createChat = async (
		chatId: string,
		status: string,
		clientId: string | undefined
	) => {
		const [existingChat] = await Promise.all([
			fetch(`/api/v1/calls/getChat?chatId=${chatId}`).then((res) => res.json()),
		]);

		if (existingChat) {
			if (status === "rejected") {
				await fetch("/api/v1/calls/updateChat", {
					method: "PUT",
					body: JSON.stringify({
						chatId,
						startedAt: new Date(),
						duration,
						status,
					}),
				});
			} else {
				if (startedAt && endedAt && duration) {
					await fetch("/api/v1/calls/updateChat", {
						method: "PUT",
						body: JSON.stringify({
							chatId,
							endedAt: new Date(endedAt),
							startedAt: new Date(startedAt),
							duration,
							status,
						}),
					});
				}
			}
		} else {
			if (status === "rejected") {
				setRejected(true);
				await fetch("/api/v1/calls/registerChat", {
					method: "POST",
					body: JSON.stringify({
						chatId: chatId,
						creator: clientId,
						status: status,
						members: members,
						startedAt: new Date(),
						endedAt: endedAt ? endedAt : null,
						duration: duration ? duration : null,
					}),
				});
			} else {
				if (startedAt && endedAt && duration) {
					await fetch("/api/v1/calls/registerChat", {
						method: "POST",
						body: JSON.stringify({
							chatId: chatId,
							creator: user2?.clientId,
							status: status,
							members: members,
							startedAt: new Date(startedAt),
							endedAt: new Date(endedAt),
							duration: duration,
						}),
					});
				}
			}
		}
	};

	if (
		duration &&
		endedAt &&
		amount &&
		flag &&
		ended &&
		user2?.clientId === client?._id
	) {
		setFlag(false);
		createChat(chatId as string, "ended", user2?.clientId);
	}

	return { duration, amount, createChat };
};

export default useChat;
