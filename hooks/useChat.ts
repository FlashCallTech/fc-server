import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useParams, usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import { MemberRequest, creatorUser } from "@/types";
import { useUser } from "@clerk/nextjs";

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
	const [endedAt, setEndedAt] = useState<number | undefined>();
	const [duration, setDuration] = useState<number | undefined>();
	const [amount, setAmount] = useState<number | undefined>(); // Use state for amount
	const [chatRatePerMinute, setChatRatePerMinute] = useState(0);
	const [user2, setUser2] = useState<User2 | undefined>();
	const [flag, setFlag] = useState(true);
	const { chatId } = useParams();
	const router = useRouter();
	const { user } = useUser();
	const pathname = usePathname();

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			setCreator(parsedCreator);
			if (parsedCreator.chatRate) {
				setChatRatePerMinute(parseInt(parsedCreator.chatRate, 10));
			}
		}
	}, [chatId]);

	useEffect(() => {
		const storedUser = localStorage.getItem("user2");
		if (storedUser) {
			setUser2(JSON.parse(storedUser));
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
		if (chatEnded && startedAt && endedAt) {
			const chatDuration = endedAt - startedAt;
			setDuration(chatDuration);
			const chatDurationMinutes = chatDuration / (1000 * 60); // Convert milliseconds to minutes
			const calculatedAmount = chatDurationMinutes * chatRatePerMinute;
			setAmount(calculatedAmount);
		}
	}, [chatEnded, startedAt, endedAt, chatRatePerMinute]);

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
			user_id: String(user?.publicMetadata?.userId),
			custom: {
				name: String(user?.username),
				type: "client",
				image: String(user?.imageUrl),
			},
			role: "admin",
		},
	];

	const createChat = async (chatId: string, status: string) => {
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
				await fetch("/api/v1/calls/registerChat", {
					method: "POST",
					body: JSON.stringify({
						chatId: chatId,
						creator: user2?.clientId,
						status: status,
						members: members,
						startedAt: new Date(),
						duration: duration,
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
		user2?.clientId === user?.publicMetadata?.userId
	) {
		console.log("outside", flag);
		setFlag(false);
		createChat(chatId as string, "ended");
	}

	return { duration, amount, createChat };
};

export default useChat;
