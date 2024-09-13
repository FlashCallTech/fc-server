import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ImageModal from "@/lib/imageModal";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { format, isSameDay } from "date-fns";
import ChatInterface from "./ChatInterface";
import CustomAudioPlayer from "@/lib/CustomAudioPlayer";


interface Chat {
	messages: {
		senderId: string;
		text: string;
		createdAt: number;
		img: string;
		audio: string;
		seen: boolean;
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
	const { currentUser } = useCurrentUsersContext();
	const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
	// const endRef = useRef<HTMLDivElement | null>(null);
	const handleImageClick = (imageUrl: string) => {
		setFullImageUrl(imageUrl);
	};

	const handleCloseModal = () => {
		setFullImageUrl(null);
	};

	// useEffect(() => {
	// 	endRef.current?.scrollIntoView({ behavior: "smooth" });
	// }, [chat]);

	const formatDate = (timestamp: number) => {
		return format(new Date(timestamp), "dd MMM yyyy");
	};

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp);
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		return `${hours}:${minutes}`;
	};

	return (
		<div className="flex-1 p-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
			<div className="mb-4 text-left">
				{chat?.messages?.map((message, index) => {
					const isCurrentUserMessage = message.senderId === (currentUser?._id as string);
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
									<div className="text-center bg-gray-400 opacity-50 w-[30%] rounded-lg p-1 my-2  ">
										<div className="text-white font-bold text-xs opacity-100">
											{format(new Date(message.createdAt), "d MMM, yyyy")}
										</div>
									</div>
								</div>
							)}

							<div
								className={`${isCurrentUserMessage
									? "bg-[rgba(255,255,255,1)] p-[5px] max-w-[60%] min-w-[40%] lg:min-w-[10%] lg:max-w-[40%] w-fit rounded-lg rounded-tr-none ml-auto text-black text-sm relative"
									: "bg-green-500 p-[5px] max-w-[60%] min-w-[40%] lg:min-w-[10%] lg:max-w-[40%] w-fit rounded-lg rounded-tl-none text-white font-normal leading-5 relative"
									} ${marginBottom}`}
								style={{ wordBreak: "break-word", justifyContent: "center" }}
							>
								{message.img && (
									<div className="relative mb-2" style={{ display: "inline-block" }}>
										<img
											src={message.img}
											alt=""
											className="cursor-pointer rounded-md"
											onClick={() => handleImageClick(message.img)}
											style={{
												width: "200px",
												height: "250px",
												objectFit: "cover",
											}} // Define your desired width and height here
										/>
									</div>
								)}

								{fullImageUrl && (
									<ImageModal imageUrl={fullImageUrl} onClose={handleCloseModal} />
								)}

								{message.audio && (
									<div className="w-full items-center justify-center">
										<CustomAudioPlayer audioSrc={message.audio} />
									</div>
								)}

								{message.text && (
									<div style={{ wordBreak: "break-word", marginBottom: "12px" }}>
										{message.text}
									</div>
								)}

								<div
									className={
										message.senderId === (currentUser?._id as string)
											? "rotate-90 absolute right-[-4px] top-[-4px] w-0 h-0 rounded-full border-[8px] border-l-white border-r-0 border-solid border-transparent"
											: "rotate-90 absolute left-[-4px] top-[-4px] w-0 h-0 rounded-full border-[8px] border-l-green-500 border-r-0 border-solid border-transparent"
									}
								></div>

								<div
									className={
										message.senderId === (currentUser?._id as string)
											? "w-full flex justify-end items-center absolute bottom-1 right-1"
											: "w-full flex justify-end items-center absolute bottom-1 right-1"
									}
								>
									<span className="text-xs text-gray-500 mr-2">
										{formatTime(message.createdAt)}
									</span>

									{message.seen &&
										message.senderId === (currentUser?._id as string) && (
											<Image src={"/seen1.svg"} width={13} height={13} alt="seen" />
										)}
								</div>
							</div>
						</React.Fragment>
					);
				})}
				{/* <div ref={endRef}></div> */}
			</div>
		</div>
	);
};

export default Messages;