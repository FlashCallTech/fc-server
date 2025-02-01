import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import ImageModal from "@/lib/imageModal";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { format, isSameDay } from "date-fns";
import CustomAudioPlayer from "@/lib/CustomAudioPlayer";
import usePlatform from "@/hooks/usePlatform";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Chat {
	chatId: string;
	creatorName: string;
	creatorId: string;
	clientId: string;
}

interface Messages {
	senderId: string;
	replyIndex: number;
	text: string;
	createdAt: number;
	img: string;
	audio: string;
	seen: boolean;
	tip: string;
	global?: boolean;
}

interface Img {
	file: File | null;
	url: string | null;
}

interface Props {
	chat: Chat;
	messages: Messages[];
	currentUserMessageSent: boolean;
	setReplyIndex: any;
	setText: any;
}

const Messages: React.FC<Props> = ({ chat, messages, currentUserMessageSent, setReplyIndex, setText }) => {
	const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
	const [isTyping, setIsTyping] = useState(false); // Track typing status
	const [imagesLoaded, setImagesLoaded] = useState(0); // Track loaded images
	const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({});
	const [selectedMessage, setSelectedMessage] = useState<any | null>(null); // Track selected message for reply
	const [highlightedMessage, setHighlightedMessage] = useState<number | null>(null);
	const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
	const [swipeEndX, setSwipeEndX] = useState<number | null>(null);
	const [slidingIndex, setSlidingIndex] = useState<number | null>(null);
	const { currentUser, userType } = useCurrentUsersContext();
	const { getDevicePlatform } = usePlatform();
	const textSizeClass = getDevicePlatform() === "iOS" ? "text-base" : "text-sm";
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const replyBoxRef = useRef<HTMLDivElement | null>(null);
	const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});


	const handleImageLoad = (index: number) => {
		setLoadedImages((prev) => ({ ...prev, [index]: true })); // Track per-image load
		setImagesLoaded((count) => count + 1); // Increment global counter
	};

	const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, index: number) => {
		setSwipeStartX(e.touches[0].clientX);
		setSwipeEndX(null);
	};

	const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
		setSwipeEndX(e.touches[0].clientX);
	};

	const handleTouchEnd = (index: number) => {
		if (swipeStartX !== null && swipeEndX !== null) {
			const distance = swipeEndX - swipeStartX;
			if (distance > 50) {
				setSlidingIndex(index); // Set the sliding index for animation
				// Trigger reply if swipe distance exceeds the threshold
				handleReply(index);
				setTimeout(() => {
					handleReply(index);
					setSlidingIndex(null); // Reset sliding state after animation
				}, 300); // Animation duration
			}
		}
		setSwipeStartX(null);
		setSwipeEndX(null);
	};


	const handleReply = (index: number) => {
		// Handle the reply action here
		// For example, you can set up a text area to let the user reply to the selected message
		setReplyIndex(index);
		setSelectedMessage(null); // Clear the selection after replying
	};

	// Right-click to show reply box
	const handleRightClick = (event: React.MouseEvent, message: any) => {
		event.preventDefault(); // Prevent the default context menu
		setSelectedMessage(message); // Set the message to reply to
	};

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
		setSelectedMessage(null);
		setFullImageUrl(imageUrl);
	};

	const handleCloseModal = () => {
		setFullImageUrl(null);
	};

	// Function to scroll to the bottom
	const scrollToBottom = useCallback(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView();
		}
	}, []);

	// Scroll to the bottom on initial render or when messages change
	useEffect(() => {
		scrollToBottom();
	}, []);

	// Scroll to the bottom when `currentUserMessageSent` changes
	useEffect(() => {
		if (currentUserMessageSent) {
			scrollToBottom();
		}
	}, [currentUserMessageSent]);

	// Scroll to the bottom when images finish loading
	useEffect(() => {
		if (imagesLoaded === messages.filter((msg) => msg.img).length) {
			scrollToBottom();
		}
	}, [imagesLoaded]);

	// Handle click outside of the reply box to close it
	const handleClickOutside = (event: MouseEvent) => {
		if (replyBoxRef.current && !replyBoxRef.current.contains(event.target as Node)) {
			// Clear reply box if clicked outside
			setSelectedMessage(null);
		}
	};

	const handleUnsend = async (index: number) => {
		try {
			const updatedMessages = messages.filter((_, i) => i !== index);
			await updateDoc(doc(db, "chats", chat.chatId), { messages: updatedMessages });
		} catch (error) {
			console.log(error);
		}
	}

	const handleEdit = async (index: number) => {
		setText(selectedMessage.text);
	}

	// Attach the click outside listener on component mount and clean up on unmount
	useEffect(() => {
		document.addEventListener("click", handleClickOutside);

		// Cleanup the listener when the component unmounts
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, []);

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp);
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		return `${hours}:${minutes}`;
	};

	return (
		<div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
			<div className="mb-4 text-left">
				{messages?.map((message, index) => {
					const isCurrentUserMessage =
						message.senderId === (currentUser?._id as string);
					const isNextMessageDifferentSender =
						index < messages.length - 1 &&
						messages[index + 1].senderId !== message.senderId;

					// Apply different margin if the next message is from a different sender
					const marginBottom = isNextMessageDifferentSender ? "mb-3" : "mb-1";
					// Check if this message starts a new day compared to the previous one
					const showDateSeparator =
						index === 0 ||
						!isSameDay(
							new Date(message.createdAt),
							new Date(messages[index - 1]?.createdAt)
						);

					const isSliding = slidingIndex === index;

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

							<div className={`${highlightedMessage === index ? "bg-green-500 opacity-50" : ""}`}>
								<div
									className={`${isCurrentUserMessage
										? `bg-[#DCF8C6] p-[5px] max-w-[60%] ${message.tip ? "min-w-[60%] lg:min-w-[35%]" : "min-w-[25%]"} lg:max-w-[35%] w-fit rounded-lg rounded-tr-none ml-auto text-black text-sm relative`
										: `bg-white p-[5px] max-w-[60%] ${message.tip ? "min-w-[60%] lg:min-w-[35%]" : "min-w-[25%]"} lg:max-w-[35%] w-fit rounded-lg rounded-tl-none text-black text-sm leading-5 relative`
										} ${marginBottom} ${isSliding ? "sliding" : ""} ${marginBottom}`}
									style={{
										wordBreak: "break-word",
										justifyContent: "center",
										transform: isSliding ? "translateX(50px)" : "translateX(0)",
										transition: "transform 0.3s ease-in-out",
									}}
									ref={(el) => {
										messageRefs.current[index] = el;
									}}
									onTouchStart={(e) => handleTouchStart(e, index)}
									onTouchMove={handleTouchMove}
									onTouchEnd={() => handleTouchEnd(index)}
									onContextMenu={(e) => handleRightClick(e, message)}
								>

									{message.replyIndex !== undefined && messages[message.replyIndex] && (
										<div
											className={`p-2 mb-2 border-l-4 ${isCurrentUserMessage ? "border-green-500" : "border-blue-500"
												} bg-gray-100 rounded cursor-pointer`} // Add cursor-pointer for clarity
											onClick={() => {
												const targetMessage = messageRefs.current[message.replyIndex]; // Access the ref for the message
												if (targetMessage) {
													targetMessage.scrollIntoView({
														behavior: "smooth", // Smooth scrolling
														block: "center", // Center the message in the viewport
													});
												}
												// Set highlighted message index
												setHighlightedMessage(message.replyIndex);

												// Reset the highlighted message after 1 second
												setTimeout(() => {
													setHighlightedMessage(null);
												}, 1000);
											}}
										>
											<div className="truncate text-sm text-gray-600">
												<span className="font-semibold">
													{messages[message.replyIndex].text || "Media"}
												</span>
											</div>
											{messages[message.replyIndex].img && (
												<div className="mt-1">
													<Image
														src={messages[message.replyIndex].img}
														alt="Replied Image"
														width={200}
														height={200}
														className="rounded"
													/>
												</div>
											)}
											{messages[message.replyIndex].audio && (
												<div className="mt-1">
													Audio Message
												</div>
											)}
										</div>
									)}
									{message.img && (
										<div className="relative mb-3" style={{ display: "inline-block" }}>
											{!loadedImages[index] && ( // Show loader only if image isn't loaded
												<div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-md">
													<span className="text-gray-500">Loading...</span>
												</div>
											)}

											<Image
												src={message.img}
												width={1000}
												height={1000}
												alt=""
												className="cursor-pointer rounded-md"
												onClick={() => handleImageClick(message.img)}
												onContextMenu={(e) => handleRightClick(e, message)}
												onLoad={() => handleImageLoad(index)}
												style={{ objectFit: "cover", opacity: loadedImages[index] ? 1 : 0 }}
											/>
										</div>
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
													{`${message?.global ? "$" : "₹"} ${message.tip}`}
												</div>
												<div className="flex flex-row gap-1 items-center justify-start text-white text-xs border-l-[#DCF8C6] p-1">
													{/* SVG inserted here */}
													<Image src={`${message.global ? "/dollar_icon.svg" : "/rupee_logo.svg"}`} width={1000} height={1000} alt="currency" className="size-5" />
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

									{/* Reply Box */}
									{selectedMessage === message && (
										<div className="absolute flex-col gap-2 bottom-10 left-0 right-0 p-2 bg-white shadow-md rounded-md flex justify-center items-center" ref={replyBoxRef}>
											<button
												onClick={() => handleReply(index)}
												className="w-full hoverScaleDownEffect"
											>
												Reply
											</button>
										</div>

									)}

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
							</div>
						</React.Fragment>
					);
				})}
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
				{fullImageUrl && (
					<ImageModal
						imageUrl={fullImageUrl}
						onClose={handleCloseModal}
					/>
				)}
			</div>
			<div ref={messagesEndRef} />
		</div>
	);
};

export default Messages;
