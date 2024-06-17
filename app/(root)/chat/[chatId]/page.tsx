"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
	Timestamp,
	arrayUnion,
	doc,
	getDoc,
	onSnapshot,
	updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@clerk/nextjs";
import upload from "../../../../lib/upload";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import Messages from "@/components/chat/Messages";
import ChatInput from "@/components/chat/ChatInput";
import useChat from "@/hooks/useChat";
import useUserStatus from "@/hooks/useUserStatus";
import useMediaRecorder from "@/hooks/useMediaRecorder";

interface User2 {
	_id: string;
	clientId: string;
	creatorId: string;
	request: string;
	fullName: string;
	photo: string;
}

const ChatInterface: React.FC = () => {
	const { chat, markMessagesAsSeen } = useChat();
	const { user } = useUser();
	const { walletBalance, setWalletBalance } = useWalletBalanceContext();
	useUserStatus();
	const {
		audioStream,
		isRecording,
		audioBlob,
		startRecording,
		stopRecording,
		setAudioStream,
		mediaRecorderRef,
		setIsRecording,
	} = useMediaRecorder();
	const [text, setText] = useState("");
	const [user2, setUser2] = useState<User2>();
	const [isImgUploading, setIsImgUploading] = useState(false);
	const [isAudioUploading, setIsAudioUploading] = useState(false);
	const [img, setImg] = useState({
		file: null,
		url: "",
	});
	const [audio, setAudio] = useState<{ file: Blob | null; url: string }>({
		file: null,
		url: "",
	});
	const [receiverId, setReceiverId] = useState(null);
	const { chatId } = useParams();
	const audioContext = new AudioContext();

	useEffect(() => {
		const storedUser = localStorage.getItem("user2");
		if (storedUser) {
			setUser2(JSON.parse(storedUser));
		}
	}, []);

	useEffect(() => {
		const fetchReceiverId = async () => {
			try {
				const currentUserChatsRef = doc(
					db,
					"userchats",
					user?.publicMetadata?.userId as string
				);
				const currentUserChatsSnapshot = await getDoc(currentUserChatsRef);

				if (currentUserChatsSnapshot.exists()) {
					const currentUserChatsData = currentUserChatsSnapshot.data();
					const chat = currentUserChatsData.chats.find(
						(c: { chatId: string | string[] }) => c.chatId === chatId
					);
					setReceiverId(chat ? chat.receiverId : null);
				}
			} catch (error) {
				console.error("Error fetching receiver ID:", error);
			}
		};

		fetchReceiverId();
	}, [chatId, user?.publicMetadata?.userId, db]);

	useEffect(() => {
		if (!receiverId) return;

		const unsubscribe = onSnapshot(
			doc(db, "userchats", receiverId),
			(docSnapshot) => {
				if (docSnapshot.exists()) {
					const data = docSnapshot.data();
					if (data.online) {
						markMessagesAsSeen();
					}
				}
			}
		);

		return () => unsubscribe();
	}, [receiverId, db]);

	const handleImg = (e: any) => {
		if (e.target.files && e.target.files[0]) {
			setImg({
				file: e.target.files[0],
				url: URL.createObjectURL(e.target.files[0]),
			});
		}
	};

	const handleAudio = async (): Promise<string | null> => {
		if (audio.file) {
			const audioUrl = await upload(audio.file, "audio");
			return audioUrl;
		}
		return null;
	};

	const handleSend = async () => {
		if (text === "" && !img.file && !audio.file) return;

		let imgUrl = null;
		let audioUrl = null;

		try {
			if (!chatId) {
				console.log("invalid chatId");
				return;
			}

			if (img.file) {
				setIsImgUploading(true);
				imgUrl = await upload(img.file, "image");
				setIsImgUploading(false);
			}
			if (audio.file) {
				setIsAudioUploading(true);
				audioUrl = await handleAudio();
				setIsAudioUploading(false);
			}

			await updateDoc(doc(db, "chats", chatId as string), {
				messages: arrayUnion({
					senderId: user?.publicMetadata?.userId as string,
					createdAt: new Date(),
					seen: false,
					text,
					img: imgUrl,
					audio: audioUrl,
				}),
			});

			const userIDs = [
				user?.publicMetadata?.userId as string,
				user2?._id as string,
			];

			userIDs.forEach(async (id) => {
				if (!id) return;
				const userChatsRef = doc(db, "userchats", id as string);
				const userChatsSnapshot = await getDoc(userChatsRef);

				if (userChatsSnapshot.exists()) {
					const userChatsData = userChatsSnapshot.data();
					const chatIndex = userChatsData.chats.findIndex(
						(c: { chatId: string | string[] }) => c.chatId === chatId
					);
					userChatsData.chats[chatIndex].updatedAt = Date.now();
					await updateDoc(userChatsRef, {
						chats: userChatsData.chats,
					});
				}
			});
		} catch (error) {
			console.error(error);
		} finally {
			setImg({
				file: null,
				url: "",
			});
			setAudio({
				file: null,
				url: "",
			});
			setText("");
		}
	};

	useEffect(() => {
		let link;
		if (audioBlob) {
			link = URL.createObjectURL(audioBlob);
			setAudio({
				file: audioBlob,
				url: link,
			});
		}
		handleSendAudio(audioBlob!, link!);
	}, [audioBlob]);

	const handleSendAudio = async (audioBlob: Blob, audioUrl: string) => {
		setIsAudioUploading(true);

		try {
			const audioUploadUrl = await upload(audioBlob, "audio");
			await updateDoc(doc(db, "chats", chatId as string), {
				messages: arrayUnion({
					senderId: user?.publicMetadata?.userId as string,
					createdAt: new Date(),
					seen: false,
					audio: audioUploadUrl,
				}),
			});

			const userIDs = [
				user?.publicMetadata?.userId as string,
				user2?._id as string,
			];

			userIDs.forEach(async (id) => {
				const userChatsRef = doc(db, "userchats", id);
				const userChatsSnapshot = await getDoc(userChatsRef);

				if (userChatsSnapshot.exists()) {
					const userChatsData = userChatsSnapshot.data();
					const chatIndex = userChatsData.chats.findIndex(
						(c: { chatId: string | string[] }) => c.chatId === chatId
					);
					userChatsData.chats[chatIndex].updatedAt = Date.now();
					await updateDoc(userChatsRef, {
						chats: userChatsData.chats,
					});
				}
			});
		} catch (error) {
			console.error(error);
		} finally {
			setIsAudioUploading(false);
			setAudio({
				file: null,
				url: "",
			});

			if (audioStream) {
				audioStream.getTracks().forEach((track) => track.stop());
				setAudioStream(null);
			}
			if (mediaRecorderRef.current) {
				mediaRecorderRef.current.stop();
			}
		}
	};

	const toggleRecording = () => {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	};

	const discardAudio = () => {
		setIsAudioUploading(false);
		setIsRecording(false);
		setAudio({
			file: null,
			url: "",
		});

		if (audioStream) {
			audioStream.getTracks().forEach((track) => track.stop());
			setAudioStream(null);
		}
		if (mediaRecorderRef.current) {
			mediaRecorderRef.current.onstop = null;
			mediaRecorderRef.current.stop();
		}
	};

	const getTime = (createdAt: Timestamp, endedAt: Timestamp) => {
		const createdAtDate = createdAt.toDate();
		const endedAtDate = endedAt.toDate();
		const createdAtHoursInSeconds = createdAtDate.getHours() * 3600; // Convert hours to seconds
		const endedAtHoursInSeconds = endedAtDate.getHours() * 3600;
		const minutesInSeconds = createdAtDate.getMinutes() * 60; // Convert minutes to seconds
		const endedAtMinutesInSeconds = endedAtDate.getMinutes() * 3600;
		const createdAtInSeconds =
			createdAtDate.getSeconds() + createdAtHoursInSeconds + minutesInSeconds;
		const endedAtInSeconds =
			endedAtDate.getSeconds() +
			endedAtHoursInSeconds +
			endedAtMinutesInSeconds;
		return endedAtInSeconds - createdAtInSeconds;
	};

	const handleEnd = async () => {
		try {
			await updateDoc(doc(db, "chats", chatId as string), {
				endedAt: new Date(),
				status: "ended",
			});
			await updateDoc(doc(db, "userchats", user2?.clientId as string), {
				online: false,
			});
			await updateDoc(doc(db, "userchats", user2?.creatorId as string), {
				online: false,
			});

			await updateDoc(doc(db, "chatRequests", user2?.request as string), {
				duration: getTime(chat?.createdAt!, chat?.endedAt!),
			});
		} catch (error) {
			console.error("Error ending chat:", error);
		}
	};

	return (
		<div
			className="relative flex flex-col h-screen z-50"
			style={{ backgroundBlendMode: "luminosity" }}
		>
			<div className="absolute inset-0 bg-[url('/back.png')] bg-cover bg-center filter brightness-[0.25] blur-sx z-0" />
			<div className="absolute inset-0 bg-gradient-to-b from-[#232323] via-[#464646] to-[#383c39] opacity-90 z-0" />

			<div className="relative flex flex-col h-full z-10">
				<div className="sticky top-0 left-0 flex justify-between items-center px-5 py-4 bg-[#2c2c2c]">
					<div className="flex items-center gap-2">
						<Image
							src={user2?.photo || "/avatar.svg"}
							alt="profile"
							width={40}
							height={40}
							className="rounded-full"
						/>
						<div className="flex flex-col">
							<p
								className="text-sm leading-4"
								style={{ color: "rgba(112, 112, 112, 1)" }}
							>
								Ongoing chat with
							</p>
							<div className="text-white font-bold leading-6 text-xl">
								{user2?.fullName || "Username"}
							</div>
						</div>
					</div>
					<button
						onClick={handleEnd}
						className="bg-[rgba(255,81,81,1)] text-white px-4 py-3 rounded-lg"
					>
						End Chat
					</button>
				</div>

				<div className="leading-5 text-center text-white font-bold py-1 bg-[rgba(255,255,255,0.36)] mb-4">
					Time Left : 01:25
				</div>
				<div className="w-1/4 mx-auto text-center bg-[rgba(255,255,255,0.24)] py-1 text-white text-xs leading-6 font-bold rounded-lg mt-2 mb-4">
					07 Dec 2024
				</div>

				<Messages chat={chat!} img={img} isImgUploading={isImgUploading} />

				{/* <div className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.24)] mb-3">
                    <div className="leading-5 font-normal text-white">Recharge to continue this <br /> Audio call.</div>
                    <RechargeModal setWalletBalance={setWalletBalance} />
                </div> */}

				<ChatInput
					isRecording={isRecording}
					discardAudio={discardAudio}
					text={text}
					setText={setText}
					handleImg={handleImg}
					handleSend={handleSend}
					toggleRecording={toggleRecording}
					img={img}
					audio={audio}
					audioStream={audioStream!}
					audioContext={audioContext}
				/>
			</div>
		</div>
	);
};

export default ChatInterface;
