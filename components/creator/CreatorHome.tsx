"use client";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import Link from "next/link";
import PriceEditModal from "./PriceEditModal";
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
import ServicesCheckbox from "../discountServices/ServicesCheckbox";
import CopyToClipboard from "../shared/CopyToClipboard";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import ContentLoading from "../shared/ContentLoading";
import CreatorLinks from "./CreatorLinks";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/mixpanel";
import usePlatform from "@/hooks/usePlatform";
import ProfileDialog from "./ProfileDialog";
import useServices from "@/hooks/useServices";
import Loader from "../shared/Loader";

const CreatorHome = () => {
	const { creatorUser, refreshCurrentUser, fetchingUser } =
		useCurrentUsersContext();
	const { updateWalletBalance } = useWalletBalanceContext();
	const { services, handleToggle, setServices } = useServices();
	const { getDevicePlatform } = usePlatform();
	const { toast } = useToast();
	const [showRestrictedWarning, setShowRestrictedWarning] = useState(
		services.isRestricted ?? false
	);
	const [transactionsLoading, setTransactionsLoading] = useState(false);

	const [creatorLink, setCreatorLink] = useState<string | null>(null);
	const [todaysEarning, setTodaysEarning] = useState(0);
	const [totalCalls, setTotalCalls] = useState();
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
	}, [creatorUser?._id]);

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
		const fetchTotalCalls = async () => {
			const response = await axios.get(`${backendBaseUrl}/calls/getUserCalls`, {
				params: {
					userId: creatorUser?._id,
					userType: "Creator",
					limit: 1,
				},
			});
			const data = response.data;
			setTotalCalls(data.totalCalls);
		};

		fetchTotalCalls();
	}, []);

	const fetchTransactions = async () => {
		try {
			setTransactionsLoading(true);
			const today = new Date();
			const localDate = today.toLocaleDateString("en-CA");

			const response = await axios.get(
				`${backendBaseUrl}/wallet/transactions/user/${creatorUser?._id}/date`,
				{ params: { date: localDate } }
			);
			const fetchedTransactions = response.data.transactions;
			const totalEarnings = calculateTotalEarnings(fetchedTransactions);

			setTodaysEarning(totalEarnings.toFixed(2));
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error fetching transactions:", error);
		} finally {
			setTransactionsLoading(false);
		}
	};

	useEffect(() => {
		if (creatorUser) {
			try {
				const creatorRef = doc(db, "transactions", creatorUser?._id);
				const unsubscribe = onSnapshot(
					creatorRef,
					(doc) => {
						const data = doc.data();

						if (data) {
							updateWalletBalance();
							fetchTransactions();
						}
					},
					(error) => {
						console.error("Error fetching snapshot: ", error);
						// Optional: Retry or fallback logic when Firebase is down
						updateWalletBalance();
						fetchTransactions();
					}
				);

				return () => unsubscribe();
			} catch (error) {
				console.error("Error connecting to Firebase: ", error);
			}
		}
	}, [creatorUser?._id]);

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
					undefined, // Explicitly set `status` if not applicable
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

	if (fetchingUser) {
		return (
			<div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center">
				<ContentLoading />
				<p className="text-green-1 font-semibold text-lg flex items-center gap-2">
					Fetching Creator&apos;s Details{" "}
					<Image
						src="/icons/loading-circle.svg"
						alt="Loading..."
						width={24}
						height={24}
						priority
					/>
				</p>
			</div>
		);
	}

	const isAuthenticated = !!creatorUser;

	if (!isAuthenticated) {
		return !fetchingUser ? (
			<div className="size-full h-[calc(100vh-6rem)] flex items-center justify-center text-2xl font-semibold text-center text-gray-500">
				No creators found.
			</div>
		) : (
			<Loader />
		);
	}

	const imageSrc = getImageSource(creatorUser);
	const fullName = getDisplayName(creatorUser);

	return (
		<div className="size-full">
			<div
				className={`relative size-full 2xl:w-[90%] mx-auto flex flex-col md:pt-4 md:rounded-t-xl lg:hidden`}
				style={{ backgroundColor: theme }}
			>
				<div className="flex justify-end p-2 absolute top-2 right-2">
					<Link
						href="/profile/editProfile"
						className="px-4 py-2 text-black text-sm h-auto w-auto bg-white rounded-full hoverScaleDownEffect"
					>
						Edit Profile
					</Link>
				</div>
				<div className="flex flex-col items-center justify-center p-4 gap-2.5">
					<ProfileDialog creator={creatorUser} imageSrc={imageSrc} />
					<section className="size-full flex flex-col items-center justify-center overflow-hidden">
						<p className="font-bold text-2xl max-w-[92%] text-ellipsis whitespace-nowrap overflow-hidden capitalize">
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
							creatorUser.username
								? creatorUser.username
								: (creatorUser.phone as string)
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

					<section className="flex flex-row justify-between border rounded-lg bg-white p-2 shadow-sm">
						<div className="flex flex-row pl-2 gap-3">
							<Image
								src={"/wallet-creator.svg"}
								width={0}
								height={0}
								alt="wallet"
								className="w-auto h-auto p-2 bg-green-200 rounded-md "
							/>
							<div className="flex flex-col">
								<p className="text-gray-400 text-[10px]">Todays Earning</p>
								<p className="text-[15px] font-bold">
									{transactionsLoading ? "Fetching..." : `Rs. ${todaysEarning}`}
								</p>
							</div>
						</div>
						<Link href={"/payment"} className="flex items-center">
							<Button className="bg-green-600 w-auto h-auto text-white rounded-lg hover:bg-green-700">
								View Wallet
							</Button>
						</Link>
					</section>
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

					<CreatorLinks />

					<section className="flex items-center justify-center pt-4">
						<div className="text-center text-[13px] text-gray-400">
							If you are interested in learning how to create an account on{" "}
							<b>Flashcall</b> and how it works. <br />{" "}
							<Link href={"/home"} className="text-green-1">
								{" "}
								<b> please click here. </b>{" "}
							</Link>
						</div>
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

			{/* New Design */}

			<div className="hidden size-full lg:block bg-white p-8">
				<div className={`relative bg-white size-full mx-auto flex flex-col`}>
					<div className="flex flex-col gap-6 w-full mb-8 bg-[#EFF6FF] p-6 rounded-lg">
						<div className="flex gap-3 w-full">
							<ProfileDialog creator={creatorUser} imageSrc={imageSrc} />
							<div className="flex w-full p-2 pr-0 justify-between">
								<section className="size-full flex flex-col overflow-hidden">
									<p className="font-bold text-xl max-w-[92%] text-ellipsis whitespace-nowrap overflow-hidden capitalize">
										{fullName}
									</p>
									<span className="text-sm text-[#6B7280]">
										{creatorUser?.creatorId?.startsWith("@")
											? creatorUser.creatorId
											: `@${creatorUser?.username}`}
									</span>
								</section>
								<div className="px-4 py-2 flex gap-2 items-center text-white text-sm h-fit bg-black rounded-full hoverScaleDownEffect">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										xmlnsXlink="http://www.w3.org/1999/xlink"
										fill="none"
										version="1.1"
										width="14"
										height="14"
										viewBox="0 0 14 14"
									>
										<defs>
											<clipPath id="master_svg0_1_018">
												<rect x="0" y="0" width="14" height="14" rx="0" />
											</clipPath>
										</defs>
										<g clip-path="url(#master_svg0_1_018)">
											<g transform="matrix(1,0,0,-1,0,28.6015625)">
												<g>
													<path
														d="M13.0335,27.699181250000002Q12.5365,28.164081250000002,11.929,28.164081250000002Q11.3215,28.164081250000002,10.8245,27.699181250000002L9.99606,26.87888125L12.7022,24.19922125L13.5306,25.01958125Q14,25.511681250000002,14,26.11328125Q14,26.714881249999998,13.5306,27.20708125L13.0335,27.699181250000002ZM4.74951,21.68359125Q4.50099,21.43750125,4.39053,21.08203125L3.56213,18.67578125Q3.45168,18.29297125,3.72781,17.99219125Q4.03156,17.71875125,4.41815,17.82812125L6.87574,18.64844125Q7.2071,18.75781125,7.45562,19.00390125L12.0947,23.59766125L9.38856,26.277381249999998L4.74951,21.68359125ZM2.65089,26.55078125Q1.51874,26.52348125,0.773176,25.78518125Q0.0276134,25.04688125,0,23.92578125L0,16.92578125Q0.0276134,15.80469125,0.773176,15.06640625Q1.51874,14.32812505,2.65089,14.30078125L9.71992,14.30078125Q10.8521,14.32812505,11.5976,15.06640625Q12.3432,15.80469125,12.3708,16.92578125L12.3708,19.55078125Q12.3708,19.93359125,12.1223,20.17969125Q11.8738,20.42578125,11.4872,20.42578125Q11.1006,20.42578125,10.8521,20.17969125Q10.6035,19.93359125,10.6035,19.55078125L10.6035,16.92578125Q10.6035,16.54297125,10.355,16.29687125Q10.1065,16.05078125,9.71992,16.05078125L2.65089,16.05078125Q2.2643,16.05078125,2.01578,16.29687125Q1.76726,16.54297125,1.76726,16.92578125L1.76726,23.92578125Q1.76726,24.30858125,2.01578,24.55468125Q2.2643,24.80078125,2.65089,24.80078125L5.30177,24.80078125Q5.68836,24.80078125,5.93688,25.04688125Q6.1854,25.29298125,6.1854,25.67578125Q6.1854,26.05858125,5.93688,26.30468125Q5.68836,26.55078125,5.30177,26.55078125L2.65089,26.55078125Z"
														fill="#FFFFFF"
														fill-opacity="1"
													/>
												</g>
											</g>
										</g>
									</svg>
									<Link
										href="/profile/editProfile"
										className="whitespace-nowrap"
									>
										Edit Profile
									</Link>
								</div>
							</div>
						</div>
						<CopyToClipboard
							link={
								creatorLink ?? `https://flashcall.me/${creatorUser?.username}`
							}
							username={
								creatorUser.username
									? creatorUser.username
									: (creatorUser.phone as string)
							}
							profession={creatorUser.profession ?? "Astrologer"}
							gender={creatorUser.gender ?? ""}
							firstName={creatorUser.firstName}
							lastName={creatorUser.lastName}
						/>
					</div>
					<div className="flex-grow flex flex-col gap-6">
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

										<span className="font-bold">
											Account Temporarily Blocked
										</span>
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
										We’ve temporarily paused your account, so you won’t be able
										to take calls at this time
									</span>
									<span className="text-green-1 text-xs hoverScaleDownEffect">
										Help
									</span>
								</section>
							</section>
						)}

						<section className="flex flex-row gap-6 justify-between bg-white">
							<div className="flex flex-row gap-3 w-full border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] rounded-xl">
								<div className="flex flex-col p-6 w-full">
									<div className="flex flex-row w-full justify-between">
										<p className="text-[#6B7280] text-sm">
											Today&apos;s Earning
										</p>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											xmlnsXlink="http://www.w3.org/1999/xlink"
											fill="none"
											version="1.1"
											width="16"
											height="16"
											viewBox="0 0 16 16"
										>
											<defs>
												<clipPath id="master_svg0_3_7786">
													<rect x="0" y="0" width="16" height="16" rx="0" />
												</clipPath>
											</defs>
											<g clip-path="url(#master_svg0_3_7786)">
												<g transform="matrix(1,0,0,-1,0,30.6875)">
													<g>
														<path
															d="M2,28.34375Q2,28.78125,1.71875,29.06255Q1.4375,29.34375,1,29.34375Q0.5625,29.34375,0.28125,29.06255Q0,28.78125,0,28.34375L0,17.84375Q0.03125,16.78125,0.71875,16.0625Q1.4375,15.375,2.5,15.34375L15,15.34375Q15.4375,15.34375,15.7188,15.625Q16,15.90625,16,16.34375Q16,16.78125,15.7188,17.0625Q15.4375,17.34375,15,17.34375L2.5,17.34375Q2.03125,17.375,2,17.84375L2,28.34375ZM14.7188,25.62495Q15,25.93755,15,26.34375Q15,26.74995,14.7188,27.06255Q14.4062,27.34375,14,27.34375Q13.5938,27.34375,13.2812,27.06255L10,23.75L8.21875,25.56255Q7.90625,25.84375,7.5,25.84375Q7.09375,25.84375,6.78125,25.56255L3.28125,22.0625Q3,21.75,3,21.34375Q3,20.9375,3.28125,20.625Q3.59375,20.34375,4,20.34375Q4.40625,20.34375,4.71875,20.625L7.5,23.4375L9.28125,21.625Q9.59375,21.34375,10,21.34375Q10.4062,21.34375,10.7188,21.625L14.7188,25.62495Z"
															fill="#000000"
															fill-opacity="1"
														/>
													</g>
												</g>
											</g>
										</svg>
									</div>
									<p className="text-lg font-bold">
										{transactionsLoading
											? "Fetching..."
											: `Rs. ${todaysEarning}`}
									</p>
								</div>
							</div>
							<div className="flex flex-row gap-3 w-full border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] rounded-xl">
								<div className="flex flex-col p-6 w-full">
									<div className="flex flex-row w-full justify-between">
										<p className="text-[#6B7280] text-sm">Total Balance</p>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											xmlnsXlink="http://www.w3.org/1999/xlink"
											fill="none"
											version="1.1"
											width="16"
											height="16"
											viewBox="0 0 16 16"
										>
											<defs>
												<clipPath id="master_svg0_3_7791">
													<rect x="0" y="0" width="16" height="16" rx="0" />
												</clipPath>
											</defs>
											<g clip-path="url(#master_svg0_3_7791)">
												<g transform="matrix(1,0,0,-1,0,30.6875)">
													<g>
														<path
															d="M2,29.34375Q1.15625,29.31255,0.59375,28.74995Q0.03125,28.18755,0,27.34375L0,17.34375Q0.03125,16.5,0.59375,15.9375Q1.15625,15.375,2,15.34375L14,15.34375Q14.8438,15.375,15.4062,15.9375Q15.9688,16.5,16,17.34375L16,24.34375Q15.9688,25.1875,15.4062,25.74995Q14.8438,26.31255,14,26.34375L2.5,26.34375Q2.03125,26.37495,2,26.84375Q2.03125,27.31255,2.5,27.34375L14,27.34375Q14.4375,27.34375,14.7188,27.62495Q15,27.90625,15,28.34375Q15,28.78125,14.7188,29.06255Q14.4375,29.34375,14,29.34375L2,29.34375ZM13,21.84375Q13.4375,21.84375,13.7188,21.5625Q14,21.28125,14,20.84375Q14,20.40625,13.7188,20.125Q13.4375,19.84375,13,19.84375Q12.5625,19.84375,12.2812,20.125Q12,20.40625,12,20.84375Q12,21.28125,12.2812,21.5625Q12.5625,21.84375,13,21.84375Z"
															fill="#000000"
															fill-opacity="1"
														/>
													</g>
												</g>
											</g>
										</svg>
									</div>
									<p className="text-lg font-bold">
										{`Rs. ${creatorUser.walletBalance}`}
									</p>
								</div>
							</div>
							<div className="flex flex-row gap-3 w-full border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] rounded-xl">
								<div className="flex flex-col p-6 w-full">
									<div className="flex flex-row w-full justify-between">
										<p className="text-[#6B7280] text-sm">Total Calls</p>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											xmlnsXlink="http://www.w3.org/1999/xlink"
											fill="none"
											version="1.1"
											width="16"
											height="16"
											viewBox="0 0 16 16"
										>
											<defs>
												<clipPath id="master_svg0_3_7796">
													<rect x="0" y="0" width="16" height="16" rx="0" />
												</clipPath>
											</defs>
											<g clip-path="url(#master_svg0_3_7796)">
												<g transform="matrix(1,0,0,-1,0,32.6875)">
													<g>
														<path
															d="M5.13619,31.56255Q4.94942,32.03125,4.54475,32.21875Q4.10895,32.40625,3.64202,32.31255L0.902724,31.56255Q0.0622568,31.24995,0,30.34375Q0.0311284,26.43755,1.89883,23.28125Q3.76654,20.125,6.91051,18.25Q10.0545,16.375,13.9455,16.34375Q14.8482,16.40625,15.1595,17.25L15.9066,20Q16,20.46875,15.8132,20.90625Q15.6265,21.3125,15.1595,21.5L12.1712,22.75Q11.3307,23.03125,10.7393,22.375L9.49416,20.84375Q7.84436,21.625,6.53696,22.90625Q5.2607,24.21875,4.48249,25.875L6.00778,27.12495Q6.66148,27.71875,6.38132,28.56255L5.13619,31.56255Z"
															fill="#000000"
															fill-opacity="1"
														/>
													</g>
												</g>
											</g>
										</svg>
									</div>
									<p className="text-lg font-bold">{totalCalls}</p>
								</div>
							</div>
						</section>
						<section className="flex flex-col justify-between">
							<div className="flex flex-row justify-between items-center p-2">
								<span className="text-black text-lg font-bold">
									My Services
								</span>
								{/* <label className="relative inline-block w-14 h-6">
									<input
										disabled={services.isRestricted}
										type="checkbox"
										className={`${services.isRestricted && "!cursor-not-allowed"
											} toggle-checkbox absolute w-0 h-0 opacity-0`}
										checked={services.myServices}
										onChange={() => handleToggle("myServices")}
									/>
									<p
										className={`toggle-label block overflow-hidden h-6 rounded-full ${services.myServices ? "bg-green-600" : "bg-gray-500"
											} ${services.isRestricted
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
								</label> */}
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

						{/* <DiscountServiceCards creator={creatorUser} /> */}

						<CreatorLinks />

						<section className="flex items-center justify-center pt-4">
							<div className="text-center text-[13px] text-gray-400">
								If you are interested in learning how to create an account on{" "}
								<b>Flashcall</b> and how it works. <br />{" "}
								<Link href={"/home"} className="text-black">
									{" "}
									<b> please click here. </b>{" "}
								</Link>
							</div>
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
			</div>
		</div>
	);
};

export default CreatorHome;
