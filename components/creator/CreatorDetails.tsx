"use client";

import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { getDisplayName, getImageSource, isValidHexColor } from "@/lib/utils";
import { creatorUser, LinkType } from "@/types";
import React, { memo, useEffect, useState } from "react";
import {
	arrayUnion,
	collection,
	doc,
	getDoc,
	onSnapshot,
	setDoc,
	updateDoc,
	writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import CallingOptions from "../calls/CallingOptions";
import UserReviews from "../creator/UserReviews";
import Favorites from "../shared/Favorites";
import ShareButton from "../shared/ShareButton";
import Link from "next/link";
import Image from "next/image";
import { trackPixelEvent } from "@/lib/analytics/pixel";
import ClientSideUserAvailability from "../availabilityServices/ClientSideUserAvailability";
import ClientSideDiscountSheet from "../discountServices/ClientSideDiscountSheet";
import { useSelectedServiceContext } from "@/lib/context/SelectedServiceContext";
import AuthenticationSheet from "../shared/AuthenticationSheet";
import DraggableWindow from "../chat/DraggableWindow";
import FloatingChat from "../chat/FloatingChat";
import GetRandomImage from "@/utils/GetRandomImage";

const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	const handleResize = () => {
		setIsMobile(window.innerWidth < 1280);
	};

	useEffect(() => {
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isMobile;
};

const CreatorDetails = memo(({ creator }: { creator: creatorUser }) => {
	const { clientUser, userType, setCurrentTheme, updateCreatorURL, region } =
		useCurrentUsersContext();
	const { selectedServices } = useSelectedServiceContext();
	const [status, setStatus] = useState<string>("Online");
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [chatId, setChatId] = useState<string | null>();
	const [offerApplied, setOfferApplied] = useState(
		selectedServices ? selectedServices.length > 0 : false
	);
	const [isEligible, setIsEligible] = useState(true);
	const [loading, setLoading] = useState(false);
	const pathname = usePathname();
	const creatorURL = pathname || localStorage.getItem("creatorURL");

	const isMobile = useScreenSize();

	const fullName = getDisplayName(creator);

	const imageSrc = getImageSource(creator);

	const router = useRouter();

	const themeColor = isValidHexColor(creator?.themeSelected)
		? creator?.themeSelected
		: "#90EE90";

	useEffect(() => {
		localStorage.setItem("currentCreator", JSON.stringify(creator));
		if (userType !== "creator" && creator?.username) {
			localStorage.setItem("creatorURL", `/${creator?.username}`);
		}

		trackPixelEvent("Creator Page View", {
			creatorId: creator._id,
			creatorName: fullName,
			creatorUsername: creator.username,
		});

		setOfferApplied(selectedServices ? selectedServices.length > 0 : false);

		setCurrentTheme(themeColor);
		updateCreatorURL(creatorURL);
	}, []);

	useEffect(() => {
		if (!creator || !creator._id || !creator.phone) return;

		const creatorRef = doc(db, "services", creator._id);
		const statusDocRef = doc(db, "userStatus", creator.phone);

		let unsubscribeStatus: any;

		const unsubscribeServices = onSnapshot(creatorRef, (doc) => {
			const data = doc.data();

			if (data) {
				const services = data.services;
				const hasActiveService =
					services?.videoCall || services?.audioCall || services?.chat;

				if (unsubscribeStatus) {
					unsubscribeStatus();
				}

				unsubscribeStatus = onSnapshot(statusDocRef, (statusDoc) => {
					const statusData = statusDoc.data();
					if (statusData) {
						let newStatus = "Offline";

						if (statusData.loginStatus) {
							if (statusData.status === "Busy") {
								newStatus = "Busy";
							} else if (statusData.status === "Online" && hasActiveService) {
								newStatus = "Online";
							} else {
								newStatus = "Offline";
							}
						} else {
							newStatus = "Offline";
						}

						if (status !== newStatus) {
							setStatus(newStatus);
						}
					}
				});
			}
		});

		return () => {
			unsubscribeServices();
			if (unsubscribeStatus) {
				unsubscribeStatus();
			}
		};
	}, [creator?._id, creator?.phone, status]);

	const toggleReadMore = () => {
		setIsExpanded(!isExpanded);
	};

	const getClampedText = (text: string) => {
		if (!text) return;
		let charLen = 100;
		if (text?.length > charLen && !isExpanded) {
			return text.slice(0, charLen) + "... ";
		}
		return text;
	};

	const maskPhoneNumber = (phoneNumber: string) => {
		// Remove the '+91' prefix
		if (phoneNumber) {
			let cleanedNumber = phoneNumber.replace("+91", "");

			// Mask the next 5 digits, leaving the first 2 digits unmasked
			let maskedNumber =
				cleanedNumber.substring(0, 2) + "*****" + cleanedNumber.substring(7);

			return maskedNumber;
		}
	};

	const getClientId = (): string => {
		let clientId = localStorage.getItem("temporaryClientId");
		if (!clientId) {
			clientId = crypto.randomUUID();
			localStorage.setItem("temporaryClientId", clientId);
		}
		return clientId;
	};

	const getUniqueGuestName = () => {
		return `Guest${Date.now().toString().slice(-6)}`; // Last 6 digits of timestamp
	};

	const handleHelp = async () => {
		setLoading(true);
		if (isModalOpen) return;

		if (!clientUser) {
			!isMobile && setIsModalOpen(true);
			const clientId = getClientId();

			try {
				const chatRef = collection(db, "chats");
				const creatorChatsDocRef = doc(db, "userHelpChats", creator?._id);
				const userChatsDocRef = doc(db, "userHelpChats", clientId as string);

				const [userChatsDocSnapshot, creatorChatsDocSnapshot] =
					await Promise.all([
						getDoc(userChatsDocRef),
						getDoc(creatorChatsDocRef),
					]);

				let chatId = null;
				let matchedIndex = -1;

				if (userChatsDocSnapshot.exists() && creatorChatsDocSnapshot.exists()) {
					const userChatsData = userChatsDocSnapshot.data();
					const creatorChatsData = creatorChatsDocSnapshot.data();

					if (
						userChatsData.chats &&
						creatorChatsData &&
						Array.isArray(userChatsData.chats) &&
						Array.isArray(creatorChatsData.chats)
					) {
						matchedIndex = userChatsData.chats.findIndex(
							(el: any) => el.receiverId === creator._id
						);

						if (matchedIndex !== -1) {
							userChatsData.chats[matchedIndex].creatorImg = creator.photo;
							userChatsData.chats[matchedIndex].creatorName =
								creator.fullName || maskPhoneNumber(creator.phone as string);
							await updateDoc(userChatsDocRef, {
								chats: userChatsData.chats,
							});
						}
					}

					const userChat = userChatsData.chats?.find(
						(chat: any) => chat.receiverId === creator?._id
					);
					const creatorChat = creatorChatsData.chats?.find(
						(chat: any) => chat.receiverId === clientId
					);

					if (
						userChat &&
						creatorChat &&
						userChat.chatId === creatorChat.chatId
					) {
						chatId = userChat.chatId;
					}
				}

				if (!userChatsDocSnapshot.exists()) {
					await setDoc(userChatsDocSnapshot.ref, {
						chats: [],
					});
				}

				if (!creatorChatsDocSnapshot.exists()) {
					await setDoc(creatorChatsDocSnapshot.ref, {
						chats: [],
					});
				}

				const chatData: any = {
					creatorImg: creator.photo,
				};

				if (!chatId) {
					chatId = doc(chatRef).id;
					(chatData.messages = []),
						(chatData.creatorId = creator?._id),
						(chatData.clientId = clientId),
						(chatData.clientImg = GetRandomImage()),
						(chatData.global = region === "India" ? false : true),
						(chatData.createdAt = Date.now()),
						(chatData.chatId = chatId);
					chatData.clientName = getUniqueGuestName();

					const creatorChatUpdate = updateDoc(creatorChatsDocRef, {
						chats: arrayUnion({
							chatId: chatId,
							clientName: chatData.clientName,
							clientImg: GetRandomImage(),
							receiverId: clientId,
							updatedAt: Date.now(),
						}),
					});

					const clientChatUpdate = updateDoc(userChatsDocRef, {
						chats: arrayUnion({
							chatId: chatId,
							creatorName:
								creator.fullName || maskPhoneNumber(creator.phone as string),
							creatorImg: creator.photo,
							receiverId: creator._id,
							updatedAt: Date.now(),
						}),
					});
					await Promise.all([creatorChatUpdate, clientChatUpdate]);
				}

				if (creator.fullName) {
					chatData.creatorName = creator.fullName;
				} else if (creator.phone) {
					chatData.creatorName = maskPhoneNumber(creator.phone as string);
				}
				if (creator.phone) {
					chatData.creatorPhone = creator.phone;
				}

				setChatId(chatId);

				await setDoc(doc(db, "helpChat", chatId), chatData, { merge: true });

				!loading && isMobile && router.push(`/helpChat/${chatId}`);
			} catch (error) {
				console.error("Error handling help chat:", error);
				setIsModalOpen(false);
				// Optionally, add error notification or additional error handling here.
			} finally {
				setLoading(false);
			}

			return;
		}

		try {
			!isMobile && setIsModalOpen(true);
			const chatRef = collection(db, "chats");
			const creatorChatsDocRef = doc(db, "userHelpChats", creator?._id);
			const userChatsDocRef = doc(
				db,
				"userHelpChats",
				clientUser?._id as string
			);

			const [userChatsDocSnapshot, creatorChatsDocSnapshot] = await Promise.all(
				[getDoc(userChatsDocRef), getDoc(creatorChatsDocRef)]
			);

			let chatId = null;
			let matchedIndex = -1;
			let matchedIndexCreator = -1;

			if (userChatsDocSnapshot.exists() && creatorChatsDocSnapshot.exists()) {
				const userChatsData = userChatsDocSnapshot.data();
				const creatorChatsData = creatorChatsDocSnapshot.data();

				if (
					Array.isArray(userChatsData.chats) &&
					Array.isArray(creatorChatsData.chats)
				) {
					const batch = writeBatch(db);

					// Update userChatsDoc if a matching element is found
					matchedIndex = userChatsData.chats.findIndex(
						(el: any) => el.receiverId === creator._id
					);
					if (matchedIndex !== -1) {
						userChatsData.chats[matchedIndex].creatorImg = creator.photo;
						userChatsData.chats[matchedIndex].creatorName =
							creator.fullName || maskPhoneNumber(creator.phone as string);
						batch.update(userChatsDocRef, { chats: userChatsData.chats });
					}

					// Update creatorChatsDoc if a matching element is found
					matchedIndexCreator = creatorChatsData.chats.findIndex(
						(el: any) => el.receiverId === clientUser._id
					);
					if (matchedIndexCreator !== -1) {
						creatorChatsData.chats[matchedIndexCreator].clientImg =
							clientUser.photo || GetRandomImage();
						creatorChatsData.chats[matchedIndexCreator].clientName =
							clientUser.fullName ||
							maskPhoneNumber(clientUser.phone as string);
						batch.update(creatorChatsDocRef, {
							chats: creatorChatsData.chats,
						});
					}

					// Commit both updates in one batch
					await batch.commit();
				}

				const userChat = userChatsData.chats?.find(
					(chat: any) => chat.receiverId === creator?._id
				);
				const creatorChat = creatorChatsData.chats?.find(
					(chat: any) => chat.receiverId === clientUser?._id
				);

				if (userChat && creatorChat && userChat.chatId === creatorChat.chatId) {
					chatId = userChat.chatId;
				}
			}

			if (!userChatsDocSnapshot.exists()) {
				await setDoc(userChatsDocSnapshot.ref, {
					chats: [],
				});
			}

			if (!creatorChatsDocSnapshot.exists()) {
				await setDoc(creatorChatsDocSnapshot.ref, {
					chats: [],
				});
			}

			const chatData: any = {
				creatorImg: creator.photo,
				clientImg: clientUser?.photo || GetRandomImage(),
				clientId: clientUser?._id,
			};

			if (!chatId) {
				chatId = doc(chatRef).id;
				(chatData.messages = []),
					(chatData.creatorId = creator?._id),
					(chatData.global = clientUser?.global ?? false),
					(chatData.createdAt = Date.now()),
					(chatData.chatId = chatId);
				const creatorChatUpdate = updateDoc(creatorChatsDocRef, {
					chats: arrayUnion({
						chatId: chatId,
						clientName:
							clientUser.fullName ||
							maskPhoneNumber(clientUser.phone as string),
						clientImg: clientUser.photo || GetRandomImage(),
						receiverId: clientUser._id,
						updatedAt: Date.now(),
					}),
				});

				const clientChatUpdate = updateDoc(userChatsDocRef, {
					chats: arrayUnion({
						chatId: chatId,
						creatorName:
							creator.fullName || maskPhoneNumber(creator.phone as string),
						creatorImg: creator.photo,
						receiverId: creator._id,
						updatedAt: Date.now(),
					}),
				});
				await Promise.all([creatorChatUpdate, clientChatUpdate]);
			}

			if (creator.fullName) {
				chatData.creatorName = creator.fullName;
			} else if (creator.phone) {
				chatData.creatorName = maskPhoneNumber(creator.phone as string);
			}
			if (creator.phone) {
				chatData.creatorPhone = creator.phone;
			}

			if (clientUser?.phone) {
				chatData.clientPhone = clientUser.phone;
			}

			if (clientUser?.email) {
				chatData.clientEmail = clientUser.email;
			}

			if (clientUser?.fullName) {
				chatData.clientName = clientUser.fullName;
			} else if (clientUser?.phone) {
				chatData.clientName = maskPhoneNumber(clientUser.phone as string);
			}

			setChatId(chatId);

			await setDoc(doc(db, "helpChat", chatId), chatData, { merge: true });

			!loading && isMobile && router.push(`/helpChat/${chatId}`);
		} catch (error) {
			console.error("Error handling help chat:", error);
			// Optionally, add error notification or additional error handling here.
		} finally {
			setLoading(false);
		}
	};

	const closeModal = () => {
		setChatId(null);
		setIsModalOpen(false);
	};

	const renderCreatorBio = () => {
		return (
			<>
				{/* About Creator */}
				{creator?.bio && creator.bio !== "Enter your bio here" ? (
					<>
						<section className="w-full flex flex-col items-start justify-start gap-2">
							{/* Heading */}
							<h2 className="text-base font-bold">About Me</h2>
							{/* Content */}
							<p
								className={`text-sm text-start block ${
									isExpanded ? "whitespace-pre-wrap" : "line-clamp-3"
								} ${
									isExpanded
										? "overflow-y-scroll no-scrollbar"
										: "overflow-hidden"
								}`}
							>
								{getClampedText(creator?.bio)}
								{!isExpanded && creator.bio.length > 100 && (
									<span className="font-semibold">
										<button
											onClick={toggleReadMore}
											className="hoverScaleDownEffect"
										>
											view more
										</button>
									</span>
								)}
							</p>
							{isExpanded && (
								<button
									onClick={toggleReadMore}
									className="font-semibold hoverScaleDownEffect"
								>
									view less
								</button>
							)}
						</section>
						{/* Divider */}
						<div className="w-full border border-white" />
					</>
				) : (
					<div className="pb-2" />
				)}
			</>
		);
	};

	return (
		// Wrapper Section
		<div className="xl:relative size-full md:mx-auto md:pt-8 flex flex-col xl:flex-row xl:gap-14 items-start justify-center max-xl:overflow-y-scroll no-scrollbar">
			<section className="xl:sticky xl:top-[100px] size-full h-fit xl:max-w-[400px] 3xl:max-w-[500px] flex flex-col items-center justify-center gap-4">
				{/* Creator Details */}
				<section
					className={`size-full px-4 flex flex-col gap-4 items-center justify-center p-5 xl:px-10 xl:rounded-[16px] overflow-hidden`}
					style={{ backgroundColor: themeColor }}
				>
					{/* Creator Info */}
					<section className="w-full relative h-fit flex flex-col items-center justify-center gap-2.5">
						{/* 1. Creator Status and Image */}
						<section className="relative flex item-center justify-center rounded-full min-h-[116px] min-w-[116px] border-[4px] drop-shadow-lg border-white">
							<Image
								src={imageSrc}
								alt={creator?.firstName || creator?.username}
								width={300}
								height={300}
								quality={75}
								className="w-full h-full absolute left-0 top-0 object-cover rounded-full bg-gray-300"
								placeholder="blur"
								blurDataURL="/icons/blurryPlaceholder.png"
								priority
							/>

							{/* Creator Status */}
							<section className="w-fit absolute z-20 right-3 -bottom-1 flex items-center justify-center">
								<div
									className={`flex items-center justify-center text-white  border-[3px] border-white rounded-full`}
								>
									<div
										className={`
									${
										status === "Online"
											? "bg-[#22C55E]"
											: status === "Offline"
											? "bg-red-600"
											: status === "Busy"
											? "bg-orange-600"
											: "bg-red-600"
									} 

									rounded-full size-[15px]
									`}
									/>
								</div>
							</section>
						</section>
						<button
							onClick={handleHelp}
							disabled={loading}
							className={`fixed bottom-4 ${
								isMobile ? "right-4" : "left-14"
							} pr-2 border items-center text-[11px] md:text-sm font-bold z-40 gap-1 md:gap-2 text-black bg-gray-100 hover:bg-gray-200 p-1 rounded-full shadow-lg hoverScaleDownEffect transition-all flex`}
						>
							{loading ? (
								<Image
									src="/icons/loading-circle.svg"
									alt="Loading..."
									width={24}
									height={24}
									priority
								/>
							) : (
								<Image
									src={creator.photo}
									width={28}
									height={28}
									alt="Creator's photo"
									className="size-6 md:size-7 object-cover rounded-full"
								/>
							)}
							<span>Contact Us</span>
						</button>
						{/* 2. Creator Info */}
						<section className="size-full flex flex-col items-center justify-center overflow-hidden">
							<p className="font-semibold text-2xl max-w-[92%] text-ellipsis whitespace-nowrap overflow-hidden capitalize">
								{fullName}
							</p>
							<span className="text-sm">
								{creator?.profession
									? creator?.profession
									: "Please update your profession details"}
							</span>
						</section>
					</section>

					{/* Action Buttons */}
					<section className={`flex items-center w-full gap-4 mt-2`}>
						{/* Favorite Button */}
						{userType !== "creator" && (
							<Favorites creator={creator} userId={clientUser?._id as string} />
						)}
						{/* Share Button */}
						<ShareButton
							username={
								creator?.username
									? (creator?.username as string)
									: (creator?.phone as string)
							}
							profession={creator?.profession ?? "Astrologer"}
							gender={creator?.gender ? creator?.gender.toLowerCase() : ""}
							firstName={creator?.firstName}
							lastName={creator?.lastName}
						/>
					</section>
				</section>

				{/* Creator Bio */}
				<section className="hidden xl:block size-full">
					{renderCreatorBio()}
				</section>
			</section>

			{/* About, Services and Reviews */}
			<section className="size-full h-fit rounded-t-[12px] rounded-b-[12px] flex flex-col items-start justify-between p-4 xl:pt-0 xl:px-0 gap-2.5 bg-white overflow-y-scroll no-scrollbar">
				{/* Creator Bio */}
				<section className="xl:hidden size-full">{renderCreatorBio()}</section>
				{/* Discounts */}
				{!offerApplied && isEligible && (
					<div className="w-full flex-col items-start justify-center gap-2.5 p-4 bg-[#DCFCE7] rounded-xl">
						<div className="flex items-center gap-2.5 text-[#166534] text-sm">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="size-4"
							>
								<path
									fillRule="evenodd"
									d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z"
									clipRule="evenodd"
								/>
							</svg>

							<span>You might be eligible for discount</span>
						</div>

						<button
							className="font-semibold border-b border-[#166534] text-[#166534] text-sm leading-3"
							onClick={() => setIsDiscountModalOpen(true)}
						>
							{offerApplied ? "Offers Applied" : "Claim Now"}
						</button>

						<ClientSideDiscountSheet
							creatorId={creator._id || ""}
							creatorName={getDisplayName(creator)}
							theme={creator.themeSelected}
							isDiscountModalOpen={isDiscountModalOpen}
							setIsDiscountModalOpen={setIsDiscountModalOpen}
							offerApplied={offerApplied}
							setOfferApplied={setOfferApplied}
							setIsAuthSheetOpen={setIsAuthSheetOpen}
							isEligible={isEligible}
							setIsEligible={setIsEligible}
						/>
					</div>
				)}

				{/* Call Buttons */}

				<h2 className="text-base font-bold mt-2">Services</h2>

				{/* Call Scheduling */}

				<ClientSideUserAvailability creator={creator} />

				<div />

				<CallingOptions creator={creator} />

				{/* Creator Links */}

				{creator?.links && creator?.links?.length > 0 && (
					<>
						<h2 className="text-base font-bold mt-2">External Links</h2>
						<section className="grid grid-cols-1 gap-4 w-full items-center">
							{creator?.links
								?.filter((link: LinkType) => link.isActive)
								?.map((link: LinkType, index: number) => (
									<Link
										href={link.url}
										target="_black"
										className="grid grid-cols-3 px-4 border border-gray-300 rounded-[24px] h-[52px] justify-between font-semibold items-center text-center w-full hoverScaleDownEffect cursor-pointer capitalize"
										key={index + link.title}
										title={link.title}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="size-5"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
											/>
										</svg>
										<p className="text-ellipsis whitespace-nowrap overflow-hidden">
											{link.title}
										</p>

										<p />
									</Link>
								))}
						</section>
					</>
				)}
				{/* User Reviews */}
				<section className="grid grid-cols-1 w-full items-start justify-start gap-2 pt-4">
					{/* Content */}
					<UserReviews
						theme={creator?.themeSelected}
						creatorUsername={fullName}
						creatorId={creator?._id}
					/>
				</section>
			</section>

			{isAuthSheetOpen && (
				<AuthenticationSheet
					isOpen={isAuthSheetOpen}
					onOpenChange={setIsAuthSheetOpen}
				/>
			)}
			{isModalOpen && (
				<DraggableWindow onClose={closeModal} creator={creator}>
					<FloatingChat
						setIsAuthSheetOpen={setIsAuthSheetOpen}
						initiating={loading}
						chatId={chatId}
					/>
				</DraggableWindow>
			)}
		</div>
	);
});

CreatorDetails.displayName = "CreatorDetails";
export default CreatorDetails;
