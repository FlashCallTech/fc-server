"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
	arrayUnion,
	doc,
	getDoc,
	onSnapshot,
	updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import upload from "../../lib/upload";
import Messages from "@/components/chat/Messages";
import ChatInput from "@/components/chat/ChatInput";
import useUserStatus from "@/hooks/useUserStatus";
import useMediaRecorder from "@/hooks/useMediaRecorder";
import ChatTimer from "./ChatTimer";
import EndCallDecision from "../calls/EndCallDecision";
import useEndChat from "@/hooks/useEndChat";
import ContentLoading from "../shared/ContentLoading";
import RechargeAndTip from "./RechargeAndTip";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const ChatInterface: React.FC = () => {
	const { handleEnd, chat, markMessagesAsSeen, loading } = useEndChat();
	const { currentUser } = useCurrentUsersContext();

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
	const { user2, chatId } = useEndChat();
	const [text, setText] = useState("");
	const [isImgUploading, setIsImgUploading] = useState(false);
	const [isAudioUploading, setIsAudioUploading] = useState(false);
	const [img, setImg] = useState({
		file: null,
		url: "",
	});
	const [showDialog, setShowDialog] = useState(false);
	const [audio, setAudio] = useState<{ file: Blob | null; url: string }>({
		file: null,
		url: "",
	});
	const [receiverId, setReceiverId] = useState(null);
	const audioContext = new AudioContext();
	const [messages, setMessages] = useState<
		{ text: string | null; img: string | null; audio: string | null }[]
	>([]);

	useEffect(() => {
		updateDoc(doc(db, "chats", chatId as string), {
			startedAt: Date.now(),
			endedAt: null,
		});
	}, []);

	useEffect(() => {
		const fetchReceiverId = async () => {
			try {
				const currentUserChatsRef = doc(
					db,
					"userchats",
					currentUser?._id as string
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
	}, [chatId, currentUser?._id, messages, db]);

	useEffect(() => {
		if (!receiverId) return;
		const unsubscribe = onSnapshot(
			doc(db, "userchats", receiverId),
			(docSnapshot) => {
				if (docSnapshot.exists()) {
					const data = docSnapshot.data();
					if (data.online) {
						markMessagesAsSeen();
						setReceiverId(null);
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
		let imgUrl: string | null = null;
		let audioUrl: string | null = null;
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
					senderId: currentUser?._id as string,
					createdAt: Date.now(),
					seen: false,
					text,
					img: imgUrl,
					audio: audioUrl,
				}),
			});
			setMessages((prevMessages) => [
				...prevMessages,
				{ text: null, img: imgUrl, audio: audioUrl },
			]);
			const userIDs = [user2?.clientId as string, user2?.creatorId as string];
			userIDs.forEach(async (id) => {
				if (!id) return;
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

		let imgUrl = null;

		try {
			const audioUploadUrl = await upload(audioBlob, "audio");
			await updateDoc(doc(db, "chats", chatId as string), {
				messages: arrayUnion({
					senderId: currentUser?._id as string,
					createdAt: Date.now(),
					seen: false,
					text: null,
					img: imgUrl,
					audio: audioUploadUrl,
				}),
			});

			const userIDs = [user2?.clientId as string, user2?.creatorId as string];

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

	const endCall = async () => {
		setShowDialog(true); // Show the confirmation dialog
		// setAnyModalOpen(true);
	};

	const handleDecisionDialog = async () => {
		await handleEnd(chatId as string, user2);
		if (loading) {
			return <ContentLoading />;
		}
		setShowDialog(false);
		// isMeetingOwner && router.push(`/feedback/${call?.id}/${totalTimeUtilized}`);
		// toast({
		// 	title: "Call Ended",
		// 	description: "The call Ended. Redirecting ...",
		// });
	};

	const handleCloseDialog = () => {
		setShowDialog(false);
	};

	return (
		<>
			{loading ? (
				<ContentLoading />
			) : (
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
								onClick={endCall}
								className="bg-[rgba(255,81,81,1)] text-white px-4 py-3 rounded-lg"
							>
								End Chat
							</button>
						</div>
						{showDialog && (
							<EndCallDecision
								handleDecisionDialog={handleDecisionDialog}
								setShowDialog={handleCloseDialog}
							/>
						)}
						<ChatTimer endCall={endCall} />
						<div className="w-1/4 mx-auto text-center bg-[rgba(255,255,255,0.24)] py-1 text-white text-xs leading-6 font-bold rounded-lg mt-2 mb-4">
							07 Dec 2024
						</div>

						<Messages chat={chat!} img={img} isImgUploading={isImgUploading} />

						<RechargeAndTip />

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
			)}
		</>
	);
};

export default ChatInterface;
