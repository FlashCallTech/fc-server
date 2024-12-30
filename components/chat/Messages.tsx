import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
		replyIndex: number;
		text: string;
		createdAt: number;
		img: string;
		audio: string;
		seen: boolean;
		tip: string;
		global?: boolean;
	}[];
}

interface Img {
	file: File | null;
	url: string | null;
}

interface Props {
	chat: Chat;
	currentUserMessageSent: boolean;
	setReplyIndex: any;
}

const Messages: React.FC<Props> = ({ chat, currentUserMessageSent, setReplyIndex }) => {
	const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
	const [isTyping, setIsTyping] = useState(false); // Track typing status
	const [imagesLoaded, setImagesLoaded] = useState(0); // Track loaded images
	const [isLongPress, setIsLongPress] = useState(false); // Track long press
	const [selectedMessage, setSelectedMessage] = useState<any | null>(null); // Track selected message for reply
	const [highlightedMessage, setHighlightedMessage] = useState<number | null>(null);
	const { currentUser, userType } = useCurrentUsersContext();
	const { getDevicePlatform } = usePlatform();
	const textSizeClass = getDevicePlatform() === "iOS" ? "text-base" : "text-sm";
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const replyBoxRef = useRef<HTMLDivElement | null>(null);
	const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

	// Long press detection
	const longPressTimer = useRef<NodeJS.Timeout | null>(null);

	const handleMouseDown = (message: any) => {
		// Start the long press timer
		longPressTimer.current = setTimeout(() => {
			setIsLongPress(true);
			setSelectedMessage(message);
		}, 500); // Trigger long press after 500ms
	};

	const handleMouseUp = () => {
		// Clear the timer if mouse is released before the long press time
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
		}
	};

	const handleReply = (index: number) => {
		// Handle the reply action here
		// For example, you can set up a text area to let the user reply to the selected message
		setReplyIndex(index);
		setIsLongPress(false);
		setSelectedMessage(null); // Clear the selection after replying
	};

	// Right-click to show reply box
	const handleRightClick = (event: React.MouseEvent, message: any) => {
		event.preventDefault(); // Prevent the default context menu
		setIsLongPress(true);
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
		setIsLongPress(false);
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
		if (imagesLoaded === chat.messages.filter((msg) => msg.img).length) {
			scrollToBottom();
		}
	}, [imagesLoaded]);

	// Handle click outside of the reply box to close it
	const handleClickOutside = (event: MouseEvent) => {
		if (replyBoxRef.current && !replyBoxRef.current.contains(event.target as Node)) {
			// Clear reply box if clicked outside
			setIsLongPress(false);
			setSelectedMessage(null);
		}
	};

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

	console.log(chat.messages);

	return (
		<div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
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

							<div className={`${highlightedMessage === index ? "bg-green-500 opacity-50" : ""}`}>
								<div
									className={`${isCurrentUserMessage
										? `bg-[#DCF8C6] p-[5px] max-w-[60%] ${message.tip ? "min-w-[60%] lg:min-w-[35%]" : "min-w-[25%]"} lg:max-w-[35%] w-fit rounded-lg rounded-tr-none ml-auto text-black text-sm relative`
										: `bg-white p-[5px] max-w-[60%] ${message.tip ? "min-w-[60%] lg:min-w-[35%]" : "min-w-[25%]"} lg:max-w-[35%] w-fit rounded-lg rounded-tl-none text-black text-sm leading-5 relative`
										}  ${marginBottom}`}
									style={{ wordBreak: "break-word", justifyContent: "center" }}
									ref={(el) => { (messageRefs.current[index] = el) }}
									onMouseDown={() => handleMouseDown(message)}
									onMouseUp={handleMouseUp}
									onContextMenu={(e) => handleRightClick(e, message)} // Right-click detection
								>
									{message.replyIndex !== undefined && chat.messages[message.replyIndex] && (
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
													{chat.messages[message.replyIndex].text || "Media"}
												</span>
											</div>
											{chat.messages[message.replyIndex].img && (
												<div className="mt-1">
													<Image
														src={chat.messages[message.replyIndex].img}
														alt="Replied Image"
														width={200}
														height={200}
														className="rounded"
													/>
												</div>
											)}
											{chat.messages[message.replyIndex].audio && (
												<div className="mt-1">
													Audio Message
												</div>
											)}
										</div>
									)}
									{message.img && (
										<div
											className="relative mb-3"
											style={{ display: "inline-block" }}
										>
											<Image
												src={message.img}
												width={1000}
												height={1000}
												alt=""
												className="cursor-pointer rounded-md"
												onClick={() => handleImageClick(message.img)}
												onContextMenu={(e) => handleRightClick(e, message)} // Right-click detection
												onLoad={() => setImagesLoaded((count) => count + 1)} // Increment image load count
												style={{ objectFit: "cover" }}
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
									{isLongPress && selectedMessage === message && (
										<div className="absolute bottom-10 left-0 right-0 p-2 bg-white shadow-md rounded-md flex justify-center items-center" ref={replyBoxRef}>
											<button
												onClick={() => handleReply(index)}
												className=""
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
			</div>
			<div ref={messagesEndRef} />
		</div>
	);
};

export default Messages;
