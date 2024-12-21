"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import axios from "axios";
import { useToast } from "../ui/use-toast";
import {
	backendBaseUrl,
	calculateTotalEarnings,
	getDisplayName,
	getImageSource,
	updateFirestoreCallServices,
} from "@/lib/utils";
import ServicesCheckbox from "../shared/ServicesCheckbox";
import CopyToClipboard from "../shared/CopyToClipboard";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import ContentLoading from "../shared/ContentLoading";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/mixpanel";
import usePlatform from "@/hooks/usePlatform";
import useServices from "@/hooks/useServices";
import ProfileDialog from "../creator/ProfileDialog";
import PriceEditModal from "../creator/PriceEditModal";

const CreatorHome = () => {
	const { creatorUser, refreshCurrentUser } = useCurrentUsersContext();
	const { isInitialized } = useWalletBalanceContext();
	const { services, handleToggle, setServices } = useServices();
	const { getDevicePlatform } = usePlatform();
	const { toast } = useToast();
	const [showRestrictedWarning, setShowRestrictedWarning] = useState(
		services.isRestricted ?? false
	);
	const [loading, setLoading] = useState(true);

	const [creatorLink, setCreatorLink] = useState<string | null>(null);
	const [isPriceEditOpen, setIsPriceEditOpen] = useState(false);
	const [prices, setPrices] = useState({
		videoCall: "0",
		audioCall: "0",
		chat: "0",
	});
	const [globalPrices, setGlobalPrices] = useState({
		videoCall: "0",
		audioCall: "0",
		chat: "0",
	});

	useEffect(() => {
		if (creatorUser) {
			setPrices({
				videoCall: creatorUser.videoRate,
				audioCall: creatorUser.audioRate,
				chat: creatorUser.chatRate,
			});
			setGlobalPrices({
				videoCall: creatorUser.globalVideoRate,
				audioCall: creatorUser.globalAudioRate,
				chat: creatorUser.globalChatRate,
			});
		}
	}, [creatorUser]);

	const fetchCreatorLink = async () => {
		try {
			const response = await axios.get(
				`${backendBaseUrl}/creator/creatorLink/${creatorUser?._id}`
			);

			return response.data.creatorLink;
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error fetching creator link:", error);
			return null;
		}
	};

	useEffect(() => {
		if (creatorUser) {
			const fetchLink = async () => {
				const link = await fetchCreatorLink();

				setCreatorLink(link || `https://flashcall.me/${creatorUser.username}`);
			};
			fetchLink();
		}
	}, [creatorUser?._id]);

	useEffect(() => {
		setTimeout(() => {
			setLoading(false);
		}, 1000);
	}, []);

	const theme = creatorUser?.themeSelected;

	const handleSavePrices = async (
		global: boolean,
		newPrices: {
			videoCall: string;
			audioCall: string;
			chat: string;
		}
	) => {
		try {
			if (global) {
				await axios.put(
					`${backendBaseUrl}/creator/updateUser/${creatorUser?._id}`,
					{
						globalVideoRate: newPrices.videoCall,
						globalAudioRate: newPrices.audioCall,
						globalChatRate: newPrices.chat,
					}
				);
				setGlobalPrices(newPrices);
				updateFirestoreCallServices(
					creatorUser,
					{
						myServices: services.myServices,
						videoCall: services.videoCall,
						audioCall: services.audioCall,
						chat: services.chat,
					},
					newPrices,
					undefined,
					global
				);
			} else {
				await axios.put(
					`${backendBaseUrl}/creator/updateUser/${creatorUser?._id}`,
					{
						videoRate: newPrices.videoCall,
						audioRate: newPrices.audioCall,
						chatRate: newPrices.chat,
					}
				);
				setPrices(newPrices);
				updateFirestoreCallServices(
					creatorUser,
					{
						myServices: services.myServices,
						videoCall: services.videoCall,
						audioCall: services.audioCall,
						chat: services.chat,
					},
					newPrices
				);
			}
			if (newPrices.audioCall !== prices.audioCall) {
				trackEvent("Creator_Audio_Price_Updated", {
					Creator_ID: creatorUser?._id,
					Creator_First_Seen: creatorUser?.createdAt?.toString().split("T")[0],
					Platform: getDevicePlatform(),
					Price: newPrices.audioCall,
				});
			}
			if (newPrices.videoCall !== prices.videoCall) {
				trackEvent("Creator_Video_Price_Updated", {
					Creator_ID: creatorUser?._id,
					Creator_First_Seen: creatorUser?.createdAt?.toString().split("T")[0],
					Platform: getDevicePlatform(),
					Price: newPrices.videoCall,
				});
			}
			if (newPrices.chat !== prices.chat) {
				trackEvent("Creator_Chat_Price_Updated", {
					Creator_ID: creatorUser?._id,
					Creator_First_Seen: creatorUser?.createdAt?.toString().split("T")[0],
					Platform: getDevicePlatform(),
					Price: newPrices.chat,
				});
			}
			toast({
				variant: "destructive",
				title: "Rates Updated",
				description: "Values are updated...",
				toastStatus: "positive",
			});
		} catch (error) {
			Sentry.captureException(error);
			console.log(error);
			toast({
				variant: "destructive",
				title: "Rates were Not Updated",
				description: "Something went wrong...",
				toastStatus: "negative",
			});
		} finally {
			refreshCurrentUser();
		}
	};

	useEffect(() => {
		if (creatorUser) {
			const sessionTriggeredRef = doc(
				db,
				"sessionTriggered",
				creatorUser?._id as string
			);

			const unsubscribeSessionTriggered = onSnapshot(
				sessionTriggeredRef,
				(doc) => {
					if (doc.exists()) {
						const currentCount = doc.data().count || 0;

						if (currentCount >= 3) {
							// Update each of the services to false
							const newServices = {
								myServices: false,
								videoCall: false,
								audioCall: false,
								chat: false,
								isRestricted: false,
							};

							setServices(newServices);
						}
					}
				},
				(error) => {
					console.error("Error fetching session triggered snapshot: ", error);
				}
			);

			// Clean up the listener on unmount
			return () => {
				unsubscribeSessionTriggered();
			};
		}
	}, [creatorUser]);

	if (loading || !creatorUser || !isInitialized)
		return (
			<section className="w-full h-full flex flex-col items-center justify-center">
				<ContentLoading />

				{!creatorUser && !loading && (
					<span className="text-red-500 font-semibold text-lg">
						User Authentication Required
					</span>
				)}

				{creatorUser && loading && (
					<p className="text-green-1 font-semibold text-lg flex items-center gap-2">
						Fetching Creator&apos;s Details{" "}
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							width={24}
							height={24}
							className="invert"
							priority
						/>
					</p>
				)}
			</section>
		);

	const imageSrc = getImageSource(creatorUser);
	const fullName = getDisplayName(creatorUser);

	return (
		<>
			<div
				className={`relative size-full 2xl:w-[90%] mx-auto flex flex-col md:pt-4 md:rounded-t-xl`}
				style={{ backgroundColor: theme }}
			>
				<div className="size-full grid grid-cols-1 justify-center items-center p-4 gap-2.5">
					<Image
						src={imageSrc}
						width={1000}
						height={1000}
						alt="avatar"
						className="bg-white w-32 h-32 rounded-full object-cover mx-auto"
					/>
					<section className="size-full flex flex-col items-center justify-center overflow-hidden">
						<p className="font-semibold text-2xl max-w-[92%] text-ellipsis whitespace-nowrap overflow-hidden capitalize">
							{fullName}
						</p>
						<span className="text-sm">
							{creatorUser?.creatorId?.startsWith("@")
								? creatorUser.creatorId
								: `@${creatorUser?.username}`}
						</span>
					</section>
				</div>
				<div className="flex-grow flex flex-col gap-4 bg-gray-50 rounded-t-3xl p-4">
					<CopyToClipboard
						link={
							creatorLink ?? `https://flashcall.me/${creatorUser?.username}`
						}
						username={
							creatorUser.username ? creatorUser.username : creatorUser.phone
						}
						profession={creatorUser.profession ?? "Astrologer"}
						gender={creatorUser.gender ?? ""}
						firstName={creatorUser.firstName}
						lastName={creatorUser.lastName}
					/>

					{/* restriction warning */}
					{showRestrictedWarning && (
						<section className="flex flex-col gap-4 items-start justify-center rounded-lg bg-[#FFECEC] border border-red-500 p-3 shadow-sm">
							{/* heading */}
							<section className="w-full flex items-center justify-between">
								<section className="flex items-center w-full gap-4">
									<span className="bg-red-500 text-white rounded-full p-1 hoverScaleDownEffect cursor-pointer">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="size-5 text-white"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
											/>
										</svg>
									</span>

									<span className="font-bold">Account Temporarily Blocked</span>
								</section>

								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="size-6 hoverScaleDownEffect cursor-pointer"
									onClick={() => setShowRestrictedWarning(false)}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M6 18 18 6M6 6l12 12"
									/>
								</svg>
							</section>

							{/* subheading */}
							<section className="w-full flex items-center justify-between gap-7">
								<span className="text-xs">
									We’ve temporarily paused your account, so you won’t be able to
									take calls at this time
								</span>
								<span className="text-green-1 text-xs hoverScaleDownEffect">
									Help
								</span>
							</section>
						</section>
					)}

					<section className="flex flex-col justify-between border rounded-lg bg-white p-2 shadow-sm">
						<div className="flex flex-row justify-between items-center p-2 border-b">
							<span className="text-gray-400 font-semibold">My Services</span>
							<label className="relative inline-block w-14 h-6">
								<input
									disabled={services.isRestricted}
									type="checkbox"
									className={`${
										services.isRestricted && "!cursor-not-allowed"
									} toggle-checkbox absolute w-0 h-0 opacity-0`}
									checked={services.myServices}
									onChange={() => handleToggle("myServices")}
								/>
								<p
									className={`toggle-label block overflow-hidden h-6 rounded-full ${
										services.myServices ? "bg-green-600" : "bg-gray-500"
									} ${
										services.isRestricted
											? "!cursor-not-allowed"
											: "cursor-pointer"
									} servicesCheckbox`}
									style={{
										justifyContent: services.myServices
											? "flex-end"
											: "flex-start",
									}}
								>
									<span
										className="servicesCheckboxContent"
										style={{
											transition: "transform 0.3s",
											transform: services.myServices
												? "translateX(2.1rem)"
												: "translateX(0)",
										}}
									/>
								</p>
							</label>
						</div>

						<ServicesCheckbox
							setIsPriceEditOpen={setIsPriceEditOpen}
							services={{
								videoCall: services.videoCall,
								audioCall: services.audioCall,
								chat: services.chat,
							}}
							isRestricted={services.isRestricted}
							handleToggle={handleToggle}
							prices={prices}
							globalPrices={globalPrices}
						/>
					</section>
				</div>
				{isPriceEditOpen && (
					<PriceEditModal
						onClose={() => setIsPriceEditOpen(false)}
						onSave={handleSavePrices}
						currentPrices={prices}
						currentGlobalPrices={globalPrices}
					/>
				)}
			</div>
		</>
	);
};

export default CreatorHome;
