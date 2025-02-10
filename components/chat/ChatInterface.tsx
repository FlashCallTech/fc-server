"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
	arrayUnion,
	doc,
	getDoc,
	updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import upload from "../../lib/upload";
import Messages from "@/components/chat/Messages";
import ChatInput from "@/components/chat/ChatInput";
import useMediaRecorder from "@/hooks/useMediaRecorder";
import ChatTimer from "./ChatTimer";
import EndCallDecision from "../calls/EndCallDecision";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import CreatorChatTimer from "../creator/CreatorChatTimer";
import Tip from "./Tip";
import { useChatContext } from "@/lib/context/ChatContext";
import Loader from "../shared/Loader";

const ChatInterface: React.FC = () => {
	const [text, setText] = useState<string>("");
	const [isImgUploading, setIsImgUploading] = useState(false);
	const [isAudioUploading, setIsAudioUploading] = useState(false);
	const [showDialog, setShowDialog] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const [currentUserMessageSent, setCurrentUserMessageSent] = useState<boolean>(false);
	const [replyIndex, setReplyIndex] = useState<number>();
	// const [receiverId, setReceiverId] = useState(null);
	const [img, setImg] = useState({
		file: null,
		url: "",
	});
	const [audio, setAudio] = useState<{ file: Blob | null; url: string }>({
		file: null,
		url: "",
	});
	// const typingTimeout = 2000; // Time in milliseconds to wait before resetting isTyping

	const { handleEnd, chat, messages, chatId, chatLoading } = useChatContext();
	// const { markMessagesAsSeen } = useMarkAsSeen();
	const { currentUser, userType } = useCurrentUsersContext();
	const {
		audioStream,
		isRecording,
		setMp3Blob,
		mp3Blob,
		startRecording,
		stopRecording,
		setAudioStream,
		mediaRecorderRef,
		setIsRecording,
	} = useMediaRecorder();

	useEffect(() => {
		const updateChatStartedAt = async () => {
			if (!chatId) return; // Exit if chatId is not available

			try {
				// Get the document with the provided chatId
				const chatDocRef = doc(db, "chats", chatId as string);
				const chatDocSnap = await getDoc(chatDocRef);

				if (chatDocSnap.exists()) {
					const chatData = chatDocSnap.data();

					// Check if the status is "active"
					if (!chatData.timerSet) {
						// If status is not active, update startedAt
						await updateDoc(chatDocRef, {
							startedAt: Date.now(),
							endedAt: null,
							timerSet: true,
						});
					}
					// If status is active, do nothing
				} else {
					console.error("No such chat document!");
				}
			} catch (error) {
				console.error("Error fetching or updating chat document: ", error);
			}
		};

		updateChatStartedAt();
	}, [chatId]); // Add chatId as a dependency

	// useEffect(() => {
	// 	const fetchReceiverId = async () => {
	// 		try {
	// 			const currentUserChatsRef = doc(
	// 				db,
	// 				"userchats",
	// 				currentUser?._id as string
	// 			);
	// 			const currentUserChatsSnapshot = await getDoc(currentUserChatsRef);

	// 			if (currentUserChatsSnapshot.exists()) {
	// 				const currentUserChatsData = currentUserChatsSnapshot.data();
	// 				const chat = currentUserChatsData.chats.find(
	// 					(c: { chatId: string | string[] }) => c.chatId === chatId
	// 				);
	// 				setReceiverId(chat ? chat.receiverId : null);
	// 			}
	// 		} catch (error) {
	// 			console.error("Error fetching receiver ID:", error);
	// 		}
	// 	};
	// 	fetchReceiverId();
	// }, [chatId, currentUser?._id, messages, db]);

	// useEffect(() => {
	// 	if (!receiverId) return;
	// 	const unsubscribe = onSnapshot(
	// 		doc(db, "userchats", receiverId),
	// 		(docSnapshot) => {
	// 			if (docSnapshot.exists()) {
	// 				const data = docSnapshot.data();
	// 				if (data.online) {
	// 					markMessagesAsSeen();
	// 					setReceiverId(null);
	// 				}
	// 			}
	// 		}
	// 	);
	// 	return () => unsubscribe();
	// }, [receiverId, db]);

	useEffect(() => {
		let link;
		if (mp3Blob) {
			link = URL.createObjectURL(mp3Blob);
			setAudio({
				file: mp3Blob,
				url: link,
			});
			handleSendAudio(mp3Blob!, link!);
		}
	}, [mp3Blob]);

	useEffect(() => {
		const typing = async () => {
			if (!chatId) return;

			if (userType) {
				const id = userType === "client" ? chat?.clientId as string : chat?.creatorId as string;
				if (id) {
					const userchatDocRef = doc(db, "userchats", id as string);
					const userchatDocSnap = await getDoc(userchatDocRef);

					if (userchatDocSnap.exists()) {
						await updateDoc(userchatDocRef, {
							isTyping
						})
					}
				}
			}
		}

		typing();
	}, [isTyping])

	const handleCapturedImg = (e: any) => {
		if (e.target.files && e.target.files[0]) {
			setImg({
				file: e.target.files[0],
				url: URL.createObjectURL(e.target.files[0]),
			});
			handleSend();
		}
	};

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

	const handleSendTip = async (tipAmt: string) => {
		if (!tipAmt) {
			return;
		}

		try {
			if (!chatId) {
				return;
			}
			await updateDoc(doc(db, "messages", chatId as string), {
				messages: arrayUnion({
					senderId: currentUser?._id as string,
					createdAt: Date.now(),
					seen: true,
					text,
					tip: tipAmt,
					img: null,
					audio: null,
					global: currentUser?.global ?? false,
				}),
			});
		} catch (error) {
			console.error(error);
		} finally {
			setText("");
		}
	};

	const handleSend = async () => {
		setCurrentUserMessageSent(false);
		if (text === "" && !img.file && !audio.file) {
			return;
		}
		let imgUrl: string | null = null;
		let audioUrl: string | null = null;
		try {
			if (!chatId) {
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
			await updateDoc(doc(db, "messages", chatId as string), {
				messages: arrayUnion({
					senderId: currentUser?._id as string,
					replyIndex : replyIndex ?? null,
					createdAt: Date.now(),
					seen: true,
					text,
					img: imgUrl,
					audio: audioUrl,
				}),
			});
		} catch (error) {
			console.error(error);
		} finally {
			setCurrentUserMessageSent(true);
			setReplyIndex(undefined);
			setImg({
				file: null,
				url: "",
			});
			setAudio({
				file: null,
				url: "",
			});
			setText("");
			setIsTyping(false);
		}
	};


	const handleSendAudio = async (audioBlob: Blob, audioUrl: string) => {
		setCurrentUserMessageSent(false);
		setIsAudioUploading(true);
		let imgUrl = null;

		try {
			const audioUploadUrl = await upload(audioBlob, "audio");
			await updateDoc(doc(db, "messages", chatId as string), {
				messages: arrayUnion({
					senderId: currentUser?._id as string,
					replyIndex: replyIndex ?? null,
					createdAt: Date.now(),
					seen: true,
					text: null,
					img: imgUrl,
					audio: audioUploadUrl,
				}),
			});
		} catch (error) {
			console.error(error);
		} finally {
			setCurrentUserMessageSent(true);
			setReplyIndex(undefined);
			setIsAudioUploading(false);
			setAudio({
				file: null,
				url: "",
			});
			setMp3Blob(null);

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
		setShowDialog(true);
	};

	const handleDecisionDialog = async () => {
		localStorage.setItem("EndedBy", "client");
		await handleEnd(chatId as string, userType as string);
		setShowDialog(false);
	};

	const discardImage = () => {
		setIsImgUploading(false);
		setImg({
			file: null,
			url: "",
		});
	};

	const handleCloseDialog = () => {
		setShowDialog(false);
	};

	const discardReply = () => {
		setReplyIndex(undefined);
		setIsTyping(false);
	}

	useEffect(() => {
		const handleResize = () => {
			const height = window.innerHeight;
			document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
		};

		window.addEventListener("resize", handleResize);
		handleResize();

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	if(chatLoading) {
		return <Loader />
	}

	return (
		<div className="w-full h-screen">
			{/* Mobile Layout */}
			<div
				className={`flex flex-col h-screen justify-between w-full bg-cover bg-center overflow-y-auto scrollbar-hide md:hidden`}
				style={{ backgroundImage: 'url(/back.png)' }}
			>
				<div className="fixed top-0 left-0 w-full flex justify-between items-center px-4 py-[2px] bg-gray-500 z-30 md:hidden">
					<div className="flex items-center gap-2">
						<Image
							src={`${userType === "client" ? chat?.creatorPhoto ?? 'https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2FM_preview.png?alt=media&token=750fc704-c540-4843-9cbd-bfc4609780e0' : chat?.clienPhoto ?? 'https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2FM_preview.png?alt=media&token=750fc704-c540-4843-9cbd-bfc4609780e0'}`}
							alt="profile"
							width={1000}
							height={1000}
							className="size-10 min-w-10 rounded-full object-cover"
						/>
						<div className="flex flex-col">
							<div className="text-white font-bold text-xs md:text-lg">
								{userType === "client" ? chat?.creatorName : chat?.clientName}
							</div>
							{userType === "client" && <ChatTimer />}
							{userType === "creator" && (
								<CreatorChatTimer chatId={chatId as string} />
							)}
							<p className="text-[10px] md:text-sm text-green-500">
								Ongoing chat
							</p>
						</div>
					</div>
					<div className="flex gap-2">
						<Tip
							handleSendTip={handleSendTip}
							setText={setText}
							creatorId={chat?.creatorId}
						/>
						<button
							onClick={endCall}
							className="bg-[rgba(255,81,81,1)] text-white p-2 text-[10px] md:text-sm rounded-lg hoverScaleDownEffect"
						>
							End
						</button>
					</div>
				</div>
				{showDialog && (
					<EndCallDecision
						handleDecisionDialog={handleDecisionDialog}
						setShowDialog={handleCloseDialog}
					/>
				)}
				<div className="mt-auto pt-[50px]">
					{/* Chat Messages */}
					{img?.url ? (
						<div className="relative mb-[48px] z-20 p-2 bg-black">
							<div className={`relative ${isImgUploading ? "opacity-50" : ""}`}>
								{/* Show the image */}
								<Image
									src={img.url}
									alt="Uploaded content"
									width={500}
									height={500}
									className="object-contain mx-auto"
								/>

								{isImgUploading && (
									<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
										<div className="w-10 h-10 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
									</div>
								)}
							</div>

							<div className="absolute top-2 right-2 bg-white text-xs font-bold rounded-sm">
								<button onClick={discardImage}>
									Close
								</button>
							</div>
						</div>
					) : (
						chat && (
							<div className="mb-[56px] z-20">
								<Messages chat={chat} messages={messages} currentUserMessageSent={currentUserMessageSent} setReplyIndex={setReplyIndex} setText={setText} />
							</div>
						)
					)}

					{/* Sticky Chat Input at the Bottom */}
					<div
						className="fixed bottom-0 w-full z-30 bg-cover bg-center p-safe-bottom md:hidden"
						style={{
							backgroundImage: img.url ? 'none' : 'url(/back.png)',
							backgroundColor: img.url ? 'black' : 'transparent',
						  }}
					>
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
							handleCapturedImg={handleCapturedImg}
							isImgUploading={isImgUploading}
							isAudioUploading={isAudioUploading}
							discardImage={discardImage}
							isTyping={isTyping}
							setIsTyping={setIsTyping}
							replyIndex={replyIndex}
							chat={chat}
							discardReply={discardReply}
						/>
					</div>
				</div>
			</div>
			{/* Large Screen Layout */}
			<div
				className={`hidden md:flex items-center justify-center h-screen w-full bg-black`}
			>
				<div
					className="md:w-[50%] lg:w-[70%] h-[98%] md:flex flex-col rounded-md bg-cover bg-center"
					style={{ backgroundImage: 'url(/back.png)' }}
				>
					<div className="flex w-full justify-between rounded-t-md items-center px-2 bg-gray-500">
						<div className="flex items-center gap-2">
							<div className="lg:flex items-center gap-2"></div>
							<Image
								src={`${userType === "client" ? chat?.creatorPhoto ?? 'https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2FM_preview.png?alt=media&token=750fc704-c540-4843-9cbd-bfc4609780e0' : chat?.clienPhoto ?? 'https://firebasestorage.googleapis.com/v0/b/flashcallchat.appspot.com/o/assets%2FM_preview.png?alt=media&token=750fc704-c540-4843-9cbd-bfc4609780e0'}`}
								alt="profile"
								width={1000}
								height={1000}
								className="size-10 min-w-10 rounded-full object-cover"
							/>
							<div className="flex flex-col">
								<div className="text-white font-bold text-xs md:text-lg">
									{userType === "client" ? chat?.creatorName : chat?.clientName}
								</div>
								{userType === "client" && <ChatTimer />}
								{userType === "creator" && (
									<CreatorChatTimer chatId={chatId as string} />
								)}
								<p className="text-[10px] md:text-sm text-green-500">
									Ongoing chat
								</p>
							</div>
						</div>
						<div>
							<div className="flex gap-2">
								<Tip
									handleSendTip={handleSendTip}
									setText={setText}
									creatorId={chat?.creatorId}
								/>
								<button
									onClick={endCall}
									className="bg-[rgba(255,81,81,1)] text-white p-2 text-[10px] md:text-sm rounded-lg hoverScaleDownEffect"
								>
									End
								</button>
							</div>
						</div>
					</div>
					{showDialog && (
						<EndCallDecision
							handleDecisionDialog={handleDecisionDialog}
							setShowDialog={handleCloseDialog}
						/>
					)}
					<div className="mt-auto overflow-y-auto scrollbar-hide">
						{/* Chat Messages */}
						{img?.url ? (
							<div className="relative z-20 p-2 h-full bg-black">
								<div className={`relative ${isImgUploading ? "opacity-50" : ""}`}>
									{/* Show the image */}
									<Image
										src={img.url}
										alt="Uploaded content"
										width={500}
										height={500}
										className="object-contain mx-auto"
									/>

									{isImgUploading && (
										<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
											<div className="w-10 h-10 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
										</div>
									)}
								</div>

								<div className="absolute top-2 right-2 bg-white text-xs font-bold rounded-sm">
									<button onClick={discardImage}>
										Close
									</button>
								</div>
							</div>
						) : (
							chat && (
								<div className="z-20">
									<Messages chat={chat} messages={messages} currentUserMessageSent={currentUserMessageSent} setReplyIndex={setReplyIndex} setText={setText} />
								</div>
							)
						)}
					</div>
					{/* Sticky Chat Input at the Bottom */}
					<div className={`w-full z-30 p-safe-bottom ${img.url ? "bg-black" : ""}`}>
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
							handleCapturedImg={handleCapturedImg}
							isImgUploading={isImgUploading}
							isAudioUploading={isAudioUploading}
							discardImage={discardImage}
							isTyping={isTyping}
							setIsTyping={setIsTyping}
							replyIndex={replyIndex}
							chat={chat}
							discardReply={discardReply}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ChatInterface;