import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import ImageModal from "@/lib/imageModal";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { format, isSameDay } from "date-fns";
import CustomAudioPlayer from "@/lib/CustomAudioPlayer";
import usePlatform from "@/hooks/usePlatform";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Chat {
	creatorName: string;
	creatorId: string;
	clientId: string;
	messages: {
		senderId: string;
		text: string;
		createdAt: number;
		img: string;
		audio: string;
		seen: boolean;
		tip: string;
	}[];
}

interface Img {
	file: File | null;
	url: string | null;
}

interface Props {
	chat: Chat;
	img: Img;
	isImgUploading: boolean;
}

const Messages: React.FC<Props> = ({ chat, img, isImgUploading }) => {
	const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
	const [hasScrolled, setHasScrolled] = useState<boolean>(false);
	const [isTyping, setIsTyping] = useState(false); // Track typing status
	const { currentUser, userType } = useCurrentUsersContext();
	const { getDevicePlatform } = usePlatform();

	const textSizeClass = getDevicePlatform() === "iOS" ? "text-base" : "text-sm";

	const endRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (userType) {
			const id = userType === "client" ? chat?.creatorId as string : chat?.clientId as string;

			if (id) {
				const userchatDocRef = doc(db, "userchats", id as string);

				// Listen for updates to the `isTyping` field
				const unsubscribe = onSnapshot(userchatDocRef, (doc) => {
					if (doc.exists()) {
						setIsTyping(doc.data().isTyping || false);
					}
				});

				// Cleanup listener on component unmount
				return () => unsubscribe();
			}
		}
	}, [chat?.clientId]);

	const handleImageClick = (imageUrl: string) => {
		setFullImageUrl(imageUrl);
	};

	const handleCloseModal = () => {
		setFullImageUrl(null);
	};

	// Use useLayoutEffect for immediate DOM interaction on mount
	useLayoutEffect(() => {
		if (!hasScrolled && chat) {
			endRef.current?.scrollIntoView();
			setHasScrolled(true); // Set flag to true after first scroll
		}
	}, [chat]);

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp);
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		return `${hours}:${minutes}`;
	};

	return (
		<div className="flex-1 p-4 ">
			<div className="mb-4 text-left">
				{chat?.messages?.map((message, index) => {
					const isCurrentUserMessage =
						message.senderId === (currentUser?._id as string);
					const isNextMessageDifferentSender =
						index < chat.messages.length - 1 &&
						chat.messages[index + 1].senderId !== message.senderId;

					// Apply different margin if the next message is from a different sender
					const marginBottom = isNextMessageDifferentSender ? "mb-3" : "mb-1";
					// Check if this message starts a new day compared to the previous one
					const showDateSeparator =
						index === 0 ||
						!isSameDay(
							new Date(message.createdAt),
							new Date(chat.messages[index - 1]?.createdAt)
						);

					return (
						<React.Fragment key={message?.createdAt}>
							{showDateSeparator && (
								<div className="flex justify-center ">
									<div className="text-center bg-gray-400 opacity-50 rounded-lg py-1 px-2 my-2">
										<div
											className={`text-white text-xs font-bold ${textSizeClass} opacity-100`}
										>
											{format(new Date(message.createdAt), "d MMM, yyyy")}
										</div>
									</div>
								</div>
							)}

							<div
								className={`${isCurrentUserMessage
									? `bg-[#DCF8C6] p-[5px] max-w-[60%] ${message.tip ? "min-w-[60%] lg:min-w-[35%]" : "min-w-[25%]"} lg:max-w-[35%] w-fit rounded-lg rounded-tr-none ml-auto text-black text-sm relative`
									: `bg-white p-[5px] max-w-[60%] ${message.tip ? "min-w-[60%] lg:min-w-[35%]" : "min-w-[25%]"} lg:max-w-[35%] w-fit rounded-lg rounded-tl-none text-black text-sm leading-5 relative`
									} ${marginBottom}`}
								style={{ wordBreak: "break-word", justifyContent: "center" }}
							>
								{message.img && (
									<div
										className="relative mb-3"
										style={{ display: "inline-block" }}
									>
										<img
											src={message.img}
											alt=""
											className="cursor-pointer rounded-md"
											onClick={() => handleImageClick(message.img)}
											style={{
												// width: "200px",
												// height: "250px",
												objectFit: "cover",
											}} // Define your desired width and height here
										/>
									</div>
								)}

								{fullImageUrl && (
									<ImageModal
										imageUrl={fullImageUrl}
										onClose={handleCloseModal}
									/>
								)}
								{message.audio && (
									<div className="w-full items-center justify-center mb-1">
										<CustomAudioPlayer
											senderId={message.senderId}
											audioSrc={message.audio}
										/>
									</div>
								)}

								{/* Message Text */}
								<div className="flex flex-col items-start mb-[1px]">
									{message.text && (
										<div
											style={{ wordBreak: "break-word", marginBottom: "12px" }}
										>
											{message.text}
										</div>
									)}

									{/* Tip Field */}
									{message.tip && (
										<div
											className="flex-grow w-full items-center rounded-md"
										>
											<div className="flex flex-col items-center justify-center text-black font-bold text-[17px] lg:text-4xl border-l-[#DCF8C6] p-1">
												{`₹ ${message.tip}`}
											</div>
											<div className="flex flex-row gap-1 items-center justify-start text-white text-xs border-l-[#DCF8C6] p-1">
												{/* SVG inserted here */}
												<Image src={"/rupee_logo.svg"} width={1000} height={1000} alt="rupee" className="size-5" />
												<div className="flex flex-col items-start justify-start text-black text-[10px] lg:text-xs">
													<span>
														{`Sent to ${isCurrentUserMessage ? chat.creatorName ?? "Creator" : "You"}`}
													</span>
													<span className="text-[#00FF00] flex items-center">
														Completed
													</span>
												</div>
											</div>
										</div>
									)}

								</div>

								<div
									className={
										message.senderId === (currentUser?._id as string)
											? `rotate-90 absolute right-[-4px] top-[-4px] w-0 h-0 rounded-full border-[8px] border-l-[#DCF8C6] border-r-0 border-solid border-transparent`
											: `rotate-90 absolute left-[-4px] top-[-4px] w-0 h-0 rounded-full border-[8px] border-l-white border-r-0 border-solid border-transparent`
									}
								></div>

								<div
									className={
										message.senderId === (currentUser?._id as string)
											? "w-fit flex justify-end items-center absolute bottom-1 right-1"
											: "w-full flex justify-end items-center absolute bottom-1 right-1"
									}
								>
									<span className="text-[10px] text-gray-700 mr-2">
										{formatTime(message.createdAt)}
									</span>

									{message.seen &&
										message.senderId === (currentUser?._id as string) && (
											<Image
												src={"/seen1.svg"}
												width={13}
												height={13}
												alt="seen"
											/>
										)}
								</div>
							</div>
						</React.Fragment>
					);
				})}
				<div ref={endRef}></div>
				{/* Typing Indicator */}
				{isTyping && (
					<div className="inline-flex items-center space-x-2 p-2 bg-gray-200 rounded-full shadow-md animate-pulse">
						<div className="flex space-x-1">
							<span className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-75"></span>
							<span className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-150"></span>
							<span className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-225"></span>
						</div>
					</div>

				)}
			</div>
		</div>
	);
};

export default Messages;
