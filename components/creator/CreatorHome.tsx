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
import ServicesCheckbox from "../creatorServices/ServicesCheckbox";
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
import DiscountServiceCards from "../creatorServices/DiscountServiceCards";

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
		}

		fetchTotalCalls();
	}, [])

	const fetchTransactions = async () => {
		try {
			setTransactionsLoading(true);
			// Get today's date in local YYYY-MM-DD format
			const today = new Date();
			const localDate = today.toLocaleDateString("en-CA"); // 'en-CA' gives YYYY-MM-DD format

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
			<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center">
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
			<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-gray-500">
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

					{/* <DiscountServiceCards creator={creatorUser} /> */}

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
				<div
					className={`relative bg-white size-full mx-auto flex flex-col`}
				>
					<div className="w-full mb-4">
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
								<div className="px-4 py-2 text-white text-sm h-fit bg-[#16BC88] rounded-full hoverScaleDownEffect">
									<Link
										href="/profile/editProfile"
										className="whitespace-nowrap"
									>
										Edit Profile
									</Link>
								</div>
							</div>
						</div>
					</div>
					<div className="flex-grow flex flex-col gap-6">
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

						<section className="flex flex-row gap-6 justify-between bg-white">
							<div className="flex flex-row gap-3 w-full border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] rounded-xl">
								<div className="flex flex-col p-6 w-full">
									<div className="flex flex-row w-full justify-between">
										<p className="text-[#6B7280] text-sm">Today's Earning</p>
										<Image
											src={"/creator/todayTransaction.svg"}
											width={100}
											height={100}
											alt="img"
											className="size-4"
										/>
									</div>
									<p className="text-lg font-bold">
										{transactionsLoading ? "Fetching..." : `Rs. ${todaysEarning}`}
									</p>
								</div>
							</div>
							<div className="flex flex-row gap-3 w-full border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] rounded-xl">
								<div className="flex flex-col p-6 w-full">
									<div className="flex flex-row w-full justify-between">
										<p className="text-[#6B7280] text-sm">Total Balance</p>
										<Image
											src={"/creator/wallet.svg"}
											width={100}
											height={100}
											alt="img"
											className="size-4"
										/>
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
										<Image
											src={"/creator/call.svg"}
											width={100}
											height={100}
											alt="img"
											className="size-4"
										/>
									</div>
									<p className="text-lg font-bold">
										{totalCalls}
									</p>
								</div>
							</div>
						</section>
						<section className="flex flex-col justify-between p-1">
							<div className="flex flex-row justify-between items-center p-2">
								<span className="text-black text-lg font-bold">My Services</span>
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
								<Link href={"/home"} className="text-[#16BC88]">
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
