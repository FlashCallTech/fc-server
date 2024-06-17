"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
	arrayUnion,
	doc,
	getDoc,
	onSnapshot,
	updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@clerk/nextjs";
import upload from "../../../../lib/upload";
import AudioVisualizer from "../../../../lib/AudioVisualizer";
import ImageModal from "@/lib/imageModal";
import RechargeModal from "@/components/calls/RechargeModal";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";

interface Chat {
	messages: {
		senderId: string;
		text: string;
		createdAt: number;
		img: string;
		audio: string;
	}[];
}

interface User2 {
	_id: string;
	clientId: string;
	fullName: string;
	photo: string;
}

const ChatInterface: React.FC = () => {
	const [text, setText] = useState("");
	const [chat, setChat] = useState<Chat | undefined>();
	const [creator, setCreator] = useState<any>(null);
	const { chatId } = useParams();
	const [chatEnded, setChatEnded] = useState(false);
	const { user } = useUser();
	const [user2, setUser2] = useState<User2>();
	const { walletBalance, setWalletBalance } = useWalletBalanceContext();

	const [img, setImg] = useState({
		file: null,
		url: "",
	});
	const [audio, setAudio] = useState<{ file: Blob | null; url: string }>({
		file: null,
		url: "",
	});
	const [isRecording, setIsRecording] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
	const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
	const router = useRouter();

	const [isImgUploading, setIsImgUploading] = useState(false);
	const [isAudioUploading, setIsAudioUploading] = useState(false);

	const handleImageClick = (imageUrl: string) => {
		setFullImageUrl(imageUrl);
	};

	const handleCloseModal = () => {
		setFullImageUrl(null);
	};

	useEffect(() => {
		const storedUser = localStorage.getItem("user2");

		if (storedUser) {
			setUser2(JSON.parse(storedUser));
		}
	}, []);

	useEffect(() => {
		const unSub = onSnapshot(doc(db, "chats", chatId as string), (res: any) => {
			setChat(res.data());
			setChatEnded(res.data()?.status === "ended");
		});

		return () => {
			unSub();
		};
	}, [chatId]);

	useEffect(() => {
		if (chatEnded) {
			router.replace("/chat-ended");
		}
	}, [chatEnded, router]);

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

	const startRecording = (): void => {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices
				.getUserMedia({ audio: true })
				.then((stream: MediaStream) => {
					setAudioStream(stream);
					mediaRecorderRef.current = new MediaRecorder(stream);
					mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => {
						audioChunksRef.current.push(e.data);
					};
					mediaRecorderRef.current.onstop = async () => {
						const audioBlob: Blob = new Blob(audioChunksRef.current, {
							type: "audio/wav",
						});
						const audioUrl: string = URL.createObjectURL(audioBlob);

						setAudio({
							file: audioBlob,
							url: audioUrl,
						});
						audioChunksRef.current = [];

						stream.getTracks().forEach((track) => track.stop());
						setAudioStream(null);

						await handleSendAudio(audioBlob, audioUrl);
					};
					mediaRecorderRef.current.start();
					setIsRecording(true);
				})
				.catch((error: Error) => {
					console.error("Error accessing microphone:", error);
				});
		} else {
			console.error("getUserMedia not supported on your browser!");
		}
	};

	const stopRecording = (): void => {
		if (mediaRecorderRef.current) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
		}
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

			if (text === "" && !img.file && !audio.file) return;

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
					...(text && { text }),
					...(imgUrl && { img: imgUrl }),
					...(audioUrl && { audio: audioUrl }),
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

					userChatsData.chats[chatIndex].lastMessage = text || "Audio Message";
					userChatsData.chats[chatIndex].isSeen =
						id === (user?.publicMetadata?.userId as string) ? true : false;
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

	const handleSendAudio = async (audioBlob: Blob, audioUrl: string) => {
		setIsAudioUploading(true);

		try {
			const audioUploadUrl = await upload(audioBlob, "audio");

			await updateDoc(doc(db, "chats", chatId as string), {
				messages: arrayUnion({
					senderId: user?.publicMetadata?.userId as string,
					createdAt: new Date(),
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

					userChatsData.chats[chatIndex].lastMessage = "Audio Message";
					userChatsData.chats[chatIndex].isSeen =
						id === (user?.publicMetadata?.userId as string) ? true : false;
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

			// Ensure to stop the audio stream and recorder
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
			// Remove the onstop handler before stopping the media recorder
			mediaRecorderRef.current.onstop = null;
			mediaRecorderRef.current.stop();
		}
	};

	const handleEnd = async () => {
		try {
			await updateDoc(doc(db, "chats", chatId as string), {
				status: "ended",
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

			<div className="relative flex flex-col h-full z-10 ">
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

				<div className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
					<div className="mb-4 text-left">
						{chat?.messages?.map((message, index) => (
							<div
								className={
									message.senderId === (user?.publicMetadata?.userId as string)
										? "bg-[rgba(255,255,255,1)] p-3 mb-3 max-w-[60%] w-fit rounded-lg rounded-tr-none ml-auto text-black font-normal leading-5 relative"
										: "bg-[rgba(80,166,92,1)] p-3 mb-3 max-w-[60%] w-fit rounded-lg rounded-tl-none text-white font-normal leading-5 relative"
								}
								key={message?.createdAt}
								style={{ wordBreak: "break-word", justifyContent: "center" }}
							>
								{message.img && (
									<img
										src={message.img}
										alt=""
										className="w-full h-auto cursor-pointer"
										onClick={() => handleImageClick(message.img)}
									/>
								)}
								{fullImageUrl && (
									<ImageModal
										imageUrl={fullImageUrl}
										onClose={handleCloseModal}
									/>
								)}
								{message.audio && (
									<div className="w-full items-center justify-center">
										<audio
											controls
											src={message.audio}
											style={{ width: "40vw" }}
										></audio>
									</div>
								)}
								{message.text && (
									<div style={{ wordBreak: "break-word" }}>{message.text}</div>
								)}
								<p className="text-xs text-gray-600 text-right mt-1"></p>
								<div
									className={
										message.senderId ===
										(user?.publicMetadata?.userId as string)
											? "rotate-90 absolute right-[-4px] top-[-4px] w-0 h-0 rounded-full border-[8px] border-l-white border-r-0 border-solid border-transparent"
											: "rotate-90 absolute left-[-4px] top-[-4px] w-0 h-0 rounded-full border-[8px] border-l-[rgba(80,166,92,1)] border-r-0 border-solid border-transparent"
									}
								></div>
							</div>
						))}
						{img.url && (
							<div
								className="bg-[rgba(255,255,255,1)] p-3 rounded-lg rounded-tr-none max-w-[30%] ml-auto text-black font-normal leading-5 relative"
								style={{ marginBottom: "10px", wordBreak: "break-word" }}
							>
								<div className="texts">
									<img
										src={img.url}
										alt=""
										className="w-full h-auto cursor-pointer"
										onClick={() => handleImageClick(img.url)}
									/>
									{isImgUploading && <p>Uploading image...</p>}
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.24)] mb-3">
					<div className="leading-5 font-normal text-white">
						Recharge to continue this <br /> Audio call.
					</div>
					<RechargeModal
						walletBalance={walletBalance}
						setWalletBalance={setWalletBalance}
					/>
				</div>

				<div className="flex items-center p-4 mb-4">
					{isRecording ? (
						<div className="flex flex-row gap-3 flex-1 mr-5">
							<button onClick={discardAudio}>
								<Image src="/delete.svg" width={20} height={20} alt="discard" />
							</button>
							<AudioVisualizer audioStream={audioStream!} />
						</div>
					) : (
						<div className="flex flex-1 flex-row px-3 py-2 bg-[rgba(255,255,255,0.12)] rounded-full text-white mr-2">
							<input
								type="text"
								placeholder="Message"
								value={text}
								onChange={(e) => setText(e.target.value)}
								className="px-2 text-sm leading-5 font-normal flex-auto bg-transparent"
							/>
							<div className="flex flex-row gap-4 px-2 ml-auto">
								<label htmlFor="file">
									<Image
										src="/file.svg"
										width={15}
										height={15}
										alt="file"
										className="w-7 h-7"
									/>
								</label>
								<input
									type="file"
									id="file"
									style={{ display: "none" }}
									onChange={handleImg}
								/>
								{!text.trim() && (
									<Image
										src="/cam.svg"
										width={25}
										height={25}
										alt="cam"
										className="w-7 h-7"
									/>
								)}
							</div>
						</div>
					)}
					{text.trim() || img.file || audio.file ? (
						<button onClick={handleSend}>
							<Image
								src="/send.svg"
								width={30}
								height={30}
								alt="Send"
								className="w-10 h-10 bg-[rgba(80,166,92,1)] rounded-full px-1 py-1"
							/>
						</button>
					) : (
						<button onClick={toggleRecording}>
							<Image
								src={isRecording ? "/send.svg" : "/mic.svg"}
								width={30}
								height={30}
								alt="Mic"
								className="w-10 h-10 bg-[rgba(80,166,92,1)] rounded-full px-1 py-1"
							/>
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default ChatInterface;
